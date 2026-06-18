"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, ShieldCheck, Check, AlertTriangle, Wand2, Loader2, ArrowRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Button, EmptyState } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import ScoreGauge from "@/components/builder/ScoreGauge";
import { useResumeStore } from "@/lib/store";
import { scoreResume } from "@/lib/score";
import { callAI } from "@/lib/ai";
import { newSkillGroup, ResumeData } from "@/lib/types";

// Which failing checks the AI can fix directly, and how.
type FixKind = "summary" | "skills" | "bullet" | null;
const FIXABLE: Record<string, FixKind> = {
  "Summary is 40+ characters": "summary",
  "5+ skills listed": "skills",
  "Bullets include numbers/metrics": "bullet",
};

export default function CheckerPage() {
  const router = useRouter();
  const resumeStore = useResumeStore();
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [resumeId, setResumeId] = useState("");
  const [fixing, setFixing] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && !resumeId && resumeStore.resumes[0]) setResumeId(resumeStore.resumes[0].id);
  }, [mounted, resumeId, resumeStore.resumes]);

  const resume = resumeStore.getResume(resumeId);
  const report = useMemo(() => (resume ? scoreResume(resume.data) : null), [resume]);

  const failing = report ? report.checks.filter((c) => !c.passed).sort((a, b) => b.weight - a.weight) : [];
  const passing = report ? report.checks.filter((c) => c.passed) : [];

  const quickCreate = () => {
    const id = resumeStore.createResume("Untitled resume");
    router.push(`/builder?id=${id}`);
  };

  const fixWithAI = async (label: string) => {
    if (!resume) return;
    const kind = FIXABLE[label];
    if (!kind) return;
    setFixing(label);
    try {
      const data = JSON.parse(JSON.stringify(resume.data)) as ResumeData;
      if (kind === "summary") {
        const r = await callAI({ task: "summary", role: data.contact.title || "professional", context: data.summary });
        if (r) data.summary = r;
      } else if (kind === "skills") {
        const existing = data.skillGroups.map((g) => g.content).join(", ");
        const r = await callAI({ task: "skills", role: data.contact.title || "professional", existing });
        if (r) {
          const g = newSkillGroup();
          g.title = "Additional Skills";
          g.content = r.replace(/\n/g, ", ").trim();
          data.skillGroups = [...data.skillGroups, g];
        }
      } else if (kind === "bullet") {
        const exp = data.experience.find((e) => e.bullets.some((b) => b.trim() && !/\d/.test(b)));
        if (exp) {
          const idx = exp.bullets.findIndex((b) => b.trim() && !/\d/.test(b));
          const r = await callAI({ task: "rewrite-bullet", text: exp.bullets[idx] });
          if (r) exp.bullets[idx] = r;
        }
      }
      resumeStore.updateData(resume.id, data);
      toast.show("Applied. Re-scoring…", "success");
    } finally {
      setFixing(null);
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
          <span className="font-bold">Resume Checker</span>
          <span className="w-9" />
        </div>

        <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-6 md:px-8">
          <header className="mb-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-nav-blue" aria-hidden="true" />
              <h1 className="text-xl font-bold">ATS Resume Checker</h1>
            </div>
            <p className="mt-1 text-sm text-nav-muted">
              A transparent completeness &amp; best-practice score. Fix the highest-impact issues first.
            </p>
          </header>

          {!mounted ? (
            <div className="text-nav-muted">Loading…</div>
          ) : resumeStore.resumes.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-5 w-5" />}
              title="No resumes to check"
              description="Create a resume and run it through the checker to see your ATS score."
              action={<Button onClick={quickCreate}>Create a resume</Button>}
            />
          ) : report && resume ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <label htmlFor="check-resume" className="text-xs text-nav-muted">Resume:</label>
                <select
                  id="check-resume"
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                  className="rounded-lg border border-nav-border bg-nav-panel px-3 py-1.5 text-sm text-nav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-blue"
                >
                  {resumeStore.resumes.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <Link href={`/builder?id=${resume.id}`} className="ml-auto inline-flex items-center gap-1 text-xs text-nav-blue hover:underline">
                  Open in builder <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid gap-5 md:grid-cols-[260px_1fr]">
                {/* Gauge */}
                <div className="flex flex-col items-center rounded-2xl border border-nav-border bg-nav-panel p-6">
                  <ScoreGauge score={report.total} />
                  <p className="mt-2 text-center text-xs text-nav-muted">
                    {failing.length === 0 ? "All checks passed 🎉" : `${failing.length} issue${failing.length > 1 ? "s" : ""} to fix`}
                  </p>
                </div>

                {/* Prioritized fixes */}
                <div className="space-y-3">
                  {failing.length > 0 && (
                    <div className="rounded-2xl border border-nav-border bg-nav-panel p-4">
                      <h2 className="mb-3 text-sm font-bold">Prioritized fixes</h2>
                      <ul className="space-y-2">
                        {failing.map((c) => {
                          const fixable = FIXABLE[c.label];
                          return (
                            <li key={c.label} className="flex items-center gap-3 rounded-xl border border-nav-border bg-nav-card/50 px-3 py-2.5">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                              <span className="flex-1 text-sm">{c.label}</span>
                              <span className="rounded-full bg-nav-card px-2 py-0.5 text-[10px] font-bold text-nav-muted">+{c.weight} pts</span>
                              {fixable ? (
                                <button
                                  onClick={() => fixWithAI(c.label)}
                                  disabled={fixing !== null}
                                  className="inline-flex items-center gap-1 rounded-lg bg-nav-indigo/20 px-2.5 py-1 text-xs font-semibold text-nav-indigo transition hover:bg-nav-indigo/30 disabled:opacity-50"
                                >
                                  {fixing === c.label ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                                  Fix with AI
                                </button>
                              ) : (
                                <Link href={`/builder?id=${resume.id}`} className="text-xs text-nav-blue hover:underline">Fix in builder</Link>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {passing.length > 0 && (
                    <div className="rounded-2xl border border-nav-border bg-nav-panel p-4">
                      <h2 className="mb-3 text-sm font-bold">Passing checks</h2>
                      <ul className="grid gap-1.5 sm:grid-cols-2">
                        {passing.map((c) => (
                          <li key={c.label} className="flex items-center gap-2 text-sm text-nav-muted">
                            <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                            {c.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
      {toast.node}
    </div>
  );
}
