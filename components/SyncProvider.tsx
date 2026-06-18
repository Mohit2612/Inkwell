"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider";
import { useResumeStore } from "@/lib/store";
import { useCoverStore } from "@/lib/coverStore";
import { fetchResumes, syncResumes, fetchCovers, syncCovers } from "@/lib/supabase/db";

const DEBOUNCE_MS = 3000;

export function SyncProvider() {
  const { user } = useAuth();
  const resumeStore = useResumeStore();
  const coverStore = useCoverStore();

  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHydrate = useRef(false);

  // On sign-in: fetch from Supabase and hydrate the local stores.
  useEffect(() => {
    if (!user) {
      didHydrate.current = false;
      return;
    }
    if (didHydrate.current) return;
    didHydrate.current = true;

    fetchResumes(user.id).then((resumes) => {
      if (resumes.length > 0) {
        resumeStore.hydrate(resumes);
      }
    });

    fetchCovers(user.id).then((covers) => {
      if (covers.length > 0) {
        coverStore.hydrate(covers);
      }
    });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce-sync resumes on any store change.
  const resumes = useResumeStore((s) => s.resumes);
  useEffect(() => {
    if (!user || !didHydrate.current) return;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      syncResumes(user.id, resumes).catch(console.error);
    }, DEBOUNCE_MS);
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [resumes, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce-sync covers on any store change.
  const covers = useCoverStore((s) => s.letters);
  useEffect(() => {
    if (!user || !didHydrate.current) return;
    if (coverTimer.current) clearTimeout(coverTimer.current);
    coverTimer.current = setTimeout(() => {
      syncCovers(user.id, covers).catch(console.error);
    }, DEBOUNCE_MS);
    return () => {
      if (coverTimer.current) clearTimeout(coverTimer.current);
    };
  }, [covers, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
