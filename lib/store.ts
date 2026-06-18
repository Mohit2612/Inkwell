"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Resume, ResumeData, emptyResumeData, sampleResumeData } from "./types";

interface ResumeStore {
  resumes: Resume[];
  createResume: (
    name: string,
    optsOrWithSample?: boolean | { withSample?: boolean; initialData?: ResumeData }
  ) => string;
  createResumeWithData: (name: string, data: ResumeData) => string;
  deleteResume: (id: string) => void;
  duplicateResume: (id: string) => void;
  renameResume: (id: string, name: string) => void;
  getResume: (id: string) => Resume | undefined;
  updateData: (id: string, data: ResumeData) => void;
  hydrate: (resumes: Resume[]) => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      resumes: [],
      createResume: (name, optsOrWithSample) => {
        const id = crypto.randomUUID();
        let withSample = false;
        let initialData: ResumeData | undefined;

        if (typeof optsOrWithSample === "boolean") {
          withSample = optsOrWithSample;
        } else if (optsOrWithSample) {
          withSample = optsOrWithSample.withSample ?? false;
          initialData = optsOrWithSample.initialData;
        }

        const resume: Resume = {
          id,
          name: name || "Untitled resume",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          data: initialData ?? (withSample ? sampleResumeData() : emptyResumeData()),
        };
        set((s) => ({ resumes: [resume, ...s.resumes] }));
        return id;
      },
      createResumeWithData: (name, data) => {
        const id = crypto.randomUUID();
        const resume: Resume = {
          id,
          name: name || "Untitled resume",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          data,
        };
        set((s) => ({ resumes: [resume, ...s.resumes] }));
        return id;
      },
      deleteResume: (id) =>
        set((s) => ({ resumes: s.resumes.filter((r) => r.id !== id) })),
      duplicateResume: (id) =>
        set((s) => {
          const src = s.resumes.find((r) => r.id === id);
          if (!src) return s;
          const copy: Resume = {
            ...src,
            id: crypto.randomUUID(),
            name: `${src.name} (copy)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            data: JSON.parse(JSON.stringify(src.data)),
          };
          return { resumes: [copy, ...s.resumes] };
        }),
      renameResume: (id, name) =>
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === id ? { ...r, name, updatedAt: Date.now() } : r
          ),
        })),
      getResume: (id) => get().resumes.find((r) => r.id === id),
      updateData: (id, data) =>
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === id ? { ...r, data, updatedAt: Date.now() } : r
          ),
        })),
      // Replace local state with data loaded from Supabase.
      hydrate: (resumes) => set({ resumes }),
    }),
    { name: "inkwell-resumes" }
  )
);
