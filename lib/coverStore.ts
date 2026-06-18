"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CoverLetter, CoverData, emptyCoverData } from "./types";

interface CoverStore {
  letters: CoverLetter[];
  createLetter: (name: string) => string;
  deleteLetter: (id: string) => void;
  duplicateLetter: (id: string) => void;
  renameLetter: (id: string, name: string) => void;
  getLetter: (id: string) => CoverLetter | undefined;
  updateData: (id: string, data: CoverData) => void;
  hydrate: (letters: CoverLetter[]) => void;
}

export const useCoverStore = create<CoverStore>()(
  persist(
    (set, get) => ({
      letters: [],
      createLetter: (name) => {
        const id = crypto.randomUUID();
        const letter: CoverLetter = {
          id,
          name: name || "Untitled cover letter",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          data: emptyCoverData(),
        };
        set((s) => ({ letters: [letter, ...s.letters] }));
        return id;
      },
      deleteLetter: (id) =>
        set((s) => ({ letters: s.letters.filter((l) => l.id !== id) })),
      duplicateLetter: (id) =>
        set((s) => {
          const src = s.letters.find((l) => l.id === id);
          if (!src) return s;
          const copy: CoverLetter = {
            ...src,
            id: crypto.randomUUID(),
            name: `${src.name} (copy)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            data: JSON.parse(JSON.stringify(src.data)),
          };
          return { letters: [copy, ...s.letters] };
        }),
      renameLetter: (id, name) =>
        set((s) => ({
          letters: s.letters.map((l) =>
            l.id === id ? { ...l, name, updatedAt: Date.now() } : l
          ),
        })),
      getLetter: (id) => get().letters.find((l) => l.id === id),
      updateData: (id, data) =>
        set((s) => ({
          letters: s.letters.map((l) =>
            l.id === id ? { ...l, data, updatedAt: Date.now() } : l
          ),
        })),
      // Replace local state with data loaded from Supabase.
      hydrate: (letters) => set({ letters }),
    }),
    { name: "inkwell-covers" }
  )
);
