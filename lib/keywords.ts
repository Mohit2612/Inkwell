import { ResumeData } from "./types";

const STOP = new Set([
  "the", "and", "for", "with", "you", "your", "are", "our", "this", "that",
  "will", "have", "has", "from", "their", "they", "who", "all", "can", "able",
  "across", "into", "out", "per", "etc", "job", "role", "work", "team", "years",
  "experience", "strong", "ability", "including", "looking", "seeking", "must",
  "should", "preferred", "plus", "responsibilities", "requirements", "skills",
  "a", "an", "to", "of", "in", "on", "or", "as", "is", "it", "be", "we",
]);

export function resumeText(d: ResumeData): string {
  const parts: string[] = [
    d.contact.title,
    d.summary,
    ...d.experience.flatMap((e) => [e.role, e.company, ...e.bullets]),
    ...d.projects.flatMap((p) => [p.title, p.organization, ...p.bullets]),
    ...d.education.flatMap((e) => [e.degree, e.school, e.info]),
    ...d.certifications.flatMap((c) => [c.name, c.issuer]),
    ...d.skillGroups.flatMap((g) => [g.title, g.content]),
  ];
  return parts.join(" ").toLowerCase();
}

export interface KeywordResult {
  matched: string[];
  missing: string[];
  percent: number;
}

export function matchKeywords(jobText: string, d: ResumeData): KeywordResult {
  const resume = resumeText(d);
  const tokens = Array.from(
    new Set(
      jobText
        .toLowerCase()
        .replace(/[^a-z0-9+.# ]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !STOP.has(w))
    )
  );

  const matched: string[] = [];
  const missing: string[] = [];
  for (const t of tokens) {
    if (resume.includes(t)) matched.push(t);
    else missing.push(t);
  }
  const percent = tokens.length
    ? Math.round((matched.length / tokens.length) * 100)
    : 0;
  // keep lists readable
  return { matched: matched.slice(0, 30), missing: missing.slice(0, 30), percent };
}
