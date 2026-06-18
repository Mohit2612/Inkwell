import type { ResumeData } from "./types";

/**
 * POST to /api/ai with a 30s timeout. Mirrors the inline helper in
 * components/builder/fields.tsx so every surface calls the AI the same way.
 * Returns the `result` string, or an empty string on failure.
 */
export async function callAI(body: object): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return "";
    const json = (await res.json()) as { result?: string };
    return json.result ?? "";
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

/** Compact, token-efficient text snapshot of a resume for AI context. */
export function resumeToContext(d: ResumeData): string {
  const lines: string[] = [];
  const c = d.contact;
  if (c.fullName || c.title) lines.push(`${c.fullName} — ${c.title}`.trim());
  if (d.summary) lines.push(`Summary: ${d.summary}`);

  if (d.experience.length) {
    lines.push("Experience:");
    for (const e of d.experience) {
      lines.push(`- ${e.role} @ ${e.company} (${e.start}–${e.end})`);
      for (const b of e.bullets.filter((x) => x.trim())) lines.push(`  • ${b}`);
    }
  }
  if (d.projects.length) {
    lines.push("Projects:");
    for (const p of d.projects) lines.push(`- ${p.title} (${p.organization})`);
  }
  if (d.education.length) {
    lines.push("Education:");
    for (const ed of d.education) lines.push(`- ${ed.degree}, ${ed.school} (${ed.year})`);
  }
  const skills = d.skillGroups
    .map((g) => `${g.title}: ${g.content}`)
    .filter(Boolean);
  if (skills.length) lines.push(`Skills: ${skills.join(" | ")}`);

  return lines.join("\n").slice(0, 5800);
}
