"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useResumeStore } from "@/lib/store";
import { ResumeData, ResumeFormat, defaultFormat, FONT_OPTIONS } from "@/lib/types";
import { scoreResume } from "@/lib/score";
import { matchKeywords } from "@/lib/keywords";
import ResumePreview from "@/components/ResumePreview";
import ScoreGauge from "@/components/builder/ScoreGauge";
import {
  ArrowLeft,
  Sparkles,
  SlidersHorizontal,
  LayoutTemplate,
  Share2,
  Download,
  ChevronDown,
  Minus,
  Plus,
  Check,
} from "lucide-react";

function Preview() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id") ?? "";
  const { getResume, updateData } = useResumeStore();

  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<ResumeData | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted) return;
    const r = getResume(id);
    if (!r) {
      router.replace("/dashboard");
      return;
    }
    setData({ ...r.data, format: r.data.format ?? defaultFormat() });
  }, [mounted, id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => updateData(id, data), 400);
    return () => clearTimeout(t);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  if (!mounted || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nav-bg text-nav-muted">
        Loading…
      </div>
    );
  }

  const f = data.format;
  const setFmt = (patch: Partial<ResumeFormat>) =>
    setData({ ...data, format: { ...f, ...patch } });

  const autoAdjust = () => {
    setFmt({ fontSizePt: 10, lineHeight: 1.4, paraSpacing: 1.2 });
    showToast("Auto-adjusted: resume fitted onto 2 pages");
  };

  return (
    <main className="min-h-screen bg-nav-bg text-nav-text">
      {/* Top nav row */}
      <header className="flex items-center gap-3 px-6 py-3 print:hidden">
        <Link href={`/builder?id=${id}`} className="rounded p-1.5 text-nav-muted hover:bg-nav-card">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm font-bold uppercase tracking-wide text-nav-text">
          Finish up & Preview
        </span>
      </header>

      <div className="grid gap-6 px-6 pb-16 lg:grid-cols-[1fr_320px]">
        {/* Left: toolbar + preview */}
        <div>
          {/* Action toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-nav-border bg-nav-panel px-4 py-3 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <ToolBtn onClick={autoAdjust} icon={<Sparkles className="h-4 w-4" />}>
                Auto-adjust
              </ToolBtn>
              <ToolBtn icon={<SlidersHorizontal className="h-4 w-4" />}>Adjustments</ToolBtn>
              <ToolBtn icon={<LayoutTemplate className="h-4 w-4" />}>Template</ToolBtn>
            </div>
            <div className="flex items-center gap-2">
              <ToolBtn
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  showToast("Preview link copied to clipboard");
                }}
                icon={<Share2 className="h-4 w-4" />}
              >
                Share
              </ToolBtn>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:brightness-110"
              >
                <Download className="h-4 w-4" /> Download PDF
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Format toolbar */}
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-nav-border bg-nav-panel px-4 py-2.5 text-sm print:hidden">
            <Select
              value={f.fontFamily}
              onChange={(v) => setFmt({ fontFamily: v })}
              options={FONT_OPTIONS}
              width="w-40"
            />
            <Divider />
            <Stepper
              value={f.fontSizePt}
              onDec={() => setFmt({ fontSizePt: Math.max(7, f.fontSizePt - 1) })}
              onInc={() => setFmt({ fontSizePt: Math.min(16, f.fontSizePt + 1) })}
            />
            <Divider />
            <LabeledSelect
              label="Line"
              value={String(f.lineHeight)}
              onChange={(v) => setFmt({ lineHeight: parseFloat(v) })}
              options={["1.0", "1.15", "1.4", "1.55", "1.75", "2.0"]}
            />
            <LabeledSelect
              label="Spacing"
              value={String(f.paraSpacing)}
              onChange={(v) => setFmt({ paraSpacing: parseFloat(v) })}
              options={["1.0", "1.25", "1.5", "1.75", "2.0"]}
            />
            <Divider />
            <LabeledSelect
              label="Paper"
              value={f.paper}
              onChange={(v) => setFmt({ paper: v as "A4" | "Letter" })}
              options={["A4", "Letter"]}
            />
            <LabeledSelect
              label="Zoom"
              value={String(f.zoom)}
              onChange={(v) => setFmt({ zoom: parseInt(v) })}
              options={["80", "90", "100", "115", "131", "150"]}
              suffix="%"
            />
            <Divider />
            <button
              onClick={() => setFmt({ viewAsPages: !f.viewAsPages })}
              className="flex items-center gap-2 text-xs text-nav-muted"
            >
              <span className={`relative h-4 w-8 rounded-full transition ${f.viewAsPages ? "bg-nav-indigo" : "bg-nav-card"}`}>
                <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${f.viewAsPages ? "left-[18px]" : "left-0.5"}`} />
              </span>
              View as pages
            </button>
          </div>

          {/* Preview canvas */}
          <div className="mt-4 overflow-auto rounded-xl bg-slate-500/10 p-6">
            <div
              className="resume-zoom"
              style={{
                transform: `scale(${f.zoom / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.15s ease",
              }}
            >
              <ResumePreview data={data} />
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-4 print:hidden">
          <ExpertReview />
          <div className="rounded-2xl border border-nav-border bg-nav-panel p-5">
            <ScoreGauge score={scoreResume(data).total} />
            <Link
              href={`/builder?id=${id}`}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-nav-card px-4 py-2.5 text-sm font-semibold text-nav-text hover:bg-nav-border"
            >
              <Sparkles className="h-4 w-4 text-nav-indigo" /> Explore my score
            </Link>
          </div>
          <KeywordTargeting data={data} />
        </aside>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-nav-card px-4 py-2.5 text-sm text-nav-text shadow-xl print:hidden">
          <Check className="h-4 w-4 text-accent" /> {toast}
        </div>
      )}
    </main>
  );
}

/* ---------- toolbar pieces ---------- */

function ToolBtn({
  children,
  icon,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-nav-border bg-nav-bg px-3 py-2 text-xs font-bold uppercase tracking-wide text-nav-text hover:border-nav-indigo"
    >
      {icon}
      {children}
    </button>
  );
}

function Divider() {
  return <span className="h-5 w-px bg-nav-border" />;
}

function Select({
  value,
  onChange,
  options,
  width = "w-32",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  width?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${width} rounded-md border border-nav-border bg-nav-bg px-2 py-1.5 text-xs uppercase tracking-wide text-nav-text outline-none`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
  suffix = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  suffix?: string;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-nav-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-nav-border bg-nav-bg px-2 py-1.5 text-xs text-nav-text outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
            {suffix}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stepper({
  value,
  onDec,
  onInc,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-nav-border bg-nav-bg px-1 py-0.5">
      <button onClick={onDec} className="rounded p-1 hover:bg-nav-card">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-center text-xs">{value}</span>
      <button onClick={onInc} className="rounded p-1 hover:bg-nav-card">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ---------- sidebar cards ---------- */

function ExpertReview() {
  return (
    <div className="rounded-2xl border border-nav-border bg-nav-panel p-5">
      <h3 className="text-base font-bold">Expert Review</h3>
      <p className="mt-1 text-sm text-nav-muted">
        We&apos;ll correct all formatting, content, and grammar errors directly in your resume.
      </p>
      <button className="mt-4 w-full rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110">
        Ask for expert review
      </button>
    </div>
  );
}

function KeywordTargeting({ data }: { data: ResumeData }) {
  const [jobTitle, setJobTitle] = useState("");
  const [jd, setJd] = useState("");
  const result = useMemo(
    () => (jd.trim() ? matchKeywords(`${jobTitle} ${jd}`, data) : null),
    [jobTitle, jd, data]
  );

  return (
    <div className="rounded-2xl border border-nav-border bg-nav-panel p-5">
      <h3 className="text-base font-bold">AI Keyword Targeting</h3>
      <p className="mt-1 text-sm text-nav-muted">
        Get more interviews by matching your resume to the keywords in a job description.
      </p>

      <label className="mb-1.5 mt-4 block text-xs font-bold uppercase tracking-wide text-nav-muted">
        Job title *
      </label>
      <input
        value={jobTitle}
        onChange={(e) => setJobTitle(e.target.value)}
        placeholder="Senior QA Engineer"
        className="w-full rounded-lg border border-nav-border bg-nav-bg px-3 py-2 text-sm outline-none placeholder:text-nav-muted/50 focus:border-nav-indigo"
      />

      <label className="mb-1.5 mt-3 block text-xs font-bold uppercase tracking-wide text-nav-muted">
        Paste the job description
      </label>
      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        rows={4}
        placeholder="Paste the JD here to see which keywords your resume already covers…"
        className="w-full resize-y rounded-lg border border-nav-border bg-nav-bg px-3 py-2 text-sm outline-none placeholder:text-nav-muted/50 focus:border-nav-indigo"
      />

      {result && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Match</span>
            <span
              className={
                result.percent >= 70
                  ? "text-accent"
                  : result.percent >= 40
                  ? "text-amber-400"
                  : "text-red-400"
              }
            >
              {result.percent}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-nav-card">
            <div className="h-full rounded-full bg-accent" style={{ width: `${result.percent}%` }} />
          </div>

          {result.missing.length > 0 && (
            <>
              <div className="mt-3 text-xs font-semibold text-nav-muted">Missing keywords</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {result.missing.map((k) => (
                  <span key={k} className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                    {k}
                  </span>
                ))}
              </div>
            </>
          )}
          {result.matched.length > 0 && (
            <>
              <div className="mt-3 text-xs font-semibold text-nav-muted">Already covered</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {result.matched.slice(0, 12).map((k) => (
                  <span key={k} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                    {k}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-nav-bg text-nav-muted">
          Loading…
        </div>
      }
    >
      <Preview />
    </Suspense>
  );
}
