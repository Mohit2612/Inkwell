"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCoverStore } from "@/lib/coverStore";
import { CoverData } from "@/lib/types";
import CoverLetterPreview from "@/components/CoverLetterPreview";
import {
  ChevronDown,
  ArrowLeft,
  Download,
  Sparkles,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";

type Tab = "contact" | "content" | "finish";

function Editor() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id") ?? "";
  const { getLetter, updateData, renameLetter } = useCoverStore();

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("contact");
  const [data, setData] = useState<CoverData | null>(null);
  const [name, setName] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const l = getLetter(id);
    if (!l) {
      router.replace("/dashboard");
      return;
    }
    setData(l.data);
    setName(l.name);
  }, [mounted, id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => updateData(id, data), 400);
    return () => clearTimeout(t);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nav-bg text-nav-muted">
        Loading…
      </div>
    );
  }

  const setContact = (k: keyof CoverData["contact"], v: string) =>
    setData({ ...data, contact: { ...data.contact, [k]: v } });

  return (
    <main className="min-h-screen bg-nav-bg text-nav-text">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-6 py-4 print:hidden">
        <Link href="/dashboard" className="rounded p-1.5 text-nav-muted hover:bg-nav-card">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2 rounded-lg bg-nav-panel px-3 py-1.5">
          <input
            className="bg-transparent text-sm font-semibold outline-none"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              renameLetter(id, e.target.value);
            }}
          />
          <ChevronDown className="h-4 w-4 text-nav-muted" />
        </div>
        <nav className="flex gap-1 rounded-lg bg-nav-panel p-1">
          {(["contact", "content", "finish"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                tab === t ? "bg-nav-indigo text-white" : "text-nav-muted hover:text-nav-text"
              }`}
            >
              {t === "contact" ? "Contact" : t === "content" ? "Content" : "Finish up & Preview"}
            </button>
          ))}
        </nav>
      </header>

      <div className="px-6 pb-16">
        {tab === "contact" && (
          <ContactTab data={data} setContact={setContact} onSave={() => setTab("content")} />
        )}
        {tab === "content" && (
          <ContentTab
            value={data.content}
            onChange={(v) => setData({ ...data, content: v })}
            onSave={() => setTab("finish")}
          />
        )}
        {tab === "finish" && <FinishTab data={data} setData={setData} />}
      </div>
    </main>
  );
}

/* ---------- Contact tab ---------- */

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-nav-muted">
        {label}
      </label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-nav-border bg-nav-bg px-3 py-2.5 text-sm outline-none transition placeholder:text-nav-muted/60 focus:border-nav-indigo"
      />
    </div>
  );
}

function ContactTab({
  data,
  setContact,
  onSave,
}: {
  data: CoverData;
  setContact: (k: keyof CoverData["contact"], v: string) => void;
  onSave: () => void;
}) {
  const c = data.contact;
  return (
    <div className="mx-auto max-w-5xl rounded-2xl border border-nav-border bg-nav-panel p-7">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Full name" value={c.fullName} onChange={(v) => setContact("fullName", v)} placeholder="Your name" />
        <Field label="Email address" value={c.email} onChange={(v) => setContact("email", v)} placeholder="you@email.com" />
        <Field label="Phone number" value={c.phone} onChange={(v) => setContact("phone", v)} placeholder="+1 ..." />
        <Field label="Your personal address" value={c.address} onChange={(v) => setContact("address", v)} placeholder="City, State, Country" />
        <Field label="Date" value={c.date} onChange={(v) => setContact("date", v)} placeholder="April 20th, 2020" />
        <Field label={<>Company name <span className="font-normal">you are applying for</span></>} value={c.company} onChange={(v) => setContact("company", v)} placeholder="Google" />
        <div className="md:col-span-2">
          <Field
            label={<>Name or/and title <span className="font-normal">of the person to address your cover letter to</span></>}
            value={c.recipient}
            onChange={(v) => setContact("recipient", v)}
            placeholder="Dear Hiring Team,"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={onSave} className="rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110">
          Save basic info
        </button>
      </div>
    </div>
  );
}

/* ---------- Content tab ---------- */

function ContentTab({
  value,
  onChange,
  onSave,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl rounded-2xl border border-nav-border bg-nav-panel p-7">
      <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-nav-muted">
        Write a professional cover letter
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="As an accomplished Marketing graduate from Wisconsin University with years of strategic marketing and data analysis experience, …"
        className="min-h-[300px] w-full resize-y rounded-lg border border-nav-border bg-nav-bg p-4 text-sm outline-none transition placeholder:text-nav-muted/60 focus:border-nav-indigo"
      />
      <div className="mt-6 flex justify-end">
        <button onClick={onSave} className="rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110">
          Save content
        </button>
      </div>
    </div>
  );
}

/* ---------- Finish up & preview tab ---------- */

function FinishTab({
  data,
  setData,
}: {
  data: CoverData;
  setData: (d: CoverData) => void;
}) {
  const [company, setCompany] = useState(data.contact.company);
  const [position, setPosition] = useState("");
  const [posHi, setPosHi] = useState("");
  const [eduHi, setEduHi] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "cover-letter",
          fullName: data.contact.fullName,
          company,
          position,
          positionHighlight: posHi,
          educationHighlight: eduHi,
          skills,
        }),
      });
      const json = await res.json();
      if (json.result) {
        setData({
          ...data,
          content: json.result,
          contact: { ...data.contact, company },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_340px]">
      {/* Preview + adjustments */}
      <div>
        <div className="mb-4 flex items-center justify-between rounded-xl border border-nav-border bg-nav-panel px-4 py-3 print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wide text-nav-muted">
              Adjustments
            </span>
            <div className="flex items-center gap-1 rounded-lg bg-nav-bg p-1">
              <button
                onClick={() => setData({ ...data, fontSize: Math.max(8, data.fontSize - 1) })}
                className="rounded p-1 hover:bg-nav-card"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-sm">{data.fontSize}</span>
              <button
                onClick={() => setData({ ...data, fontSize: Math.min(16, data.fontSize + 1) })}
                className="rounded p-1 hover:bg-nav-card"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <select
              value={data.lineHeight}
              onChange={(e) => setData({ ...data, lineHeight: parseFloat(e.target.value) })}
              className="rounded-lg border border-nav-border bg-nav-bg px-2 py-1 text-sm outline-none"
            >
              <option value={1.15}>1.15</option>
              <option value={1.5}>1.5</option>
              <option value={2}>2.0</option>
            </select>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>
        <CoverLetterPreview data={data} />
      </div>

      {/* AI writer panel */}
      <aside className="h-fit rounded-2xl border border-nav-border bg-nav-panel p-5 print:hidden">
        <h3 className="text-base font-bold">AI Cover Letter Writer</h3>
        <p className="mt-1 text-sm text-nav-muted">
          Creates a tailored cover letter in seconds. Add the job details and
          we&apos;ll generate a draft aligned to the role. Regenerate anytime.
        </p>
        <div className="mt-4 space-y-3">
          <PanelField label={<>Company name <span className="text-red-400">*</span></>} value={company} onChange={setCompany} placeholder="Google" />
          <PanelField label={<>Position/title <span className="text-red-400">*</span></>} value={position} onChange={setPosition} placeholder="Data Analyst" />
          <PanelField label="Position highlight" value={posHi} onChange={setPosHi} placeholder="Marketing Assistant at Sony" />
          <PanelField label="Education highlight" value={eduHi} onChange={setEduHi} placeholder="Master in Computer Science at…" />
          <PanelField label={<>Skills highlight <span className="text-red-400">*</span></>} value={skills} onChange={setSkills} placeholder="SQL, Python, dashboards" />
        </div>
        <button
          onClick={generate}
          disabled={loading || !company || !position || !skills}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Writing…" : "AI Writer Ready"}
        </button>
      </aside>
    </div>
  );
}

function PanelField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-nav-muted">
        {label}
      </label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-nav-border bg-nav-bg px-3 py-2 text-sm outline-none transition placeholder:text-nav-muted/60 focus:border-nav-indigo"
      />
    </div>
  );
}

export default function CoverLetterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-nav-bg text-nav-muted">
          Loading…
        </div>
      }
    >
      <Editor />
    </Suspense>
  );
}
