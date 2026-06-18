import { ResumeImportSchema } from "./resumeImportSchema";
import { defaultFormat } from "./types";
import type { ResumeData } from "./types";

function tc(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

export function sanitizeResumeImport(raw: unknown): ResumeData {
  const parsed = ResumeImportSchema.parse(raw);

  const state = tc(parsed.contact.state);

  return {
    contact: {
      fullName: tc(parsed.contact.fullName),
      title: tc(parsed.contact.title),
      email: tc(parsed.contact.email),
      phone: tc(parsed.contact.phone),
      linkedin: tc(parsed.contact.linkedin),
      website: tc(parsed.contact.website),
      country: tc(parsed.contact.country),
      state,
      city: tc(parsed.contact.city),
      showState: state.length > 0,
    },
    summary: tc(parsed.summary),
    experience: parsed.experience.slice(0, 15).map((e) => ({
      id: crypto.randomUUID(),
      role: tc(e.role),
      company: tc(e.company),
      start: tc(e.start),
      end: tc(e.end),
      location: tc(e.location),
      bullets: e.bullets.map(tc).filter(Boolean).slice(0, 8),
    })),
    projects: parsed.projects.slice(0, 15).map((p) => ({
      id: crypto.randomUUID(),
      title: tc(p.title),
      organization: tc(p.organization),
      start: tc(p.start),
      end: tc(p.end),
      url: tc(p.url),
      bullets: p.bullets.map(tc).filter(Boolean).slice(0, 8),
    })),
    education: parsed.education.slice(0, 10).map((e) => ({
      id: crypto.randomUUID(),
      degree: tc(e.degree),
      school: tc(e.school),
      location: tc(e.location),
      year: tc(e.year),
      minor: tc(e.minor),
      gpa: tc(e.gpa),
      info: tc(e.info),
    })),
    certifications: parsed.certifications.slice(0, 20).map((c) => ({
      id: crypto.randomUUID(),
      name: tc(c.name),
      issuer: tc(c.issuer),
      date: tc(c.date),
      relevance: tc(c.relevance),
    })),
    skillGroups: parsed.skillGroups.slice(0, 12).map((sg) => ({
      id: crypto.randomUUID(),
      title: tc(sg.title),
      content: tc(sg.content),
    })),
    format: defaultFormat(),
  };
}
