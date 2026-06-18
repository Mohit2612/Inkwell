"use client";

import { useState } from "react";
import { Sparkles, Loader2, Plus, X } from "lucide-react";

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-nav-muted">
      {children}
    </label>
  );
}

export function DInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-nav-border bg-nav-panel px-3 py-2.5 text-sm text-nav-text outline-none transition-all duration-150 placeholder:text-nav-muted/50 focus:border-nav-indigo focus:ring-1 focus:ring-nav-indigo/30"
    />
  );
}

export function DTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-y rounded-lg border border-nav-border bg-nav-panel px-3 py-2.5 text-sm text-nav-text outline-none transition-all duration-150 placeholder:text-nav-muted/50 focus:border-nav-indigo focus:ring-1 focus:ring-nav-indigo/30"
    />
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-nav-border bg-nav-panel p-6 shadow-elevation-1">
      {children}
    </div>
  );
}

// 30-second AbortController timeout so the button never stays stuck.
async function callAI(body: object): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = await res.json();
    return (json.result as string) ?? "";
  } finally {
    clearTimeout(timer);
  }
}

export function BulletEditor({
  bullets,
  onChange,
  hint = "Aim for a balanced mix of descriptive and key-number bullet points.",
}: {
  bullets: string[];
  onChange: (b: string[]) => void;
  hint?: string;
}) {
  const [busy, setBusy] = useState<number | "new" | null>(null);

  const set = (i: number, v: string) =>
    onChange(bullets.map((b, idx) => (idx === i ? v : b)));
  const add = () => onChange([...bullets, ""]);
  const remove = (i: number) => onChange(bullets.filter((_, idx) => idx !== i));

  const improve = async (i: number) => {
    setBusy(i);
    try {
      const r = await callAI({ task: "rewrite-bullet", text: bullets[i] });
      if (r) set(i, r);
    } finally {
      setBusy(null);
    }
  };

  const generate = async () => {
    setBusy("new");
    try {
      const last = [...bullets].reverse().find((b) => b.trim()) || "my responsibilities";
      const r = await callAI({ task: "rewrite-bullet", text: last });
      if (r) onChange([...bullets, r]);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="rounded-lg border border-nav-border bg-nav-bg p-3">
        <div className="space-y-2">
          {bullets.map((b, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2.5 text-nav-muted">•</span>
              <textarea
                value={b}
                rows={1}
                placeholder="Start with a verb. Add a number where you can."
                onChange={(e) => set(i, e.target.value)}
                className="min-h-[36px] flex-1 resize-y bg-transparent text-sm text-nav-text outline-none placeholder:text-nav-muted/50"
              />
              <button
                onClick={() => improve(i)}
                disabled={busy === i || !b.trim()}
                title="Improve with AI"
                className="rounded-lg p-1.5 text-nav-indigo transition-all duration-100 hover:bg-nav-card active:scale-[0.90] disabled:opacity-40"
              >
                {busy === i ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => remove(i)}
                className="rounded-lg p-1.5 text-nav-muted transition-all duration-100 hover:bg-nav-card hover:text-nav-text active:scale-[0.90]"
                aria-label="Remove bullet"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={add}
          className="mt-2 flex items-center gap-1.5 text-xs font-medium text-nav-muted transition-colors duration-100 hover:text-nav-text active:scale-[0.97]"
        >
          <Plus className="h-3.5 w-3.5" /> Add bullet
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-nav-muted">💡 {hint}</span>
        <button
          onClick={generate}
          disabled={busy === "new"}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-glow-sm transition-all duration-150 hover:brightness-110 hover:shadow-glow-primary active:scale-[0.97] disabled:opacity-50"
        >
          {busy === "new" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {busy === "new" ? "Thinking…" : "Generate Bullet"}
        </button>
      </div>
    </div>
  );
}

export { callAI };
