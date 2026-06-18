import { ResumeData } from "./types";

export interface ScoreBreakdown {
  total: number;
  checks: { label: string; passed: boolean; weight: number }[];
}

// Transparent completeness + best-practice heuristic (not a real ATS parser).
export function scoreResume(d: ResumeData): ScoreBreakdown {
  const c = d.contact;
  const hasContact = !!c.fullName && !!c.email && !!c.phone;
  const hasTitle = !!c.title;
  const hasSummary = d.summary.trim().length >= 40;
  const hasExperience = d.experience.length >= 1;
  const allRolesHaveBullets =
    d.experience.length > 0 &&
    d.experience.every((e) => e.bullets.filter((b) => b.trim()).length >= 1);
  const quantifiedBullets = d.experience
    .flatMap((e) => e.bullets)
    .some((b) => /\d/.test(b));
  const hasEducation = d.education.length >= 1;
  const skillCount = d.skillGroups.reduce(
    (n, g) => n + g.content.split(",").filter((s) => s.trim()).length,
    0
  );
  const enoughSkills = skillCount >= 5;
  const hasLinks = !!c.linkedin || !!c.website;

  const checks = [
    { label: "Name, email & phone present", passed: hasContact, weight: 14 },
    { label: "Professional title set", passed: hasTitle, weight: 8 },
    { label: "Summary is 40+ characters", passed: hasSummary, weight: 12 },
    { label: "At least one work experience", passed: hasExperience, weight: 16 },
    { label: "Every role has bullet points", passed: allRolesHaveBullets, weight: 12 },
    { label: "Bullets include numbers/metrics", passed: quantifiedBullets, weight: 14 },
    { label: "Education added", passed: hasEducation, weight: 8 },
    { label: "5+ skills listed", passed: enoughSkills, weight: 7 },
    { label: "Certifications added", passed: d.certifications.length >= 1, weight: 4 },
    { label: "LinkedIn or website added", passed: hasLinks, weight: 5 },
  ];

  const total = checks.reduce((s, c2) => s + (c2.passed ? c2.weight : 0), 0);
  return { total, checks };
}
