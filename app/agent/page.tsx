"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, Trash2, Wand2, Menu, Check, Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Button, EmptyState } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useResumeStore } from "@/lib/store";
import { useAgentStore } from "@/lib/agentStore";
import { callAI, resumeToContext } from "@/lib/ai";
import { newSkillGroup } from "@/lib/types";

type ApplyTarget = "summary" | "skills" | null;

const QUICK = [
  { label: "Improve my summary", prompt: "Rewrite my professional summary to be sharper and more impactful.", apply: "summary" as ApplyTarget },
  { label: "Suggest missing skills", prompt: "Based on my experience, suggest 8-12 skills I should add. Return a comma-separated list.", apply: "skills" as ApplyTarget },
  { label: "Strengthen my bullets", prompt: "Review my experience bullets and rewrite the weakest three to be action-led and quantified.", apply: null },
  { label: "Tailor to a job", prompt: "", apply: null },
];

function detectApply(message: string): ApplyTarget {
  if (/summary|profile|objective/i.test(message)) return "summary";
  if (/skills?/i.test(message)) return "skills";
  return null;
}

export default function AgentPage() {
  const router = useRouter();
  const resumeStore = useResumeStore();
  const agent = useAgentStore();
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [resumeId, setResumeId] = useState<string>("");
  const [input, setInput] = useState("");
  const [jd, setJd] = useState("");
  const [showJd, setShowJd] = useState(false);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && !resumeId && resumeStore.resumes[0]) {
      setResumeId(resumeStore.resumes[0].id);
    }
  }, [mounted, resumeId, resumeStore.resumes]);

  const resume = resumeStore.getResume(resumeId);
  const key = resumeId || "none";
  const messages = mounted ? agent.get(key) : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  const send = async (text: string, apply: ApplyTarget) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    agent.add(key, { role: "user", content: trimmed, applyTo: null });
    setBusy(true);
    try {
      const result = await callAI({
        task: "agent",
        message: trimmed,
        resumeContext: resume ? resumeToContext(resume.data) : undefined,
        jobDescription: jd.trim() || undefined,
      });
      const applyTo = apply ?? detectApply(trimmed);
      agent.add(key, {
        role: "assistant",
        content: result || "I couldn't generate a response. Please try again.",
        applyTo: result ? applyTo : null,
      });
    } finally {
      setBusy(false);
    }
  };

  const applySuggestion = (content: string, target: ApplyTarget) => {
    if (!resume || !target) return;
    const data = JSON.parse(JSON.stringify(resume.data)) as typeof resume.data;
    if (target === "summary") {
      data.summary = content.trim();
    } else if (target === "skills") {
      const group = newSkillGroup();
      group.title = "Additional Skills";
      group.content = content.replace(/\n/g, ", ").replace(/\s*,\s*/g, ", ").trim();
      data.skillGroups = [...data.skillGroups, group];
    }
    resumeStore.updateData(resume.id, data);
    toast.show(`Applied to your ${target}. Open the builder to review.`, "success");
  };

  const quickCreate = () => {
    const id = resumeStore.createResume("Untitled resume");
    router.push(`/builder?id=${id}`);
  };

  const sortedResumes = useMemo(
    () => [...resumeStore.resumes].sort((a, b) => b.updatedAt - a.updatedAt),
    [resumeStore.resumes]
  );

  return (
    <div className="flex min-h-screen bg-nav-bg text-nav-text">
      <Sidebar onCreate={quickCreate} mobileOpen={mobileNav} onMobileClose={() => setMobileNav(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-nav-border px-4 py-3 md:hidden">
          <button onClick={() => setMobileNav(true)} aria-label="Open navigation" className="rounded-md p-2 text-nav-muted hover:bg-nav-card">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold">AI Resume Agent</span>
          <span className="w-9" />
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-6 pt-6 md:px-8">
          <header className="mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-nav-indigo" aria-hidden="true" />
              <h1 className="text-xl font-bold">AI Resume Agent</h1>
            </div>
            <p className="mt-1 text-sm text-nav-muted">
              Chat about the resume below. Suggestions can be applied with one click.
            </p>
          </header>

          {!mounted ? (
            <div className="flex flex-1 items-center justify-center text-nav-muted">Loading…</div>
          ) : resumeStore.resumes.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-5 w-5" />}
              title="No resumes yet"
              description="Create a resume first, then the agent can read and improve it."
              action={<Button onClick={quickCreate}>Create a resume</Button>}
            />
          ) : (
            <>
              {/* Resume selector + JD toggle */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <label htmlFor="agent-resume" className="text-xs text-nav-muted">Working on:</label>
                <select
                  id="agent-resume"
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                  className="rounded-lg border border-nav-border bg-nav-panel px-3 py-1.5 text-sm text-nav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo"
                >
                  {sortedResumes.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowJd((v) => !v)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition ${showJd ? "border-nav-indigo bg-nav-indigo/15 text-nav-text" : "border-nav-border text-nav-muted hover:text-nav-text"}`}
                >
                  {showJd ? "Job description added" : "+ Add job description"}
                </button>
                {messages.length > 0 && (
                  <button onClick={() => agent.clear(key)} className="ml-auto flex items-center gap-1 text-xs text-nav-muted hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" /> Clear chat
                  </button>
                )}
              </div>

              {showJd && (
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  rows={3}
                  placeholder="Paste a job description so the agent can tailor its suggestions…"
                  className="mb-3 w-full resize-y rounded-xl border border-nav-border bg-nav-panel px-3 py-2 text-sm text-nav-text placeholder:text-nav-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo"
                />
              )}

              {/* Chat thread */}
              <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-nav-border bg-nav-panel/40 p-4">
                {messages.length === 0 && (
                  <div className="py-6 text-center">
                    <p className="text-sm text-nav-muted">Try one of these to get started:</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {QUICK.map((q) => (
                        <button
                          key={q.label}
                          onClick={() => (q.label === "Tailor to a job" ? setShowJd(true) : send(q.prompt, q.apply))}
                          className="rounded-full border border-nav-border bg-nav-card px-3 py-1.5 text-xs text-nav-text transition hover:border-nav-indigo"
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === "user"
                          ? "bg-gradient-to-r from-nav-blue to-nav-indigo text-white"
                          : "border border-nav-border bg-nav-card text-nav-text"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {m.role === "assistant" && m.applyTo && (
                        <button
                          onClick={() => applySuggestion(m.content, m.applyTo!)}
                          className="mt-2 inline-flex items-center gap-1 rounded-lg bg-nav-indigo/20 px-2.5 py-1 text-xs font-semibold text-nav-indigo transition hover:bg-nav-indigo/30"
                        >
                          <Check className="h-3 w-3" /> Apply to {m.applyTo}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {busy && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl border border-nav-border bg-nav-card px-4 py-2.5 text-sm text-nav-muted">
                      <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Composer */}
              <div className="mt-3 flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input, null);
                    }
                  }}
                  rows={1}
                  placeholder="Ask the agent to improve any part of your resume…"
                  className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-nav-border bg-nav-panel px-3 py-2.5 text-sm text-nav-text placeholder:text-nav-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo"
                />
                <Button onClick={() => send(input, null)} disabled={busy || !input.trim()} aria-label="Send message">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-nav-muted">
                <Wand2 className="h-3 w-3" /> Without an OpenAI key the agent returns helpful local heuristics.
              </p>
            </>
          )}
        </div>
      </div>
      {toast.node}
    </div>
  );
}
