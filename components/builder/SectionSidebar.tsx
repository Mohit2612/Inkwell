"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Plus, MoreHorizontal, Trash2, Check } from "lucide-react";
import ScoreRing from "./ScoreRing";

export interface ListItem {
  id: string;
  primary: string;
  secondary?: string;
}

export default function SectionSidebar({
  score,
  sectionLabel,
  items,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
}: {
  score: number;
  sectionLabel: string;
  items: ListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="w-[300px] shrink-0 space-y-4">
      {/* Video intro placeholder */}
      <div className="flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-300">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-slate-600">
          <Play className="h-5 w-5" />
        </span>
      </div>

      {/* Score + list card */}
      <div className="rounded-xl border border-nav-border bg-nav-panel p-4">
        <ScoreRing score={score} />

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-nav-text">
            Your {sectionLabel}
          </span>
          <button
            onClick={onAdd}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-nav-indigo text-white transition hover:brightness-110"
            aria-label={`Add ${sectionLabel}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 space-y-1">
          {items.length === 0 && (
            <p className="px-1 py-2 text-xs text-nav-muted">
              Nothing yet — tap + to add.
            </p>
          )}
          {items.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              active={it.id === selectedId}
              onSelect={() => onSelect(it.id)}
              onDelete={() => onDelete(it.id)}
            />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-nav-border pt-3">
          <span className="text-xs text-nav-muted">Sort by date</span>
          <span className="relative h-5 w-9 rounded-full bg-nav-indigo">
            <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
          </span>
        </div>
      </div>
    </aside>
  );
}

function ItemRow({
  item,
  active,
  onSelect,
  onDelete,
}: {
  item: ListItem;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
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
    <div
      className={`group flex items-start gap-2 rounded-lg px-3 py-2 transition ${
        active ? "bg-nav-card" : "hover:bg-nav-card/60"
      }`}
    >
      <button onClick={onSelect} className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm font-medium text-nav-text">
          {item.primary || "Untitled"}
        </div>
        {item.secondary && (
          <div className="truncate text-xs text-nav-muted">{item.secondary}</div>
        )}
      </button>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded p-1 text-nav-muted opacity-0 transition hover:text-nav-text group-hover:opacity-100"
          aria-label="Item actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {open && (
          <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-lg border border-nav-border bg-nav-panel py-1 shadow-xl">
            <button
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function SavedButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      onClick={() => {
        onClick?.();
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }}
      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
    >
      {saved ? <Check className="h-4 w-4" /> : null}
      {saved ? "Saved" : label}
    </button>
  );
}
