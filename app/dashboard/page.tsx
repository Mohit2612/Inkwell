"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useResumeStore } from "@/lib/store";
import { useCoverStore } from "@/lib/coverStore";
import { Resume, CoverLetter } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import ResumeThumbnail from "@/components/ResumeThumbnail";
import CoverThumbnail from "@/components/CoverThumbnail";
import CreateResumeModal, { CreateOptions } from "@/components/CreateResumeModal";
import {
  Sparkles,
  Video,
  Plus,
  MoreVertical,
  Copy,
  Trash2,
  Pencil,
  Settings,
  ChevronDown,
  LayoutGrid,
  List,
  Check,
  FileText,
  Mail,
  Menu,
} from "lucide-react";

type Tab = "resumes" | "cover" | "resignation";
type SortKey = "name" | "createdAt" | "updatedAt";
type ViewMode = "grid" | "list";

const sortLabels: Record<SortKey, string> = {
  name: "Name",
  createdAt: "Created",
  updatedAt: "Edited",
};

export default function Dashboard() {
  const router = useRouter();
  const resumeStore = useResumeStore();
  const coverStore = useCoverStore();

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("resumes");
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [view, setView] = useState<ViewMode>("grid");
  const [showModal, setShowModal] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  // Close mobile nav on route changes / resize
  useEffect(() => {
    const close = () => setMobileNavOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  const createResume = (opts: CreateOptions) => {
    const id = opts.parsedData
      ? resumeStore.createResumeWithData(opts.name, opts.parsedData)
      : resumeStore.createResume(opts.name, opts.withSample);
    setShowModal(false);
    router.push(`/builder?id=${id}`);
  };

  const createCover = () => {
    const id = coverStore.createLetter("Untitled cover letter");
    router.push(`/cover-letter?id=${id}`);
  };

  const sortedResumes = useMemo(() => {
    const list = [...resumeStore.resumes];
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => (b[sort] ?? 0) - (a[sort] ?? 0));
    return list;
  }, [resumeStore.resumes, sort]);

  const sortedCovers = useMemo(() => {
    const list = [...coverStore.letters];
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => (b[sort] ?? 0) - (a[sort] ?? 0));
    return list;
  }, [coverStore.letters, sort]);

  return (
    <div className="flex min-h-screen bg-nav-bg text-nav-text">
      <Sidebar
        onCreate={() => setShowModal(true)}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── Mobile header ─────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-nav-border bg-nav-bg px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="rounded-md p-2 text-nav-muted hover:bg-nav-card hover:text-nav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-nav-text">Dashboard</span>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-3 py-1.5 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Create
          </button>
        </div>

        {/* ── Desktop header ────────────────────────────────── */}
        <header className="hidden items-center justify-between px-8 py-5 md:flex">
          <div className="flex gap-1 rounded-xl bg-nav-panel p-1" role="tablist" aria-label="Content type">
            <TabButtons tab={tab} setTab={setTab} />
          </div>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-nav-blue to-nav-indigo text-sm font-semibold text-white"
            aria-label="User account"
          >
            A
          </div>
        </header>

        {/* ── Mobile tabs ───────────────────────────────────── */}
        <div
          className="flex gap-1 overflow-x-auto border-b border-nav-border bg-nav-bg px-4 py-2 md:hidden"
          role="tablist"
          aria-label="Content type"
        >
          <TabButtons tab={tab} setTab={setTab} />
        </div>

        <div className="flex-1 overflow-x-hidden px-4 pb-16 md:px-8">
          {/* Feature promo cards */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
              title="AI Resume Agent"
              subtitle="Our most powerful AI resume tool"
              onClick={() => router.push("/agent")}
            />
            <FeatureCard
              icon={<Video className="h-5 w-5" aria-hidden="true" />}
              title="AI Interview"
              subtitle="Practice before the real thing — coming soon"
            />
          </div>

          {/* Section header */}
          <div className="mt-10 flex items-center justify-between">
            <h1 className="text-xl font-bold">
              {tab === "resumes"
                ? "Resumes"
                : tab === "cover"
                ? "Cover Letters"
                : "Resignation Letters"}
            </h1>
            {tab !== "resignation" && (
              <div className="flex items-center gap-3">
                <SortDropdown sort={sort} setSort={setSort} />
                <ViewToggle view={view} setView={setView} />
              </div>
            )}
          </div>

          {/* Content area */}
          {tab === "resignation" ? (
            <ComingSoon what="Resignation letters" />
          ) : !mounted ? (
            <DashboardSkeleton />
          ) : tab === "resumes" ? (
            sortedResumes.length === 0 ? (
              <EmptyTabState
                icon={<FileText className="h-6 w-6" />}
                title="No resumes yet"
                description="Create your first resume to get started. It only takes a few minutes."
                onAdd={() => setShowModal(true)}
                addLabel="Create resume"
              />
            ) : view === "grid" ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <CreateCard label="New resume" onClick={() => setShowModal(true)} />
                {sortedResumes.map((r) => (
                  <ResumeCard
                    key={r.id}
                    resume={r}
                    onDuplicate={() => resumeStore.duplicateResume(r.id)}
                    onDelete={() => resumeStore.deleteResume(r.id)}
                  />
                ))}
              </div>
            ) : (
              <ListView
                items={sortedResumes}
                hrefBase="/builder"
                onDuplicate={(id) => resumeStore.duplicateResume(id)}
                onDelete={(id) => resumeStore.deleteResume(id)}
              />
            )
          ) : sortedCovers.length === 0 ? (
            <EmptyTabState
              icon={<Mail className="h-6 w-6" />}
              title="No cover letters yet"
              description="Create a cover letter tailored to a specific role and company."
              onAdd={createCover}
              addLabel="Create cover letter"
            />
          ) : view === "grid" ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <CreateCard label="New cover letter" onClick={createCover} />
              {sortedCovers.map((l) => (
                <CoverCard
                  key={l.id}
                  letter={l}
                  onDuplicate={() => coverStore.duplicateLetter(l.id)}
                  onDelete={() => coverStore.deleteLetter(l.id)}
                />
              ))}
            </div>
          ) : (
            <ListView
              items={sortedCovers}
              hrefBase="/cover-letter"
              onDuplicate={(id) => coverStore.duplicateLetter(id)}
              onDelete={(id) => coverStore.deleteLetter(id)}
            />
          )}
        </div>
      </div>

      {showModal && (
        <CreateResumeModal
          onClose={() => setShowModal(false)}
          onCreate={createResume}
        />
      )}
    </div>
  );
}

/* ── Tabs ──────────────────────────────────────────────── */

function TabButtons({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: { key: Tab; label: string }[] = [
    { key: "resumes", label: "Resumes" },
    { key: "cover", label: "Cover Letters" },
    { key: "resignation", label: "Resignation" },
  ];
  return (
    <>
      {items.map((i) => (
        <button
          key={i.key}
          role="tab"
          aria-selected={tab === i.key}
          onClick={() => setTab(i.key)}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            tab === i.key
              ? "bg-nav-card text-nav-text"
              : "text-nav-muted hover:text-nav-text"
          }`}
        >
          {i.label}
        </button>
      ))}
    </>
  );
}

/* ── Skeletons / empty states ──────────────────────────── */

function DashboardSkeleton() {
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[380px] animate-pulse rounded-xl border border-nav-border bg-nav-panel"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function EmptyTabState({
  icon,
  title,
  description,
  onAdd,
  addLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-nav-border py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-nav-card text-nav-muted">
        {icon}
      </div>
      <h2 className="mt-4 font-semibold text-nav-text">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-nav-muted">{description}</p>
      <button
        onClick={onAdd}
        className="mt-6 flex items-center gap-2 rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {addLabel}
      </button>
    </div>
  );
}

/* ── Feature promo cards ───────────────────────────────── */

function FeatureCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="flex items-center gap-4 rounded-2xl border border-nav-border bg-nav-panel p-5 text-left transition hover:border-nav-indigo/60 hover:bg-nav-card disabled:cursor-default disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nav-blue to-nav-indigo text-white">
        {icon}
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-nav-muted">{subtitle}</span>
      </span>
    </button>
  );
}

/* ── Sort & view controls ──────────────────────────────── */

function SortDropdown({ sort, setSort }: { sort: SortKey; setSort: (s: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-2 rounded-lg border border-nav-border bg-nav-panel px-3 py-2 text-xs font-semibold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {sortLabels[sort]}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Sort by"
          className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-nav-border bg-nav-panel p-1.5 shadow-xl"
        >
          <div className="px-2 py-1 text-xs text-nav-muted">Sort by</div>
          {(["name", "createdAt", "updatedAt"] as SortKey[]).map((k) => (
            <button
              key={k}
              role="option"
              aria-selected={sort === k}
              onClick={() => { setSort(k); setOpen(false); }}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                sort === k
                  ? "bg-nav-indigo/20 text-nav-text"
                  : "text-nav-muted hover:bg-nav-card hover:text-nav-text"
              }`}
            >
              {sortLabels[k]}
              {sort === k && <Check className="h-4 w-4 text-nav-indigo" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ViewToggle({ view, setView }: { view: ViewMode; setView: (v: ViewMode) => void }) {
  return (
    <div className="flex gap-1 rounded-lg border border-nav-border bg-nav-panel p-1" role="group" aria-label="View mode">
      <button
        onClick={() => setView("grid")}
        aria-label="Grid view"
        aria-pressed={view === "grid"}
        className={`rounded-md p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          view === "grid" ? "bg-nav-indigo text-white" : "text-nav-muted hover:text-nav-text"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => setView("list")}
        aria-label="List view"
        aria-pressed={view === "list"}
        className={`rounded-md p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          view === "list" ? "bg-nav-indigo text-white" : "text-nav-muted hover:text-nav-text"
        }`}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}

function CreateCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-nav-border text-nav-muted transition hover:border-nav-indigo hover:text-nav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-nav-card">
        <Plus className="h-6 w-6" aria-hidden="true" />
      </span>
      {label}
    </button>
  );
}

/* ── Shared utilities ──────────────────────────────────── */

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

/* ── Hover action overlay ──────────────────────────────── */

function HoverActions({
  onEdit,
  onDelete,
  onDuplicate,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center gap-3 bg-nav-bg/70 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
      aria-hidden="true"
    >
      <ActionBtn onClick={onEdit} label="Edit">
        <Settings className="h-4 w-4" />
      </ActionBtn>
      <ActionBtn onClick={onDelete} label="Delete">
        <Trash2 className="h-4 w-4" />
      </ActionBtn>
      <ActionBtn onClick={onDuplicate} label="Duplicate">
        <Copy className="h-4 w-4" />
      </ActionBtn>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); onClick(); }}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-nav-indigo/90 text-white shadow-lg transition hover:bg-nav-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      {children}
    </button>
  );
}

/* ── Card menu ─────────────────────────────────────────── */

function CardMenu({
  onDuplicate,
  onDelete,
  editHref,
}: {
  onDuplicate: () => void;
  onDelete: () => void;
  editHref: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="More actions"
        aria-expanded={open}
        aria-haspopup="menu"
        className="rounded-md p-1.5 text-nav-muted hover:bg-nav-card hover:text-nav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-nav-border bg-nav-panel py-1 shadow-xl"
        >
          <Link
            href={editHref}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-nav-card focus-visible:outline-none focus-visible:bg-nav-card"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
          </Link>
          <button
            role="menuitem"
            onClick={() => { onDuplicate(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-nav-card focus-visible:outline-none focus-visible:bg-nav-card"
          >
            <Copy className="h-4 w-4" aria-hidden="true" /> Duplicate
          </button>
          <button
            role="menuitem"
            onClick={() => { onDelete(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 focus-visible:outline-none focus-visible:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Cards ─────────────────────────────────────────────── */

function ResumeCard({
  resume,
  onDuplicate,
  onDelete,
}: {
  resume: Resume;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const href = `/builder?id=${resume.id}`;
  return (
    <article className="group overflow-hidden rounded-xl border border-nav-border bg-nav-panel transition hover:border-nav-indigo/60">
      <Link href={href} className="relative flex h-[300px] items-start justify-center overflow-hidden bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
        <ResumeThumbnail data={resume.data} />
        <HoverActions
          onEdit={() => router.push(href)}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      </Link>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate font-semibold">{resume.name}</div>
          <div className="text-xs text-nav-muted">Edited {timeAgo(resume.updatedAt)}</div>
        </div>
        <CardMenu onDuplicate={onDuplicate} onDelete={onDelete} editHref={href} />
      </div>
    </article>
  );
}

function CoverCard({
  letter,
  onDuplicate,
  onDelete,
}: {
  letter: CoverLetter;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const href = `/cover-letter?id=${letter.id}`;
  return (
    <article className="group overflow-hidden rounded-xl border border-nav-border bg-nav-panel transition hover:border-nav-indigo">
      <Link href={href} className="relative flex h-[300px] items-start justify-center overflow-hidden bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
        <CoverThumbnail data={letter.data} />
        <HoverActions
          onEdit={() => router.push(href)}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      </Link>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate font-semibold">{letter.name}</div>
          <div className="text-xs text-nav-muted">Edited {timeAgo(letter.updatedAt)}</div>
        </div>
        <CardMenu onDuplicate={onDuplicate} onDelete={onDelete} editHref={href} />
      </div>
    </article>
  );
}

/* ── List view ─────────────────────────────────────────── */

function ListView({
  items,
  hrefBase,
  onDuplicate,
  onDelete,
}: {
  items: (Resume | CoverLetter)[];
  hrefBase: string;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-nav-border">
      {items.map((it) => {
        const href = `${hrefBase}?id=${it.id}`;
        return (
          <div
            key={it.id}
            className="flex items-center gap-4 border-b border-nav-border px-4 py-3 last:border-b-0 hover:bg-nav-panel"
          >
            <Link
              href={href}
              className="min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              <div className="truncate font-medium">{it.name}</div>
              <div className="text-xs text-nav-muted">
                Edited {timeAgo(it.updatedAt)} ·{" "}
                Created {new Date(it.createdAt).toLocaleDateString()}
              </div>
            </Link>
            <CardMenu
              onDuplicate={() => onDuplicate(it.id)}
              onDelete={() => onDelete(it.id)}
              editHref={href}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ── Coming soon ───────────────────────────────────────── */

function ComingSoon({ what }: { what: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-nav-border p-12 text-center">
      <h2 className="font-semibold">{what} — coming soon</h2>
      <p className="mt-1 text-sm text-nav-muted">
        Resumes and Cover Letters are fully working.
      </p>
    </div>
  );
}
