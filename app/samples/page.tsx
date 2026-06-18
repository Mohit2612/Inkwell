"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Library, Search, Eye, FileText } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Button, Modal } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import ResumePreview from "@/components/ResumePreview";
import { useResumeStore } from "@/lib/store";
import { SAMPLES, SAMPLE_INDUSTRIES, SAMPLE_LEVELS, ResumeSample, SampleLevel } from "@/lib/sampleLibrary";

const LEVEL_LABEL: Record<SampleLevel, string> = {
  student: "Student", entry: "Entry level", mid: "Mid level", senior: "Senior", executive: "Executive",
};

export default function SamplesPage() {
  const router = useRouter();
  const resumeStore = useResumeStore();
  const toast = useToast();

  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [preview, setPreview] = useState<ResumeSample | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAMPLES.filter((s) => {
      if (industry !== "all" && s.industry !== industry) return false;
      if (level !== "all" && s.level !== level) return false;
      if (q && !(`${s.title} ${s.category} ${s.industry}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [query, industry, level]);

  const useSample = (s: ResumeSample) => {
    const id = resumeStore.createResume(`${s.title} resume`);
    resumeStore.updateData(id, s.data);
    toast.show("Resume created from sample.", "success");
    router.push(`/builder?id=${id}`);
  };

  const quickCreate = () => {
    const id = resumeStore.createResume("Untitled resume");
    router.push(`/builder?id=${id}`);
  };

  return (
    <div className="flex min-h-screen bg-nav-bg text-nav-text">
      <Sidebar onCreate={quickCreate} mobileOpen={mobileNav} onMobileClose={() => setMobileNav(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-nav-border px-4 py-3 md:hidden">
          <button onClick={() => setMobileNav(true)} aria-label="Open navigation" className="rounded-md p-2 text-nav-muted hover:bg-nav-card">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold">Sample Library</span>
          <span className="w-9" />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-8">
          <header className="mb-5">
            <div className="flex items-center gap-2">
              <Library className="h-5 w-5 text-nav-indigo" aria-hidden="true" />
              <h1 className="text-xl font-bold">Sample Library</h1>
            </div>
            <p className="mt-1 text-sm text-nav-muted">
              Browse expert-written samples by role. Preview one, then start your resume from it.
            </p>
          </header>

          {/* Filters */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nav-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by job title or industry…"
                className="w-full rounded-lg border border-nav-border bg-nav-panel py-2 pl-9 pr-3 text-sm text-nav-text placeholder:text-nav-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo"
              />
            </div>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="rounded-lg border border-nav-border bg-nav-panel px-3 py-2 text-sm text-nav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo">
              <option value="all">All industries</option>
              {SAMPLE_INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded-lg border border-nav-border bg-nav-panel px-3 py-2 text-sm text-nav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo">
              <option value="all">All levels</option>
              {SAMPLE_LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-nav-border p-12 text-center text-sm text-nav-muted">
              No samples match your filters.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <div key={s.slug} className="flex flex-col rounded-2xl border border-nav-border bg-nav-panel p-4 transition hover:border-nav-indigo/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-nav-card text-nav-indigo">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="rounded-full bg-nav-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-nav-muted">
                      {LEVEL_LABEL[s.level]}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold">{s.title}</h3>
                  <p className="text-xs text-nav-muted">{s.industry}</p>
                  <p className="mt-2 line-clamp-3 flex-1 text-xs text-nav-muted">{s.data.summary}</p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setPreview(s)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-nav-border py-2 text-xs font-medium text-nav-text transition hover:bg-nav-card">
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>
                    <button onClick={() => useSample(s)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo py-2 text-xs font-semibold text-white transition hover:brightness-110">
                      Use sample
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title} size="lg">
        {preview && (
          <div className="space-y-4">
            <div className="max-h-[60vh] overflow-y-auto rounded-xl bg-slate-100 p-4">
              <div className="origin-top scale-[0.92]">
                <ResumePreview data={preview.data} sheetId="sample-preview" flat />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPreview(null)}>Close</Button>
              <Button onClick={() => useSample(preview)}>Use this sample</Button>
            </div>
          </div>
        )}
      </Modal>
      {toast.node}
    </div>
  );
}
