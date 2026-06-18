"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronDown, Linkedin, Plus, AlertCircle, Check, Loader2, FileText } from "lucide-react";
import type { ResumeData } from "@/lib/types";

export interface CreateOptions {
  name: string;
  experience: string;
  targeted: boolean;
  withSample: boolean;
  parsedData?: ResumeData;
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
  const [isLoading, setIsLoading] = useState(false);
  const [parseError, setParseError] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);

  // name required only when no file attached
  const canSave = !isLoading && (name.trim().length > 0 || !!file);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, isLoading]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setParseError("");
    // Auto-fill name from filename if user hasn't typed one
    if (f && !name.trim()) {
      const auto = f.name
        .replace(/\.(pdf|docx?)$/i, "")
        .replace(/[_-]+/g, " ")
        .trim();
      setName(auto);
    }
  };

  const handleCreate = async () => {
    if (!canSave) return;
    setParseError("");

    // No file → create blank resume (name required in this path)
    if (!file) {
      onCreate({ name: name.trim(), experience, targeted, withSample: false });
      return;
    }

    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/parse-resume", { method: "POST", body: fd });
      const json = await res.json();

      const parsedData: ResumeData | undefined = res.ok ? json.data : undefined;

      // Use manually entered name → parsed fullName → cleaned filename
      const finalName =
        name.trim() ||
        (parsedData?.contact?.fullName ?? "").trim() ||
        file.name.replace(/\.(pdf|docx?)$/i, "").replace(/[_-]+/g, " ");

      if (!res.ok) {
        setParseError(json.error ?? "Could not parse file. Opening empty resume instead.");
      }

      onCreate({ name: finalName, experience, targeted, withSample: false, parsedData });
    } catch {
      const fallbackName =
        name.trim() || file.name.replace(/\.(pdf|docx?)$/i, "").replace(/[_-]+/g, " ");
      setParseError("Network error. Opening empty resume instead.");
      onCreate({ name: fallbackName, experience, targeted, withSample: false });
    } finally {
      setIsLoading(false);
    }
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
        onClick={() => !isLoading && onClose()}
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
            onClick={onClose}
            disabled={isLoading}
            className="rounded-md p-1 text-nav-muted hover:bg-nav-card hover:text-nav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">

          {/* ── Upload section (shown prominently at top) ── */}
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-nav-muted">
            Import existing resume
          </p>
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 transition
            ${file
              ? "border-nav-indigo bg-nav-indigo/5 text-nav-text"
              : "border-nav-border bg-nav-bg text-nav-muted hover:border-nav-indigo"
            }
            focus-within:border-nav-indigo focus-within:ring-1 focus-within:ring-nav-indigo`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${file ? "bg-nav-indigo/20 text-nav-indigo" : "bg-nav-card"}`}>
              {file ? <FileText className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {file ? file.name : "Upload PDF or DOCX"}
              </span>
              <span className="block text-xs text-nav-muted">
                {file ? "Click to change file" : "Drag & drop or click to browse"}
              </span>
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="sr-only"
              disabled={isLoading}
              onChange={handleFileChange}
            />
          </label>

          {/* Status messages */}
          {isLoading && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-nav-indigo">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              Parsing your resume — please wait, this may take up to 60 seconds…
            </p>
          )}
          {!isLoading && parseError && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-red-400">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {parseError}
            </p>
          )}
          {!isLoading && !parseError && file && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-nav-muted">
              <Check className="h-3.5 w-3.5 shrink-0 text-green-400" />
              File ready — click <strong className="mx-0.5 text-nav-text">Create</strong> to import
            </p>
          )}

          <hr className="my-5 border-nav-border" />

          {/* ── Resume name ── */}
          <label htmlFor="resume-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-nav-muted">
            Resume name
            {!file && <span className="text-red-400 ml-1" aria-hidden="true">*</span>}
            {file && <span className="ml-1 font-normal normal-case text-nav-muted/70">(optional — auto-filled from file)</span>}
          </label>
          <input
            id="resume-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={file ? "Auto-filled after import…" : "First Last — Job Title"}
            autoComplete="off"
            disabled={isLoading}
            className="w-full rounded-lg border border-nav-border bg-nav-bg px-3 py-2.5 text-sm outline-none transition placeholder:text-nav-muted/60 focus:border-nav-indigo focus:ring-1 focus:ring-nav-indigo disabled:opacity-60"
          />

          {/* ── Experience ── */}
          <label htmlFor="resume-experience" className="mb-1.5 mt-5 block text-xs font-bold uppercase tracking-wide text-nav-muted">
            Years of experience
          </label>
          <div className="relative">
            <select
              id="resume-experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              disabled={isLoading}
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

          {/* ── LinkedIn ── */}
          <button
            type="button"
            disabled={isLoading}
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
              disabled={isLoading}
              onClick={() => setTargeted((t) => !t)}
              className={`relative h-6 w-11 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-nav-panel disabled:opacity-40 ${targeted ? "bg-nav-indigo" : "bg-nav-card"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${targeted ? "left-[22px]" : "left-0.5"}`} />
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
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-nav-border px-5 py-2 text-sm font-semibold text-nav-text hover:bg-nav-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-6 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isLoading ? "Parsing…" : file ? "Import & Create" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
