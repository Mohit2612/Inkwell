"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  ChevronDown,
  Linkedin,
  Plus,
  AlertCircle,
  Check,
  Loader2,
  FileText,
} from "lucide-react";
import type { ResumeData } from "@/lib/types";

export interface CreateOptions {
  name: string;
  experience: string;
  targeted: boolean;
  withSample: boolean;
  parsedData?: ResumeData;
}

type ParseStatus = "idle" | "uploading" | "success" | "error";

function statusMessage(code: string | null, raw: string): string {
  switch (code) {
    case "SCANNED_PDF":
      return "This looks like a scanned PDF — we can't read scanned PDFs yet. Try exporting as a text-based PDF, or start blank.";
    case "FILE_TOO_LARGE":
      return "File too large (max 5 MB). Please compress your PDF and try again.";
    case "UNSUPPORTED_FILE":
      return "Only text-based PDF files are supported. Please upload a valid PDF.";
    case "RATE_LIMITED":
      return "Import limit reached (5 per hour). Try again later, or start blank.";
    default:
      return raw || "Could not import resume. Please try again, or start blank.";
  }
}

interface StatusChipProps {
  label: string;
  present: boolean;
}

function StatusChip({ label, present }: StatusChipProps) {
  return (
    <span className={`inline-flex items-center gap-1 ${present ? "text-green-400" : "text-nav-muted/50"}`}>
      {present
        ? <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
        : <span className="h-3 w-3 shrink-0 inline-block rounded-full border border-nav-muted/30" aria-hidden="true" />
      }
      {label}
    </span>
  );
}

export default function CreateResumeModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (opts: CreateOptions) => void;
}) {
  const [name, setName] = useState("");
  const [experience, setExperience] = useState("");
  const [targeted, setTargeted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parseStatus, setParseStatus] = useState<ParseStatus>("idle");
  const [parseResult, setParseResult] = useState<ResumeData | null>(null);
  const [parseError, setParseError] = useState("");
  const [parseErrorCode, setParseErrorCode] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isUploading = parseStatus === "uploading";

  // A resume can be created if: file was successfully parsed, OR no file but name is typed
  const canCreate = file ? parseStatus === "success" : name.trim().length > 0;

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Escape to close (abort in-flight request first)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isUploading) handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUploading]);

  // Abort on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Focus trap
  useEffect(() => {
    if (!panelRef.current) return;
    const el = panelRef.current;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    el.addEventListener("keydown", trap);
    return () => el.removeEventListener("keydown", trap);
  }, []);

  function handleClose() {
    abortRef.current?.abort();
    onClose();
  }

  async function uploadAndParse(f: File) {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setParseStatus("uploading");
    setParseResult(null);
    setParseError("");
    setParseErrorCode(null);

    try {
      const fd = new FormData();
      fd.append("file", f);

      const res = await fetch("/api/resume/import", {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });

      const json: { ok: boolean; data?: ResumeData; error?: string; code?: string } = await res.json();

      if (!res.ok || !json.ok) {
        const code = json.code ?? null;
        setParseErrorCode(code);
        setParseError(statusMessage(code, json.error ?? ""));
        setParseStatus("error");
        return;
      }

      const data = json.data!;
      setParseResult(data);
      setParseStatus("success");

      // Auto-fill name from extracted full name (only if user hasn't typed one)
      setName((prev) => {
        if (prev.trim()) return prev;
        return (
          data.contact.fullName.trim() ||
          f.name.replace(/\.(pdf|docx?)$/i, "").replace(/[_-]+/g, " ").trim()
        );
      });
    } catch (ex) {
      if ((ex as Error).name === "AbortError") return;
      setParseError("Network error — please check your connection and try again.");
      setParseStatus("error");
    }
  }

  function processFile(f: File) {
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setParseError("Only PDF files are supported. Please upload a valid PDF.");
      setParseStatus("error");
      return;
    }
    setFile(f);
    setParseStatus("idle");
    // Auto-fill name from filename before parse completes
    setName((prev) => {
      if (prev.trim()) return prev;
      return f.name.replace(/\.(pdf|docx?)$/i, "").replace(/[_-]+/g, " ").trim();
    });
    void uploadAndParse(f);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f) processFile(f);
    // Reset value so re-selecting the same file triggers onChange again
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleCreate = () => {
    if (!canCreate) return;

    if (file && parseStatus === "success" && parseResult) {
      const finalName =
        name.trim() ||
        parseResult.contact.fullName.trim() ||
        file.name.replace(/\.(pdf|docx?)$/i, "").replace(/[_-]+/g, " ");
      onCreate({ name: finalName, experience, targeted, withSample: false, parsedData: parseResult });
      return;
    }

    // No file path — create blank
    onCreate({ name: name.trim(), experience, targeted, withSample: false });
  };

  const handleStartBlank = () => {
    const fallbackName =
      name.trim() ||
      file?.name.replace(/\.(pdf|docx?)$/i, "").replace(/[_-]+/g, " ") ||
      "New Resume";
    onCreate({ name: fallbackName, experience, targeted, withSample: false });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isUploading && handleClose()}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-nav-border bg-nav-panel text-nav-text shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-nav-border px-6 py-4">
          <h2 id="create-modal-title" className="text-lg font-bold">Create a resume</h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-md p-1 text-nav-muted hover:bg-nav-card hover:text-nav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">

          {/* ── Upload section ── */}
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-nav-muted">
            Import existing resume
          </p>

          <label
            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 transition
              ${dragOver ? "border-nav-indigo bg-nav-indigo/10" :
                file && parseStatus !== "error"
                  ? "border-nav-indigo bg-nav-indigo/5 text-nav-text"
                  : "border-nav-border bg-nav-bg text-nav-muted hover:border-nav-indigo"
              }
              focus-within:border-nav-indigo focus-within:ring-1 focus-within:ring-nav-indigo`}
            aria-describedby={parseError ? "parse-error-msg" : undefined}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                file ? "bg-nav-indigo/20 text-nav-indigo" : "bg-nav-card"
              }`}
            >
              {isUploading
                ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                : file
                  ? <FileText className="h-5 w-5" />
                  : <Plus className="h-5 w-5" />
              }
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {file ? file.name : "Upload PDF"}
              </span>
              <span className="block text-xs text-nav-muted">
                {file ? "Click to change file" : "Drag & drop or click to browse"}
              </span>
            </span>
            <input
              type="file"
              accept=".pdf"
              className="sr-only"
              disabled={isUploading}
              onChange={handleFileChange}
              aria-label="Upload PDF resume"
            />
          </label>

          {/* ── Parse status panel ── */}
          <div aria-live="polite" aria-atomic="true">
            {isUploading && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-nav-indigo">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />
                Parsing your resume — please wait, this may take up to 30 seconds…
              </p>
            )}

            {parseStatus === "error" && (
              <div className="mt-2 space-y-2">
                <p
                  id="parse-error-msg"
                  className="flex items-start gap-1.5 text-xs text-red-400"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {parseError}
                </p>
                <button
                  type="button"
                  onClick={handleStartBlank}
                  className="text-xs text-nav-muted underline underline-offset-2 hover:text-nav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                  Start blank instead
                </button>
              </div>
            )}

            {parseStatus === "success" && parseResult && (
              <div className="mt-3 rounded-xl border border-nav-border bg-nav-card/40 p-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                  <StatusChip label="Contact" present={!!parseResult.contact.fullName} />
                  <StatusChip label="Summary" present={parseResult.summary.length > 0} />
                  <StatusChip
                    label={`Experience (${parseResult.experience.length})`}
                    present={parseResult.experience.length > 0}
                  />
                  <StatusChip
                    label={`Projects (${parseResult.projects.length})`}
                    present={parseResult.projects.length > 0}
                  />
                  <StatusChip
                    label={`Education (${parseResult.education.length})`}
                    present={parseResult.education.length > 0}
                  />
                  <StatusChip
                    label={`Certifications (${parseResult.certifications.length})`}
                    present={parseResult.certifications.length > 0}
                  />
                  <StatusChip
                    label={`Skills (${parseResult.skillGroups.length} groups)`}
                    present={parseResult.skillGroups.length > 0}
                  />
                </div>
              </div>
            )}

            {parseStatus === "idle" && !file && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-nav-muted">
                <Check className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                Supported: text-based PDFs only (max 5 MB, 10 pages)
              </p>
            )}
          </div>

          <hr className="my-5 border-nav-border" />

          {/* ── Resume name ── */}
          <label
            htmlFor="resume-name"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-nav-muted"
          >
            Resume name
            {!file && <span className="ml-1 text-red-400" aria-hidden="true">*</span>}
            {file && (
              <span className="ml-1 font-normal normal-case text-nav-muted/70">
                (auto-filled from file)
              </span>
            )}
          </label>
          <input
            id="resume-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={file ? "Auto-filled after import…" : "First Last — Job Title"}
            autoComplete="off"
            disabled={isUploading}
            className="w-full rounded-lg border border-nav-border bg-nav-bg px-3 py-2.5 text-sm outline-none transition placeholder:text-nav-muted/60 focus:border-nav-indigo focus:ring-1 focus:ring-nav-indigo disabled:opacity-60"
          />

          {/* ── Experience ── */}
          <label
            htmlFor="resume-experience"
            className="mb-1.5 mt-5 block text-xs font-bold uppercase tracking-wide text-nav-muted"
          >
            Years of experience
          </label>
          <div className="relative">
            <select
              id="resume-experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              disabled={isUploading}
              className="w-full appearance-none rounded-lg border border-nav-border bg-nav-bg px-3 py-2.5 text-sm outline-none transition focus:border-nav-indigo disabled:opacity-60"
            >
              <option value="">Select…</option>
              <option>No experience</option>
              <option>Less than 3 years</option>
              <option>3–5 years</option>
              <option>5–10 years</option>
              <option>10+ years</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nav-muted"
              aria-hidden="true"
            />
          </div>

          {/* ── LinkedIn placeholder ── */}
          <button
            type="button"
            disabled={isUploading}
            className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-nav-muted hover:text-nav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded disabled:opacity-40"
          >
            <Linkedin className="h-4 w-4" aria-hidden="true" />
            Import from LinkedIn
          </button>

          <hr className="my-5 border-nav-border" />

          {/* ── Target toggle ── */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold" id="target-label">Target your resume</h3>
            <button
              type="button"
              role="switch"
              aria-checked={targeted}
              aria-labelledby="target-label"
              disabled={isUploading}
              onClick={() => setTargeted((t) => !t)}
              className={`relative h-6 w-11 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-nav-panel disabled:opacity-40 ${targeted ? "bg-nav-indigo" : "bg-nav-card"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${targeted ? "left-[22px]" : "left-0.5"}`}
              />
            </button>
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-sm text-nav-muted">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            You&apos;re more likely to get an interview if your resume matches the role.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-nav-border px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-lg border border-nav-border px-5 py-2 text-sm font-semibold text-nav-text hover:bg-nav-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canCreate || isUploading}
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-6 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo"
          >
            {isUploading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isUploading ? "Parsing…" : file ? "Import & Create" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
