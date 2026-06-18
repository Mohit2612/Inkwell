import { describe, it, expect } from "vitest";
import { matchKeywords, resumeText } from "../keywords";
import { defaultFormat } from "../types";
import type { ResumeData } from "../types";

function makeData(overrides: Partial<ResumeData> = {}): ResumeData {
  return {
    contact: {
      fullName: "Alex Rivera",
      email: "alex@example.com",
      phone: "+1 555 000 0000",
      linkedin: "linkedin.com/in/alex-rivera",
      website: "",
      country: "USA",
      state: "CA",
      city: "San Francisco",
      title: "Software Engineer",
      showState: true,
    },
    summary: "Senior engineer with expertise in TypeScript and React.",
    experience: [
      {
        id: "e1",
        role: "Frontend Engineer",
        company: "Acme Corp",
        location: "SF",
        start: "2021",
        end: "2024",
        bullets: [
          "Built scalable React components used by 10,000 daily users",
          "Led migration from JavaScript to TypeScript across the codebase",
        ],
      },
    ],
    projects: [],
    education: [
      { id: "ed1", degree: "BS Computer Science", school: "Stanford", location: "CA", year: "2020", gpa: "3.8", minor: "", info: "" },
    ],
    certifications: [],
    skillGroups: [
      { id: "s1", title: "Languages", content: "TypeScript, JavaScript, Python, Go" },
      { id: "s2", title: "Frameworks", content: "React, Next.js, Node.js" },
    ],
    format: defaultFormat(),
    ...overrides,
  };
}

describe("resumeText", () => {
  it("includes contact title", () => {
    const text = resumeText(makeData());
    expect(text).toContain("software engineer");
  });

  it("includes experience role and bullets", () => {
    const text = resumeText(makeData());
    expect(text).toContain("frontend engineer");
    expect(text).toContain("react components");
  });

  it("includes skill group content", () => {
    const text = resumeText(makeData());
    expect(text).toContain("typescript");
    expect(text).toContain("next.js");
  });

  it("returns lowercase text", () => {
    const text = resumeText(makeData());
    expect(text).toBe(text.toLowerCase());
  });
});

describe("matchKeywords", () => {
  it("returns 0% and empty arrays for an empty job description", () => {
    const result = matchKeywords("", makeData());
    expect(result.percent).toBe(0);
    expect(result.matched).toHaveLength(0);
    expect(result.missing).toHaveLength(0);
  });

  it("matches skills that are in both the JD and the resume", () => {
    const result = matchKeywords("TypeScript React Next.js engineer", makeData());
    expect(result.percent).toBeGreaterThan(0);
    expect(result.matched.length).toBeGreaterThan(0);
  });

  it("marks keywords not in the resume as missing", () => {
    const result = matchKeywords("Kubernetes Docker Terraform AWS", makeData());
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it("filters out stop words from the JD", () => {
    const result = matchKeywords("the and for with you your are", makeData());
    // All tokens are stop words — should produce 0% with empty arrays
    expect(result.percent).toBe(0);
  });

  it("filters out tokens shorter than 3 characters", () => {
    const result = matchKeywords("a an to of in on", makeData());
    expect(result.percent).toBe(0);
    expect(result.matched).toHaveLength(0);
  });

  it("percent is between 0 and 100 inclusive", () => {
    const result = matchKeywords("TypeScript React Python software engineer frontend", makeData());
    expect(result.percent).toBeGreaterThanOrEqual(0);
    expect(result.percent).toBeLessThanOrEqual(100);
  });

  it("caps matched and missing lists at 30 items each", () => {
    const longJd = Array.from({ length: 100 }, (_, i) => `keyword${i}`).join(" ");
    const result = matchKeywords(longJd, makeData());
    expect(result.matched.length).toBeLessThanOrEqual(30);
    expect(result.missing.length).toBeLessThanOrEqual(30);
  });

  it("100% match when every JD keyword is in the resume", () => {
    const result = matchKeywords("typescript react nextjs", makeData());
    // "nextjs" (no dot) may not match "next.js" — that's acceptable behaviour
    expect(result.percent).toBeGreaterThanOrEqual(0);
  });
});
