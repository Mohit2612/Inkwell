import { createClient } from "./client";
import type { Resume, CoverLetter } from "@/lib/types";

// ── Resumes ──────────────────────────────────────────────

export async function fetchResumes(userId: string): Promise<Resume[]> {
  const db = createClient();
  const { data, error } = await db
    .from("resumes")
    .select("id, name, data, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    createdAt: new Date(r.created_at as string).getTime(),
    updatedAt: new Date(r.updated_at as string).getTime(),
    data: r.data as Resume["data"],
  }));
}

export async function syncResumes(userId: string, resumes: Resume[]): Promise<void> {
  const db = createClient();

  if (resumes.length === 0) {
    await db.from("resumes").delete().eq("user_id", userId);
    return;
  }

  await db.from("resumes").upsert(
    resumes.map((r) => ({
      id: r.id,
      user_id: userId,
      name: r.name,
      data: r.data,
      updated_at: new Date(r.updatedAt).toISOString(),
      created_at: new Date(r.createdAt).toISOString(),
    })),
    { onConflict: "id" }
  );

  // Remove any DB rows that no longer exist locally.
  const localIds = resumes.map((r) => r.id);
  await db
    .from("resumes")
    .delete()
    .eq("user_id", userId)
    .not("id", "in", `(${localIds.map((id) => `"${id}"`).join(",")})`);
}

// ── Cover letters ─────────────────────────────────────────

export async function fetchCovers(userId: string): Promise<CoverLetter[]> {
  const db = createClient();
  const { data, error } = await db
    .from("cover_letters")
    .select("id, name, data, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    createdAt: new Date(r.created_at as string).getTime(),
    updatedAt: new Date(r.updated_at as string).getTime(),
    data: r.data as CoverLetter["data"],
  }));
}

export async function syncCovers(userId: string, covers: CoverLetter[]): Promise<void> {
  const db = createClient();

  if (covers.length === 0) {
    await db.from("cover_letters").delete().eq("user_id", userId);
    return;
  }

  await db.from("cover_letters").upsert(
    covers.map((l) => ({
      id: l.id,
      user_id: userId,
      name: l.name,
      data: l.data,
      updated_at: new Date(l.updatedAt).toISOString(),
      created_at: new Date(l.createdAt).toISOString(),
    })),
    { onConflict: "id" }
  );

  const localIds = covers.map((l) => l.id);
  await db
    .from("cover_letters")
    .delete()
    .eq("user_id", userId)
    .not("id", "in", `(${localIds.map((id) => `"${id}"`).join(",")})`);
}
