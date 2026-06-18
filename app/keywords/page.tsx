"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Target, Plus, Loader2, Wand2, Check } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Button, EmptyState } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useResumeStore } from "@/lib/store";
import { matchKeywords } from "@/lib/keywords";
import { callAI } from "@/lib/ai";
import { newSkillGroup, ResumeData } from "@/lib/types";

export default function KeywordsPage() {
  const router = useRouter();
  const resumeStore = useResumeStore();
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [resumeId, setResumeId] = useState("");
  const [jd, setJd] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tailoring, setTailoring] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && !resumeId && resumeStore.resumes[0]) setResumeId(resumeStore.resumes[0].id);
  }, [mounted, resumeId, resumeStore.resumes]);

  const resume = resumeStore.getResume(resumeId);
  const result = useMemo(
    () => (resume && jd.trim() ? matchKeywords(jd, resume.data) : null),
    [resume, jd]
  );

  const toggle = (kw: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(kw) ? next.delete(kw) : next.add(kw);
      return next;
    });

  const quickCreate = () => {
    const id = resumeStore.createResume("Untitled resume");
    router.push(`/builder?id=${id}`);
  };

  const addSelected = () => {
    if (!resume || selected.size === 0) return;
    const data = JSON.parse(JSON.stringify(resume.data)) as ResumeData;
    const g = newSkillGroup();
    g.title = "Keywords (from job description)";
    g.content = Array.from(selected).join(", ");
    data.skillGroups = [...data.skillGroups, g];
    resumeStore.updateData(resume.id, data);
    setSelected(new Set());
    toast.show(`Added ${g.content.split(",").length} keywords to your skills.`, "success");
  };

  const tailorSummary = async () => {
    if (!resume) return;
    setTailoring(true);
    try {
      const data = JSON.parse(JSON.stringify(resume.data)) as ResumeData;
      const r = await callAI({ task: "tailor", text: data.summary || data.contact.title, jobDescription: jd });
      if (r) {
        data.summary = r;
        resumeStore.updateData(resume.id, data);
        toast.show("Summary tailored to the job description.", "success");
      }
    } finally {
      setTailoring(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-nav-bg text-nav-text">
      <Sidebar onCreate={quickCreate} mobileOpen={mobileNav} onMobileClose={() => setMobileNav(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-nav-border px-4 py-3 md:hidden">
          <button onClick={() => setMobileNav(true)} aria-label="Open navigation" className="rounded-md p-2 text-nav-muted hover:bg-nav-card">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold">Keyword Targeting</span>
          <span className="w-9" />
        </div>

        <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-6 md:px-8">
          <header className="mb-5">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-nav-blue" aria-hidden="true" />
              <h1 className="text-xl font-bold">Keyword Targeting</h1>
            </div>
            <p className="mt-1 text-sm text-nav-muted">
              Paste a job description to see which keywords your resume already covers — and add the ones it&apos;s missing.
            </p>
          </header>

          {!mounted ? (
            <div className="text-nav-muted">Loading…</div>
          ) : resumeStore.resumes.length === 0 ? (
            <EmptyState
              icon={<Target className="h-5 w-5" />}
              title="No resumes yet"
              description="Create a resume to compare it against a job description."
              action={<Button onClick={quickCreate}>Create a resume</Button>}
            />
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2">
                <label htmlFor="kw-resume" className="text-xs text-nav-muted">Compare resume:</label>
                <select
                  id="kw-resume"
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                  className="rounded-lg border border-nav-border bg-nav-panel px-3 py-1.5 text-sm text-nav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-blue"
                >
                  {resumeStore.resumes.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                rows={6}
                placeholder="Paste the full job description here…"
                className="w-full resize-y rounded-xl border border-nav-border bg-nav-panel px-3 py-2.5 text-sm text-nav-text placeholder:text-nav-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-blue"
              />

              {result && (
                <div className="mt-5 space-y-4">
                  {/* Match score */}
                  <div className="flex items-center gap-4 rounded-2xl border border-nav-border bg-nav-panel p-4">
                    <div className="text-3xl font-extrabold text-nav-text">{result.percent}%</div>
                    <div className="flex-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-nav-card">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-nav-blue to-nav-indigo transition-all"
                          style={{ width: `${result.percent}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-nav-muted">
                        {result.matched.length} matched · {result.missing.length} missing keywords
                      </p>
                    </div>
                    <Button variant="secondary" onClick={tailorSummary} disabled={tailoring}>
                      {tailoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      Tailor summary
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Matched */}
                    <div className="rounded-2xl border border-nav-border bg-nav-panel p-4">
                      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
                        <Check className="h-4 w-4 text-emerald-400" /> Matched ({result.matched.length})
                      </h2>
                      <div className="flex flex-wrap gap-1.5">
                        {result.matched.length === 0 && <span className="text-xs text-nav-muted">None yet.</span>}
                        {result.matched.map((kw) => (
                          <span key={kw} className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300">{kw}</span>
                        ))}
                      </div>
                    </div>

                    {/* Missing — selectable */}
                    <div className="rounded-2xl border border-nav-border bg-nav-panel p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h2 className="flex items-center gap-1.5 text-sm font-bold">
                          <Plus className="h-4 w-4 text-amber-400" /> Missing ({result.missing.length})
                        </h2>
                        {selected.size > 0 && (
                          <button onClick={addSelected} className="rounded-lg bg-nav-indigo/20 px-2.5 py-1 text-xs font-semibold text-nav-indigo hover:bg-nav-indigo/30">
                            Add {selected.size} to resume
                          </button>
                        )}
                      </div>
                      <p className="mb-2 text-[11px] text-nav-muted">Tap keywords to select, then add them to your skills.</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.missing.length === 0 && <span className="text-xs text-nav-muted">Great — nothing missing!</span>}
                        {result.missing.map((kw) => {
                          const on = selected.has(kw);
                          return (
                            <button
                              key={kw}
                              onClick={() => toggle(kw)}
                              className={`rounded-full px-2.5 py-1 text-xs transition ${on ? "bg-nav-indigo text-white" : "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"}`}
                            >
                              {on && <Check className="mr-1 inline h-3 w-3" />}{kw}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-nav-muted">
                    Tip: only add keywords you can honestly back up — recruiters check.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {toast.node}
    </div>
  );
}
