import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import * as Sentry from "@sentry/nextjs";
import { zodToJsonSchema } from "zod-to-json-schema";
import { createClient } from "@/lib/supabase/server";
import { rateLimitUser } from "@/lib/rateLimit";
import { ResumeImportSchema } from "@/lib/resumeImportSchema";
import { sanitizeResumeImport } from "@/lib/resumeImportSanitize";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PAGES = 10;
const MIN_TEXT_CHARS = 200;
const IMPORT_RATE_LIMIT = 5;
const IMPORT_RATE_WINDOW_MS = 60 * 60 * 1000;

const RESUME_JSON_SCHEMA: Record<string, unknown> = (() => {
  const { $schema: _ignored, ...rest } = zodToJsonSchema(ResumeImportSchema) as Record<string, unknown>;
  return rest;
})();

const SYSTEM_PROMPT = `You are a precise resume parser. Given plain text extracted from a PDF resume, output a single JSON object conforming exactly to the provided JSON schema.

HARD RULES:
- Output ONLY valid JSON. No markdown, no code fences, no commentary.
- Extract ONLY what is explicitly present in the source text. NEVER invent, guess, or hallucinate.
- Missing string field → "". Missing array field → []. Never use null.
- Preserve original bullet wording verbatim. Do NOT rewrite, summarize, or paraphrase.
- Distinguish Projects from Experience using section header context (Project / Personal Project / Side Project / academic). Never duplicate the same item in both sections.
- Group skills by category when the resume uses category headers; otherwise emit one group with title "Skills".
- Location parsing: split into city / state / country only when the format is unambiguous (e.g. "Boston, MA, USA"); otherwise put the full string in city and leave state and country empty.
- Dates: keep as displayed in the source ("Jan 2024", "2020 – Present"). Do not normalize.
- Phone, email, LinkedIn → trimmed, otherwise verbatim.
- Do NOT generate id fields. Do NOT include a format field.`;

async function extractPdfText(buffer: Buffer): Promise<{ text: string; pages: number }> {
  // @ts-ignore
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const pages: number = pdf.numPages;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = (content.items as Array<{ str?: string }>)
      .map((item) => item.str ?? "")
      .join(" ");
    pageTexts.push(pageText);
  }

  return { text: pageTexts.join("\n"), pages };
}

function fail(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, code, error: message }, { status });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const t0 = Date.now();

  // ── 1. Auth ───────────────────────────────────────────────────────
  let userId: string;
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return fail("UNAUTHORIZED", "Authentication required.", 401);
    }
    userId = user.id;
  } catch {
    return fail("UNAUTHORIZED", "Authentication required.", 401);
  }

  // ── 2. Rate limit ─────────────────────────────────────────────────
  const rl = rateLimitUser(userId, IMPORT_RATE_LIMIT, IMPORT_RATE_WINDOW_MS);
  if (!rl.allowed) {
    return fail(
      "RATE_LIMITED",
      `Import limit reached (${IMPORT_RATE_LIMIT} per hour). Try again after ${new Date(rl.resetAt).toLocaleTimeString()}.`,
      429
    );
  }

  Sentry.addBreadcrumb({ category: "resume_import", message: "resume_import.started", level: "info" });

  // ── 3. OpenAI key check (fail fast before reading the file) ───────
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey || openaiKey === "sk-placeholder") {
    return fail(
      "EXTRACTION_FAILED",
      "Resume import is not available right now — the AI service is not configured. Please contact support.",
      503
    );
  }

  // ── 4. Parse multipart ────────────────────────────────────────────
  let file: File | null;
  try {
    const fd = await req.formData();
    file = fd.get("file") as File | null;
  } catch {
    return fail("UNSUPPORTED_FILE", "Invalid request format.", 400);
  }
  if (!file) return fail("UNSUPPORTED_FILE", "No file provided.", 400);

  // ── 5. Magic bytes check ──────────────────────────────────────────
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const header = buffer.subarray(0, 5).toString("ascii");
  if (header !== "%PDF-") {
    return fail(
      "UNSUPPORTED_FILE",
      "Only text-based PDF files are supported. Please upload a valid PDF.",
      422
    );
  }

  // ── 6. Size check (before any heavy processing) ───────────────────
  if (buffer.byteLength > MAX_SIZE_BYTES) {
    return fail(
      "FILE_TOO_LARGE",
      "File too large (max 5 MB). Please compress your PDF and try again.",
      413
    );
  }

  // ── 7. Extract text ───────────────────────────────────────────────
  let text = "";
  let pages = 0;
  const t1 = Date.now();

  try {
    ({ text, pages } = await extractPdfText(buffer));
  } catch (ex) {
    Sentry.withScope((scope) => {
      scope.setExtra("fileSize", buffer.byteLength);
      // Do not include buffer content
      Sentry.captureException(ex);
    });
    return fail(
      "UNSUPPORTED_FILE",
      "Could not read this PDF. Please make sure it is a valid, non-password-protected, text-based PDF.",
      422
    );
  }

  Sentry.addBreadcrumb({
    category: "pdf",
    message: "pdf.text_extracted",
    data: { ms: Date.now() - t1, bytes: text.length, pages },
    level: "info",
  });

  // ── 8. Page count check ───────────────────────────────────────────
  if (pages > MAX_PAGES) {
    return fail(
      "FILE_TOO_LARGE",
      `PDF has ${pages} pages (max ${MAX_PAGES}). Please use a shorter resume.`,
      422
    );
  }

  // ── 9. Scanned PDF check ──────────────────────────────────────────
  if (text.trim().length < MIN_TEXT_CHARS) {
    Sentry.addBreadcrumb({
      category: "resume_import",
      message: "resume_import.scanned_pdf_rejected",
      data: { chars: text.trim().length },
      level: "warning",
    });
    return fail(
      "SCANNED_PDF",
      "This looks like a scanned PDF — we can't read scanned PDFs yet. Try exporting as a text-based PDF, or start blank.",
      422
    );
  }

  // ── 10. AI extraction with one retry ──────────────────────────────
  const openai = new OpenAI({ apiKey: openaiKey });
  const truncatedText = text.slice(0, 12_000);
  let parsedData: unknown = undefined;
  let lastValidationError = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    const userContent =
      attempt === 1
        ? truncatedText
        : `${truncatedText}\n\nPrevious attempt failed schema validation:\n${lastValidationError}\n\nPlease fix the JSON and retry.`;

    const t2 = Date.now();
    Sentry.addBreadcrumb({
      category: "llm",
      message: "llm.requested",
      data: { attempt, bytes: userContent.length },
      level: "info",
    });

    let rawContent: string;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "resume_import",
            schema: RESUME_JSON_SCHEMA,
            strict: true,
          },
        } as Parameters<typeof openai.chat.completions.create>[0]["response_format"],
        temperature: 0.1,
        max_tokens: 3_500,
      });
      rawContent = completion.choices[0]?.message?.content ?? "{}";
    } catch (ex) {
      Sentry.withScope((scope) => {
        scope.setExtra("attempt", attempt);
        Sentry.captureException(ex);
      });
      return fail("AI_FAILED", "The AI service encountered an error. Please try again in a moment.", 502);
    }

    Sentry.addBreadcrumb({
      category: "llm",
      message: "llm.responded",
      data: { ms: Date.now() - t2, attempt },
      level: "info",
    });

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(rawContent);
    } catch {
      lastValidationError = "Response was not valid JSON.";
      if (attempt === 2) return fail("EXTRACTION_FAILED", "Could not extract resume data. Please try again.", 502);
      continue;
    }

    const validation = ResumeImportSchema.safeParse(rawJson);

    Sentry.addBreadcrumb({
      category: "zod",
      message: "zod.validated",
      data: { attempt, success: validation.success },
      level: "info",
    });

    if (validation.success) {
      parsedData = rawJson;
      break;
    }

    lastValidationError = JSON.stringify(validation.error.flatten().fieldErrors);

    if (attempt === 2) {
      Sentry.withScope((scope) => {
        scope.setExtra("attempt", 2);
        scope.setExtra("zodErrors", validation.error.flatten().fieldErrors);
        // Never set scope.setExtra("rawContent", ...) or any resume text/data
        Sentry.captureException(
          new Error("resume_import.validation_failed: Zod validation failed after retry")
        );
      });
      Sentry.addBreadcrumb({
        category: "resume_import",
        message: "resume_import.validation_failed",
        level: "warning",
      });
      return fail("EXTRACTION_FAILED", "Could not extract resume data reliably. Please try again.", 502);
    }
  }

  if (parsedData === undefined) {
    return fail("EXTRACTION_FAILED", "Extraction failed unexpectedly. Please try again.", 502);
  }

  // ── 11. Sanitize ──────────────────────────────────────────────────
  let resumeData;
  try {
    resumeData = sanitizeResumeImport(parsedData);
  } catch (ex) {
    Sentry.withScope((scope) => {
      Sentry.captureException(ex);
    });
    return fail("EXTRACTION_FAILED", "Could not process the extracted resume data.", 502);
  }

  Sentry.addBreadcrumb({
    category: "resume_import",
    message: "sanitized",
    data: { ms: Date.now() - t0, pages },
    level: "info",
  });

  const sectionsPresent = [
    resumeData.contact.fullName,
    resumeData.summary,
    resumeData.experience.length > 0,
    resumeData.projects.length > 0,
    resumeData.education.length > 0,
    resumeData.certifications.length > 0,
    resumeData.skillGroups.length > 0,
  ].filter(Boolean).length;

  Sentry.addBreadcrumb({
    category: "resume_import",
    message: "resume_import.succeeded",
    data: { ms: Date.now() - t0, sections_present_of_7: sectionsPresent },
    level: "info",
  });

  return NextResponse.json({ ok: true, data: resumeData });
}
