import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ResumeData, emptyResumeData, defaultFormat } from "@/lib/types";

export const runtime = "nodejs";

// ── PDF text extraction using pdfjs-dist (more reliable than pdf-parse) ──

async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore – pdfjs-dist v6 ships ESM only; legacy build has no .d.ts for .mjs
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = (content.items as Array<{ str?: string }>)
      .map((item) => item.str ?? "")
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n");
}

// ── DOCX text extraction ──────────────────────────────────────────

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// ── Robust normalizers (handle null / array / string from AI) ─────

function ns(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return v.map((x) => String(x ?? "").trim()).filter(Boolean).join(", ");
  return String(v).trim();
}

function bullets(v: unknown): string[] {
  if (Array.isArray(v)) {
    const arr = v.map((b) => ns(b)).filter(Boolean);
    return arr.length > 0 ? arr : [""];
  }
  const s = ns(v);
  return s ? [s] : [""];
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

// ── Build full ResumeData from AI JSON ────────────────────────────

function mergeWithEmpty(raw: Record<string, unknown>): ResumeData {
  const c = ((raw.contact ?? {}) as Record<string, unknown>);

  const experience: ResumeData["experience"] = arr(raw.experience).map((item) => {
    const e = (item ?? {}) as Record<string, unknown>;
    return {
      id: crypto.randomUUID(),
      role: ns(e.role),
      company: ns(e.company),
      start: ns(e.start),
      end: ns(e.end),
      location: ns(e.location),
      bullets: bullets(e.bullets),
    };
  });

  const projects: ResumeData["projects"] = arr(raw.projects).map((item) => {
    const p = (item ?? {}) as Record<string, unknown>;
    return {
      id: crypto.randomUUID(),
      title: ns(p.title),
      organization: ns(p.organization),
      start: ns(p.start),
      end: ns(p.end),
      url: ns(p.url),
      bullets: bullets(p.bullets),
    };
  });

  const education: ResumeData["education"] = arr(raw.education).map((item) => {
    const e = (item ?? {}) as Record<string, unknown>;
    return {
      id: crypto.randomUUID(),
      degree: ns(e.degree),
      school: ns(e.school),
      location: ns(e.location),
      year: ns(e.year),
      minor: ns(e.minor),
      gpa: ns(e.gpa),
      info: ns(e.info),
    };
  });

  const certifications: ResumeData["certifications"] = arr(raw.certifications).map((item) => {
    const cert = (item ?? {}) as Record<string, unknown>;
    return {
      id: crypto.randomUUID(),
      name: ns(cert.name),
      issuer: ns(cert.issuer),
      date: ns(cert.date),
      relevance: ns(cert.relevance),
    };
  });

  const skillGroups: ResumeData["skillGroups"] = arr(raw.skillGroups).map((item) => {
    const sg = (item ?? {}) as Record<string, unknown>;
    const content = Array.isArray(sg.content)
      ? sg.content.map((s) => ns(s)).filter(Boolean).join(", ")
      : ns(sg.content);
    return {
      id: crypto.randomUUID(),
      title: ns(sg.title) || "Skills",
      content,
    };
  });

  return {
    contact: {
      fullName: ns(c.fullName),
      title: ns(c.title),
      email: ns(c.email),
      phone: ns(c.phone),
      linkedin: ns(c.linkedin),
      website: ns(c.website),
      country: ns(c.country),
      state: ns(c.state),
      city: ns(c.city),
      showState: true,
    },
    summary: ns(raw.summary),
    experience,
    projects,
    education,
    certifications,
    skillGroups,
    format: defaultFormat(),
  };
}

// ── Regex fallback parser (no AI key) ────────────────────────────

function parseTextFallback(text: string): ResumeData {
  const data = emptyResumeData();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w+/);
  if (emailMatch) data.contact.email = emailMatch[0];

  const phoneMatch = text.match(/[\+]?[\d][\d\s\-\(\)\.]{8,14}/);
  if (phoneMatch) data.contact.phone = phoneMatch[0].trim();

  const liMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  if (liMatch) data.contact.linkedin = liMatch[0];

  const nonContact = lines.filter(
    (l) => !l.includes("@") && !/^[\d\+\(\)]+/.test(l) && l.length < 80
  );
  if (nonContact[0]) data.contact.fullName = nonContact[0];
  if (nonContact[1]) data.contact.title = nonContact[1];

  const sectionRe =
    /^(EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT|EDUCATION|SKILLS?|TECHNICAL SKILLS?|PROJECTS?|CERTIFICATIONS?|SUMMARY|PROFILE|OBJECTIVE)/i;

  let section = "";
  const sections: Record<string, string[]> = {};

  for (const line of lines) {
    if (sectionRe.test(line)) {
      section = line.replace(/[:\s]+$/, "").toUpperCase();
      sections[section] = [];
    } else if (section) {
      sections[section].push(line);
    }
  }

  const get = (re: RegExp) =>
    Object.entries(sections).find(([k]) => re.test(k))?.[1] ?? [];

  const summaryLines = get(/SUMMARY|PROFILE|OBJECTIVE/);
  if (summaryLines.length) data.summary = summaryLines.join(" ");

  const skillLines = get(/SKILL/);
  if (skillLines.length) {
    data.skillGroups = [
      { id: crypto.randomUUID(), title: "Skills", content: skillLines.join(", ") },
    ];
  }

  return data;
}

// ── AI system prompt ──────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a precise resume parser for an ATS resume builder. You receive the full plain text of a resume (extracted from a PDF or DOCX) and return ONE valid JSON object that maps the resume to the app's exact data model.

STRICT RULES:
- Output ONLY a JSON object. No markdown, no code fences, no commentary.
- Extract ONLY what is explicitly present. NEVER invent, guess or hallucinate.
- Missing text field -> "". Missing list field -> []. Never use null.
- Do NOT rewrite, summarize or "improve" any content. Preserve the resume's original wording for summary, bullets and descriptions exactly.
- Do NOT generate id fields. The application assigns ids itself.

FIELD MAPPING (use these exact keys):
- contact.fullName: candidate's full name. If only one name token, put it here.
- contact.title: the professional headline / target job title (e.g. "QA Engineer").
- contact.email, contact.phone: keep phone as written, include country code.
- contact.linkedin, contact.website: URLs as written (no scheme needed).
- contact.country, contact.state, contact.city: split the location. If you can only find one location string, fill city with it and leave the rest "".
- summary: the professional summary / profile / objective paragraph.
- experience[]: { role, company, start, end, location, bullets[] }
    * role = job title, company = employer.
    * Each bullet point becomes one string in bullets[]; strip leading symbols (•, -, *).
- projects[]: { title, organization, start, end, url, bullets[] }
- education[]: { degree, school, location, year, minor, gpa, info }
    * year = graduation year only (e.g. "2024"). gpa = number as written.
    * minor and info "" if not present.
- certifications[]: { name, issuer, date, relevance }  (relevance "" if absent)
- skillGroups[]: { title, content }
    * Group related skills under a category title (e.g. "Programming", "Tools", "Soft Skills").
    * content = the skills for that group as ONE comma-separated string.
    * If the resume lists skills with no categories, return a single group: { "title": "Skills", "content": "skill1, skill2, ..." }

DATE FORMAT:
- experience/project start & end: "MMM YYYY" (e.g. "Jan 2023"). If only a year is shown, use "YYYY". If the role/project is ongoing, set end to "Present".
- Keep arrays in the order they appear (most recent first if the resume does).

Return JSON in EXACTLY this shape:
{
  "contact": { "fullName": "", "title": "", "email": "", "phone": "", "linkedin": "", "website": "", "country": "", "state": "", "city": "" },
  "summary": "",
  "experience": [ { "role": "", "company": "", "start": "", "end": "", "location": "", "bullets": [] } ],
  "projects": [ { "title": "", "organization": "", "start": "", "end": "", "url": "", "bullets": [] } ],
  "education": [ { "degree": "", "school": "", "location": "", "year": "", "minor": "", "gpa": "", "info": "" } ],
  "certifications": [ { "name": "", "issuer": "", "date": "", "relevance": "" } ],
  "skillGroups": [ { "title": "", "content": "" } ]
}`;

// ── Route handler ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const filename = file.name.toLowerCase();
  if (!filename.endsWith(".pdf") && !filename.endsWith(".docx") && !filename.endsWith(".doc")) {
    return NextResponse.json({ error: "Only PDF and DOCX files are supported." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // ── Extract raw text ──────────────────────────────────────────
  let text = "";
  try {
    if (filename.endsWith(".pdf")) {
      text = await extractPdfText(buffer);
    } else {
      text = await extractDocxText(buffer);
    }
  } catch (err) {
    console.error("[parse-resume] extraction error:", err);
    return NextResponse.json(
      { error: "Could not read the file. Please make sure it is a valid, non-password-protected PDF or DOCX." },
      { status: 422 }
    );
  }

  console.log(`[parse-resume] extracted ${text.length} chars from ${filename}`);

  if (!text.trim() || text.trim().length < 50) {
    return NextResponse.json(
      { error: "Could not find readable text in this file. It may be a scanned/image PDF. Please use a text-based PDF or DOCX." },
      { status: 422 }
    );
  }

  // ── Pick API credentials ──────────────────────────────────────
  const parseKey = process.env.RESUME_PARSE_API_KEY;
  const parseBase = process.env.RESUME_PARSE_BASE_URL;
  const parseModel = process.env.RESUME_PARSE_MODEL ?? "gpt-4o-mini";
  const openaiKey = process.env.OPENAI_API_KEY;

  const hasNvidia = !!(parseKey && parseBase);
  const hasOpenAI = !!(openaiKey && openaiKey !== "sk-placeholder");

  if (!hasNvidia && !hasOpenAI) {
    return NextResponse.json({ data: parseTextFallback(text) });
  }

  // ── Call AI ───────────────────────────────────────────────────
  try {
    const openai = new OpenAI(
      hasNvidia
        ? { apiKey: parseKey!, baseURL: parseBase! }
        : { apiKey: openaiKey! }
    );

    const model = hasNvidia ? parseModel : "gpt-4o-mini";

    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text.slice(0, 12000) },
      ],
      max_tokens: 3000,
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    console.log("[parse-resume] AI response length:", content.length);
    const raw = JSON.parse(content) as Record<string, unknown>;
    return NextResponse.json({ data: mergeWithEmpty(raw) });
  } catch (err) {
    console.error("[parse-resume] AI error:", err);
    // AI failed — return regex-parsed fallback (at least partial data)
    return NextResponse.json({ data: parseTextFallback(text) });
  }
}
