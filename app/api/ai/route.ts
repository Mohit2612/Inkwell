import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

// ── Request schema ────────────────────────────────────────────────

const bodySchema = z.discriminatedUnion("task", [
  z.object({
    task: z.literal("rewrite-bullet"),
    text: z.string().min(1, "text is required").max(500),
  }),
  z.object({
    task: z.literal("summary"),
    role: z.string().max(100).optional(),
    context: z.string().max(1000).optional(),
  }),
  z.object({
    task: z.literal("cover-letter"),
    fullName: z.string().max(100).optional(),
    company: z.string().max(100).optional(),
    position: z.string().max(100).optional(),
    positionHighlight: z.string().max(500).optional(),
    educationHighlight: z.string().max(500).optional(),
    skills: z.string().max(500).optional(),
  }),
  // Conversational Resume Agent. resumeContext is a compact text snapshot of the
  // current resume; jobDescription is optional for tailoring questions.
  z.object({
    task: z.literal("agent"),
    message: z.string().min(1, "message is required").max(2000),
    resumeContext: z.string().max(6000).optional(),
    jobDescription: z.string().max(6000).optional(),
  }),
  // Suggest a comma-separated list of skills for a role / job description.
  z.object({
    task: z.literal("skills"),
    role: z.string().max(100).optional(),
    jobDescription: z.string().max(6000).optional(),
    existing: z.string().max(2000).optional(),
  }),
  // Rewrite a piece of text (summary or bullet) to align with a job description.
  z.object({
    task: z.literal("tailor"),
    text: z.string().min(1, "text is required").max(1500),
    jobDescription: z.string().max(6000).optional(),
  }),
]);

type Body = z.infer<typeof bodySchema>;

// ── Rate limit config: 20 req / min per IP ────────────────────────
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

// ── Handler ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Rate limit check
  const ip = getClientIp(req);
  const rl = rateLimit(`ai:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
        },
      }
    );
  }

  // 2. Parse + validate body
  let body: Body;
  try {
    const raw = await req.json();
    const result = bodySchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request.", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    body = result.data;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  // 3. No key → fast local fallback (dev mode)
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "sk-placeholder") {
    return NextResponse.json({
      result: localFallback(body),
      note: "OPENAI_API_KEY not configured — returning local heuristic.",
    });
  }

  // 4. Call OpenAI
  const openai = new OpenAI({ apiKey: key });
  const prompt = buildPrompt(body);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume and cover letter writer who optimizes for ATS systems and recruiter readability.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens:
        body.task === "cover-letter" || body.task === "agent"
          ? 500
          : body.task === "tailor"
          ? 220
          : 160,
    });
    const result = completion.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json(
      { result },
      {
        headers: {
          "X-RateLimit-Remaining": String(rl.remaining),
          "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
        },
      }
    );
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "/api/ai", task: body.task } });
    return NextResponse.json(
      {
        result: localFallback(body),
        note: "AI request failed — returning local heuristic.",
      },
      { status: 200 }
    );
  }
}

// ── Prompt builder ────────────────────────────────────────────────

function buildPrompt(body: Body): string {
  if (body.task === "agent") {
    return (
      "You are a resume coach. Answer the user's request directly and concisely. " +
      "When you suggest rewritten text, return the improved text itself (no preamble like 'Here is'). " +
      "Optimize for ATS keyword coverage and recruiter readability.\n\n" +
      (body.resumeContext ? `CURRENT RESUME:\n${body.resumeContext}\n\n` : "") +
      (body.jobDescription ? `TARGET JOB DESCRIPTION:\n${body.jobDescription}\n\n` : "") +
      `USER REQUEST: ${body.message}`
    );
  }
  if (body.task === "skills") {
    return (
      `List 10-15 resume-ready skills for a ${body.role ?? "professional"}. ` +
      (body.jobDescription ? `Prioritise skills found in this job description:\n${body.jobDescription}\n` : "") +
      (body.existing ? `Avoid duplicating these already-listed skills: ${body.existing}. ` : "") +
      "Return ONLY a single comma-separated line of skills, no numbering, no commentary."
    );
  }
  if (body.task === "tailor") {
    return (
      "Rewrite the text below so it naturally incorporates the most relevant keywords " +
      "from the target job description, without inventing experience. Keep the same length and tone. " +
      "Return ONLY the rewritten text.\n\n" +
      (body.jobDescription ? `JOB DESCRIPTION:\n${body.jobDescription}\n\n` : "") +
      `TEXT:\n${body.text}`
    );
  }
  if (body.task === "summary") {
    return (
      `Write a 2-sentence professional resume summary for a ${body.role ?? "professional"}. ` +
      `Context: ${body.context ?? ""}. ` +
      "Be specific, confident, and metric-driven where possible. No first-person pronouns."
    );
  }
  if (body.task === "cover-letter") {
    return (
      "Write a professional, tailored cover letter (3 short paragraphs, no greeting line, no sign-off). " +
      `Candidate: ${body.fullName ?? "the candidate"}. ` +
      `Applying for ${body.position ?? "the role"} at ${body.company ?? "the company"}. ` +
      `Position highlight: ${body.positionHighlight ?? "-"}. ` +
      `Education highlight: ${body.educationHighlight ?? "-"}. ` +
      `Key skills: ${body.skills ?? "-"}. ` +
      "Open with a strong hook, show fit with concrete value, and close with enthusiasm. Keep it under 220 words."
    );
  }
  // rewrite-bullet
  return (
    "Rewrite this resume bullet to be concise, action-led, and quantified where reasonable. " +
    "Start with a strong past-tense verb. Keep it to one line. Return only the rewritten bullet, no quotes.\n\n" +
    `Bullet: ${body.text}`
  );
}

// ── Local fallback (no API key / OpenAI down) ─────────────────────

export function localFallback(body: Body): string {
  if (body.task === "agent") {
    const wantsSummary = /summary|profile|objective/i.test(body.message);
    const wantsBullet = /bullet|experience|achievement|accomplish/i.test(body.message);
    if (wantsSummary) {
      return "Results-driven professional with a track record of measurable impact. Combines strong technical execution with clear communication to ship outcomes. (Connect an OpenAI key for tailored suggestions.)";
    }
    if (wantsBullet) {
      return "Delivered a key initiative end to end, improving a measurable metric by a meaningful margin and reducing manual effort for the team. (Connect an OpenAI key for tailored suggestions.)";
    }
    return "I can rewrite your summary, sharpen bullet points, suggest missing skills, and tailor your resume to a job description. Tell me which section to work on. (Add an OPENAI_API_KEY for full AI responses.)";
  }
  if (body.task === "skills") {
    return "Communication, Problem Solving, Project Management, Data Analysis, Stakeholder Management, Time Management, Cross-functional Collaboration, Process Improvement";
  }
  if (body.task === "tailor") {
    return body.text.trim();
  }
  if (body.task === "summary") {
    return "Results-driven professional with a track record of shipping measurable impact. Combines strong technical execution with clear communication to move projects forward.";
  }
  if (body.task === "cover-letter") {
    const role = body.position ?? "this role";
    const company = body.company ?? "your team";
    return (
      `I'm excited to apply for ${role} at ${company}. ${body.positionHighlight ?? "My background"} maps directly to what this role needs, and I've consistently turned that experience into measurable results.\n\n` +
      `${body.educationHighlight ? body.educationHighlight + ". " : ""}My core strengths — ${body.skills ?? "the skills this role calls for"} — let me contribute from day one while continuing to grow with the team.\n\n` +
      `I'd welcome the chance to discuss how I can help ${company} reach its goals. Thank you for your time and consideration.`
    );
  }
  // rewrite-bullet
  const t = body.text.trim();
  if (!t) return "Delivered measurable results by owning the task end to end.";
  const startsWithVerb = /^(led|built|shipped|drove|cut|grew|launched|designed)/i.test(t);
  return `${startsWithVerb ? "" : "Drove "}${t.charAt(0).toLowerCase()}${t.slice(1)}`.replace(
    /\.$/,
    ""
  ) + ", improving a key metric.";
}
