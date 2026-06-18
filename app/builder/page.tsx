"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useResumeStore } from "@/lib/store";
import { useCoverStore } from "@/lib/coverStore";
import {
  ResumeData,
  Experience,
  Project,
  Education,
  Certification,
  SkillGroup,
  newExperience,
  newProject,
  newEducation,
  newCertification,
  newSkillGroup,
} from "@/lib/types";
import { scoreResume } from "@/lib/score";
import SectionSidebar, { SavedButton } from "@/components/builder/SectionSidebar";
import { Label, DInput, DTextarea, Card, BulletEditor, callAI } from "@/components/builder/fields";
import ResumePreview from "@/components/ResumePreview";
import {
  ArrowLeft,
  ChevronDown,
  MoreHorizontal,
  Sparkles,
  Loader2,
  Check,
  Save,
  Eye,
} from "lucide-react";

type Tab =
  | "contact"
  | "experience"
  | "project"
  | "education"
  | "certifications"
  | "skills"
  | "summary";

const MAIN_TABS: { key: Tab; label: string }[] = [
  { key: "contact", label: "Contact" },
  { key: "experience", label: "Experience" },
  { key: "project", label: "Project" },
  { key: "education", label: "Education" },
  { key: "certifications", label: "Certifications" },
  { key: "skills", label: "Skills" },
  { key: "summary", label: "Summary" },
];

function Builder() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id") ?? "";
  const { getResume, updateData, renameResume } = useResumeStore();
  const coverStore = useCoverStore();

  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<ResumeData | null>(null);
  const [name, setName] = useState("");
  const [tab, setTab] = useState<Tab>("contact");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const r = getResume(id);
    if (!r) {
      router.replace("/dashboard");
      return;
    }
    setData(r.data);
    setName(r.name);
  }, [mounted, id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data) return;
    setSaveStatus("saving");
    const t = setTimeout(() => {
      updateData(id, data);
      setSaveStatus("saved");
      const clear = setTimeout(() => setSaveStatus("idle"), 2000);
      return () => clearTimeout(clear);
    }, 400);
    return () => clearTimeout(t);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const score = useMemo(() => (data ? scoreResume(data).total : 0), [data]);

  if (!mounted || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nav-bg text-nav-muted">
        Loading…
      </div>
    );
  }

  const openCoverLetter = () => {
    const cid = coverStore.createLetter(`${name} - Cover Letter`);
    const l = coverStore.getLetter(cid);
    if (l) {
      coverStore.updateData(cid, {
        ...l.data,
        contact: {
          ...l.data.contact,
          fullName: data.contact.fullName,
          email: data.contact.email,
          phone: data.contact.phone,
          address: [data.contact.city, data.contact.state, data.contact.country]
            .filter(Boolean)
            .join(", "),
        },
      });
    }
    router.push(`/cover-letter?id=${cid}`);
  };

  return (
    <main id="main-content" className="flex min-h-screen flex-col bg-nav-bg text-nav-text">
      <header className="flex flex-wrap items-center gap-3 px-6 py-4 print:hidden">
        <Link
          href="/dashboard"
          className="rounded p-1.5 text-nav-muted hover:bg-nav-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2 rounded-lg bg-nav-panel px-3 py-2">
          <input
            className="w-52 bg-transparent text-sm font-semibold uppercase tracking-wide outline-none focus-visible:outline-none"
            value={name}
            aria-label="Resume name"
            onChange={(e) => {
              setName(e.target.value);
              renameResume(id, e.target.value);
            }}
          />
          <ChevronDown className="h-4 w-4 text-nav-muted" aria-hidden="true" />
        </div>

        <nav className="flex flex-wrap items-center gap-1 rounded-lg bg-nav-panel p-1" aria-label="Resume sections">
          {MAIN_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
              className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                tab === t.key ? "bg-nav-indigo text-white" : "text-nav-muted hover:text-nav-text"
              }`}
            >
              {t.label}
            </button>
          ))}
          <MoreMenu />
        </nav>

        <div className="flex items-center gap-1 rounded-lg bg-nav-panel p-1">
          <Link
            href={`/builder/preview?id=${id}`}
            className="rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-nav-muted hover:text-nav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Finish up & Preview
          </Link>
          <button
            onClick={openCoverLetter}
            className="rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-nav-muted hover:text-nav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            AI Cover Letter
          </button>
        </div>

        {/* Mobile preview toggle */}
        <button
          onClick={() => setShowPreview((p) => !p)}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-nav-panel px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-nav-muted hover:text-nav-text xl:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={showPreview ? "Hide preview" : "Show preview"}
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          {showPreview ? "Editor" : "Preview"}
        </button>

        {/* Autosave indicator */}
        <span
          aria-live="polite"
          aria-atomic="true"
          className={`ml-auto hidden items-center gap-1.5 text-xs transition xl:flex ${
            saveStatus === "saved"
              ? "text-accent"
              : saveStatus === "saving"
              ? "text-nav-muted"
              : "text-transparent"
          }`}
        >
          {saveStatus === "saving" ? (
            <>
              <Save className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
              Saving…
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Saved
            </>
          )}
        </span>
      </header>

      {/* ── Body: editor + optional xl split-pane preview ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor pane */}
        <div
          className={`flex-1 overflow-y-auto px-6 pb-16 ${showPreview ? "hidden xl:block" : ""}`}
        >
          {tab === "contact" && <ContactTab data={data} setData={setData} />}
          {tab === "experience" && <ExperienceTab data={data} setData={setData} score={score} />}
          {tab === "project" && <ProjectTab data={data} setData={setData} score={score} />}
          {tab === "education" && <EducationTab data={data} setData={setData} score={score} />}
          {tab === "certifications" && <CertificationsTab data={data} setData={setData} score={score} />}
          {tab === "skills" && <SkillsTab data={data} setData={setData} score={score} />}
          {tab === "summary" && <SummaryTab data={data} setData={setData} />}
        </div>

        {/* Preview pane — mobile (toggled) + always-on xl */}
        <div
          className={`flex-1 overflow-hidden border-l border-nav-border bg-nav-panel xl:block ${
            showPreview ? "block" : "hidden xl:block"
          }`}
          aria-label="Live resume preview"
        >
          <div className="flex h-full items-start justify-center overflow-auto py-6">
            <div
              style={{ transform: "scale(0.65)", transformOrigin: "top center", width: "794px" }}
              className="pointer-events-none shrink-0"
              aria-hidden="true"
            >
              <ResumePreview data={data} flat />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function MoreMenu() {
  const [open, setOpen] = useState(false);
  const opts = [
    { label: "Project", checked: true },
    { label: "Certifications", checked: true },
    { label: "Coursework", checked: false },
    { label: "Involvement", checked: false },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="rounded-md px-2 py-1.5 text-nav-muted hover:text-nav-text"
        aria-label="More sections"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1 w-44 rounded-lg border border-nav-border bg-nav-panel p-1.5 shadow-xl">
          {opts.map((o) => (
            <div
              key={o.label}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-nav-text hover:bg-nav-card"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded ${
                  o.checked ? "bg-nav-indigo text-white" : "border border-nav-border"
                }`}
              >
                {o.checked && <Check className="h-3 w-3" />}
              </span>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContactTab({ data, setData }: { data: ResumeData; setData: (d: ResumeData) => void }) {
  const c = data.contact;
  const set = (k: keyof typeof c, v: string | boolean) =>
    setData({ ...data, contact: { ...c, [k]: v } });

  return (
    <Card>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <Label>Full name</Label>
          <DInput value={c.fullName} onChange={(v) => set("fullName", v)} placeholder="Your name" />
        </div>
        <div>
          <Label>Email address</Label>
          <DInput value={c.email} onChange={(v) => set("email", v)} placeholder="you@email.com" />
        </div>
        <div>
          <Label>Phone number</Label>
          <DInput value={c.phone} onChange={(v) => set("phone", v)} placeholder="+1 ..." />
        </div>
        <div>
          <Label>LinkedIn URL</Label>
          <DInput value={c.linkedin} onChange={(v) => set("linkedin", v)} placeholder="https://linkedin.com/in/you" />
        </div>
        <div>
          <Label>Personal website or relevant link</Label>
          <DInput value={c.website} onChange={(v) => set("website", v)} placeholder="https://yoursite.dev" />
        </div>
        <div>
          <Label>Country</Label>
          <DInput value={c.country} onChange={(v) => set("country", v)} placeholder="USA" />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label>State</Label>
            <button
              onClick={() => set("showState", !c.showState)}
              className="flex items-center gap-1.5 text-xs text-nav-muted"
            >
              Show on resume
              <span className={`relative h-4 w-8 rounded-full transition ${c.showState ? "bg-nav-indigo" : "bg-nav-card"}`}>
                <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${c.showState ? "left-[18px]" : "left-0.5"}`} />
              </span>
            </button>
          </div>
          <DInput value={c.state} onChange={(v) => set("state", v)} placeholder="State" />
        </div>
        <div>
          <Label>City</Label>
          <DInput value={c.city} onChange={(v) => set("city", v)} placeholder="City" />
        </div>
        <div>
          <Label>Professional title</Label>
          <DInput value={c.title} onChange={(v) => set("title", v)} placeholder="Frontend Engineer" />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <SavedButton label="Save basic info" />
      </div>
    </Card>
  );
}

function useSelected<T extends { id: string }>(items: T[]) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  useEffect(() => {
    if (!selectedId && items[0]) setSelectedId(items[0].id);
    if (selectedId && !items.find((i) => i.id === selectedId))
      setSelectedId(items[0]?.id ?? null);
  }, [items, selectedId]);
  return [selectedId, setSelectedId] as const;
}

function ExperienceTab({ data, setData, score }: { data: ResumeData; setData: (d: ResumeData) => void; score: number }) {
  const items = data.experience;
  const [selectedId, setSelectedId] = useSelected(items);
  const current = items.find((i) => i.id === selectedId);

  const update = (fn: (e: Experience) => Experience) =>
    setData({ ...data, experience: items.map((e) => (e.id === selectedId ? fn(e) : e)) });
  const add = () => {
    const e = newExperience();
    setData({ ...data, experience: [...items, e] });
    setSelectedId(e.id);
  };
  const del = (id: string) => setData({ ...data, experience: items.filter((e) => e.id !== id) });

  return (
    <div className="flex gap-6">
      <SectionSidebar
        score={score}
        sectionLabel="Experience"
        items={items.map((e) => ({ id: e.id, primary: e.role, secondary: `${e.company}${e.start ? `, ${e.start} - ${e.end}` : ""}` }))}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={add}
        onDelete={del}
      />
      <div className="flex-1">
        {!current ? (
          <EmptyPrompt onAdd={add} label="experience" />
        ) : (
          <Card>
            <h2 className="text-lg font-bold">
              {current.role || "New role"}{" "}
              <span className="text-sm font-normal text-nav-muted">
                {[current.company, current.start && `${current.start} - ${current.end}`].filter(Boolean).join(", ")}
              </span>
            </h2>
            <div className="mt-5 grid gap-5">
              <div>
                <Label>What was your role?</Label>
                <DInput value={current.role} onChange={(v) => update((e) => ({ ...e, role: v }))} placeholder="Quality Assurance Engineer" />
              </div>
              <div>
                <Label>For which company did you work? *</Label>
                <DInput value={current.company} onChange={(v) => update((e) => ({ ...e, company: v }))} placeholder="Company" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>How long were you there?</Label>
                  <div className="flex items-center gap-2">
                    <DInput value={current.start} onChange={(v) => update((e) => ({ ...e, start: v }))} placeholder="Jan 2024" />
                    <span className="text-nav-muted">-</span>
                    <DInput value={current.end} onChange={(v) => update((e) => ({ ...e, end: v }))} placeholder="Present" />
                  </div>
                </div>
                <div>
                  <Label>Where was it located?</Label>
                  <DInput value={current.location} onChange={(v) => update((e) => ({ ...e, location: v }))} placeholder="USA" />
                </div>
              </div>
              <div>
                <Label>What did you do there?</Label>
                <BulletEditor bullets={current.bullets} onChange={(b) => update((e) => ({ ...e, bullets: b }))} />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <SavedButton label="Save to experience list" />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function ProjectTab({ data, setData, score }: { data: ResumeData; setData: (d: ResumeData) => void; score: number }) {
  const items = data.projects;
  const [selectedId, setSelectedId] = useSelected(items);
  const current = items.find((i) => i.id === selectedId);

  const update = (fn: (p: Project) => Project) =>
    setData({ ...data, projects: items.map((p) => (p.id === selectedId ? fn(p) : p)) });
  const add = () => {
    const p = newProject();
    setData({ ...data, projects: [...items, p] });
    setSelectedId(p.id);
  };
  const del = (id: string) => setData({ ...data, projects: items.filter((p) => p.id !== id) });

  return (
    <div className="flex gap-6">
      <SectionSidebar
        score={score}
        sectionLabel="Project"
        items={items.map((p) => ({ id: p.id, primary: p.title, secondary: "Details" }))}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={add}
        onDelete={del}
      />
      <div className="flex-1">
        {!current ? (
          <EmptyPrompt onAdd={add} label="project" />
        ) : (
          <Card>
            <h2 className="text-lg font-bold">{current.title || "New project"}</h2>
            <div className="mt-5 grid gap-5">
              <div>
                <Label>Give your project a title *</Label>
                <DInput value={current.title} onChange={(v) => update((p) => ({ ...p, title: v }))} placeholder="Full-Stack Web App" />
              </div>
              <div>
                <Label>In which organization did you do it?</Label>
                <DInput value={current.organization} onChange={(v) => update((p) => ({ ...p, organization: v }))} placeholder="Clark University" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>When did you do it?</Label>
                  <div className="flex items-center gap-2">
                    <DInput value={current.start} onChange={(v) => update((p) => ({ ...p, start: v }))} placeholder="Jun 2026" />
                    <span className="text-nav-muted">-</span>
                    <DInput value={current.end} onChange={(v) => update((p) => ({ ...p, end: v }))} placeholder="Jun 2026" />
                  </div>
                </div>
                <div>
                  <Label>Project URL</Label>
                  <DInput value={current.url} onChange={(v) => update((p) => ({ ...p, url: v }))} placeholder="https://rezi.ai" />
                </div>
              </div>
              <div>
                <Label>Now describe what you did</Label>
                <BulletEditor bullets={current.bullets} onChange={(b) => update((p) => ({ ...p, bullets: b }))} />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <SavedButton label="Save to project list" />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function EducationTab({ data, setData, score }: { data: ResumeData; setData: (d: ResumeData) => void; score: number }) {
  const items = data.education;
  const [selectedId, setSelectedId] = useSelected(items);
  const current = items.find((i) => i.id === selectedId);

  const update = (fn: (e: Education) => Education) =>
    setData({ ...data, education: items.map((e) => (e.id === selectedId ? fn(e) : e)) });
  const add = () => {
    const e = newEducation();
    setData({ ...data, education: [...items, e] });
    setSelectedId(e.id);
  };
  const del = (id: string) => setData({ ...data, education: items.filter((e) => e.id !== id) });

  return (
    <div className="flex gap-6">
      <SectionSidebar
        score={score}
        sectionLabel="Education"
        items={items.map((e) => ({ id: e.id, primary: e.degree, secondary: `${e.school}${e.year ? `, ${e.year}` : ""}` }))}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={add}
        onDelete={del}
      />
      <div className="flex-1">
        {!current ? (
          <EmptyPrompt onAdd={add} label="education" />
        ) : (
          <Card>
            <h2 className="text-lg font-bold">
              {current.degree || "New education"}{" "}
              <span className="text-sm font-normal text-nav-muted">{current.year}</span>
            </h2>
            <div className="mt-5 grid gap-5">
              <div>
                <Label>What is your degree or qualification and major? *</Label>
                <DInput value={current.degree} onChange={(v) => update((e) => ({ ...e, degree: v }))} placeholder="Master of Science in Computer Science" />
              </div>
              <div>
                <Label>Where did you earn it?</Label>
                <DInput value={current.school} onChange={(v) => update((e) => ({ ...e, school: v }))} placeholder="Clark University" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>Where is it located?</Label>
                  <DInput value={current.location} onChange={(v) => update((e) => ({ ...e, location: v }))} placeholder="USA" />
                </div>
                <div>
                  <Label>When did you earn it?</Label>
                  <DInput value={current.year} onChange={(v) => update((e) => ({ ...e, year: v }))} placeholder="2024" />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>Did you minor in anything?</Label>
                  <DInput value={current.minor} onChange={(v) => update((e) => ({ ...e, minor: v }))} placeholder="Mathematics" />
                </div>
                <div>
                  <Label>GPA (if applicable)</Label>
                  <DInput value={current.gpa} onChange={(v) => update((e) => ({ ...e, gpa: v }))} placeholder="3.82" />
                </div>
              </div>
              <div>
                <Label>Open field for additional information</Label>
                <DTextarea value={current.info} onChange={(v) => update((e) => ({ ...e, info: v }))} placeholder="• Awarded full scholarship for 4 years due to grades." />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <SavedButton label="Save to education list" />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function CertificationsTab({ data, setData, score }: { data: ResumeData; setData: (d: ResumeData) => void; score: number }) {
  const items = data.certifications;
  const [selectedId, setSelectedId] = useSelected(items);
  const current = items.find((i) => i.id === selectedId);

  const update = (fn: (c: Certification) => Certification) =>
    setData({ ...data, certifications: items.map((c) => (c.id === selectedId ? fn(c) : c)) });
  const add = () => {
    const c = newCertification();
    setData({ ...data, certifications: [...items, c] });
    setSelectedId(c.id);
  };
  const del = (id: string) => setData({ ...data, certifications: items.filter((c) => c.id !== id) });

  return (
    <div className="flex gap-6">
      <SectionSidebar
        score={score}
        sectionLabel="Certifications"
        items={items.map((c) => ({ id: c.id, primary: c.name, secondary: "Details" }))}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={add}
        onDelete={del}
      />
      <div className="flex-1">
        {!current ? (
          <EmptyPrompt onAdd={add} label="certification" />
        ) : (
          <Card>
            <h2 className="text-lg font-bold">{current.name || "New certification"}</h2>
            <div className="mt-5 grid gap-5">
              <div>
                <Label>What was the certificate name? *</Label>
                <DInput value={current.name} onChange={(v) => update((c) => ({ ...c, name: v }))} placeholder="Microsoft Azure Fundamentals" />
              </div>
              <div>
                <Label>Where did you get the certificate?</Label>
                <DInput value={current.issuer} onChange={(v) => update((c) => ({ ...c, issuer: v }))} placeholder="Microsoft" />
              </div>
              <div>
                <Label>When did you get it?</Label>
                <DInput value={current.date} onChange={(v) => update((c) => ({ ...c, date: v }))} placeholder="2026" />
              </div>
              <div>
                <Label>How is the certificate relevant?</Label>
                <DTextarea value={current.relevance} onChange={(v) => update((c) => ({ ...c, relevance: v }))} placeholder="• Certified in an evolving set of cloud principles." />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <SavedButton label="Save to certifications list" />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function SkillsTab({ data, setData, score }: { data: ResumeData; setData: (d: ResumeData) => void; score: number }) {
  const items = data.skillGroups;
  const [selectedId, setSelectedId] = useSelected(items);
  const current = items.find((i) => i.id === selectedId);
  const [loading, setLoading] = useState(false);

  const update = (fn: (g: SkillGroup) => SkillGroup) =>
    setData({ ...data, skillGroups: items.map((g) => (g.id === selectedId ? fn(g) : g)) });
  const add = () => {
    const g = newSkillGroup();
    setData({ ...data, skillGroups: [...items, g] });
    setSelectedId(g.id);
  };
  const del = (id: string) => setData({ ...data, skillGroups: items.filter((g) => g.id !== id) });

  const explore = async () => {
    if (!current) return;
    setLoading(true);
    try {
      const r = await callAI({
        task: "rewrite-bullet",
        text: `Suggest 8 relevant skills as a comma-separated list for ${current.title || data.contact.title}: ${current.content}`,
      });
      if (r) update((g) => ({ ...g, content: r.replace(/^[-•\s]+/, "") }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-6">
      <SectionSidebar
        score={score}
        sectionLabel="Skills"
        items={items.map((g, i) => ({ id: g.id, primary: g.title || `Skills ${i + 1}`, secondary: g.content }))}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={add}
        onDelete={del}
      />
      <div className="flex-1">
        {!current ? (
          <EmptyPrompt onAdd={add} label="skill group" />
        ) : (
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-nav-muted">
                Enter the skills you possess *
              </h2>
              <button
                onClick={explore}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:brightness-110 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                AI Skills Explorer
              </button>
            </div>
            <div className="mt-4 grid gap-4">
              <div>
                <Label>Category</Label>
                <DInput value={current.title} onChange={(v) => update((g) => ({ ...g, title: v }))} placeholder="Test Automation" />
              </div>
              <div>
                <Label>Skills</Label>
                <DTextarea
                  rows={4}
                  value={current.content}
                  onChange={(v) => update((g) => ({ ...g, content: v }))}
                  placeholder="Selenium WebDriver, RESTAssured, JUnit, TestNG, Cucumber, Playwright"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <SavedButton label="Save to skills list" />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function SummaryTab({ data, setData }: { data: ResumeData; setData: (d: ResumeData) => void }) {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState(data.skillGroups[0]?.content ?? "");
  const [position, setPosition] = useState(data.experience[0]?.role ?? data.contact.title);

  const generate = async () => {
    setLoading(true);
    try {
      const r = await callAI({
        task: "summary",
        role: position,
        context: `Role: ${position}. Skills: ${skills}. Recent: ${data.experience[0]?.role || ""} at ${data.experience[0]?.company || ""}.`,
      });
      if (r) setData({ ...data, summary: r });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <Label>Write a professional summary</Label>
        <DTextarea
          rows={12}
          value={data.summary}
          onChange={(v) => setData({ ...data, summary: v })}
          placeholder="Senior QA Automation Engineer with 5+ years of experience delivering enterprise-scale quality engineering…"
        />
        <div className="mt-6 flex justify-end">
          <SavedButton label="Save summary info" />
        </div>
      </Card>

      <aside className="h-fit rounded-2xl border border-nav-border bg-nav-panel p-5">
        <h3 className="text-base font-bold">AI Summary Writer</h3>
        <p className="mt-1 text-sm text-nav-muted">
          Helps you write your summary for a targeted job position. Strange result? Just regenerate!
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <Label>Position highlight *</Label>
            <DInput value={position} onChange={setPosition} placeholder="Quality Assurance Engineer" />
          </div>
          <div>
            <Label>Skills highlight *</Label>
            <DInput value={skills} onChange={setSkills} placeholder="Java, Selenium, RESTAssured" />
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Writing…" : "AI Writer Ready"}
        </button>
      </aside>
    </div>
  );
}

function EmptyPrompt({ onAdd, label }: { onAdd: () => void; label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-nav-border p-12 text-center">
      <p className="text-sm text-nav-muted">No {label} yet.</p>
      <button
        onClick={onAdd}
        className="mt-4 rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
      >
        Add {label}
      </button>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-nav-bg text-nav-muted">
          Loading…
        </div>
      }
    >
      <Builder />
    </Suspense>
  );
}
