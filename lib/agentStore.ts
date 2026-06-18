"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** When set, the assistant message offers to write `content` into this section. */
  applyTo?: "summary" | "skills" | null;
  createdAt: number;
}

interface AgentStore {
  /** messages keyed by resumeId ("none" for no-resume chats) */
  byResume: Record<string, AgentMessage[]>;
  add: (resumeId: string, msg: Omit<AgentMessage, "id" | "createdAt">) => void;
  clear: (resumeId: string) => void;
  get: (resumeId: string) => AgentMessage[];
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      byResume: {},
      add: (resumeId, msg) =>
        set((s) => {
          const list = s.byResume[resumeId] ?? [];
          const entry: AgentMessage = {
            ...msg,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
          };
          return { byResume: { ...s.byResume, [resumeId]: [...list, entry] } };
        }),
      clear: (resumeId) =>
        set((s) => ({ byResume: { ...s.byResume, [resumeId]: [] } })),
      get: (resumeId) => get().byResume[resumeId] ?? [],
    }),
    { name: "inkwell-agent" }
  )
);
