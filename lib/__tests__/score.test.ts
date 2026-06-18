import { describe, it, expect } from "vitest";
import { scoreResume } from "../score";
import { defaultFormat } from "../types";
import type { ResumeData } from "../types";

function makeData(overrides: Partial<ResumeData> = {}): ResumeData {
  const base: ResumeData = {
    contact: {
      fullName: "", email: "", phone: "", linkedin: "", website: "",
      country: "", state: "", city: "", title: "", showState: false,
    },
    summary: "",
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    skillGroups: [],
    format: defaultFormat(),
  };
  return { ...base, ...overrides };
}

describe("scoreResume", () => {
  it("returns 0 for a completely empty resume", () => {
    const { total } = scoreResume(makeData());
    expect(total).toBe(0);
  });

  it("awards contact points when name + email + phone are present", () => {
    const { checks } = scoreResume(
      makeData({
        contact: {
          fullName: "Alex Rivera",
          email: "alex@example.com",
          phone: "+1 555 000 0000",
          linkedin: "", website: "", country: "", state: "", city: "",
          title: "", showState: false,
        },
      })
    );
    const contactCheck = checks.find((c) => c.label.includes("email"));
    expect(contactCheck?.passed).toBe(true);
  });

  it("does NOT award contact points when phone is missing", () => {
    const { checks } = scoreResume(
      makeData({
        contact: {
          fullName: "Alex Rivera", email: "alex@example.com", phone: "",
          linkedin: "", website: "", country: "", state: "", city: "",
          title: "", showState: false,
        },
      })
    );
    const contactCheck = checks.find((c) => c.label.includes("email"));
    expect(contactCheck?.passed).toBe(false);
  });

  it("awards summary points only when summary is 40+ characters", () => {
    const short = scoreResume(makeData({ summary: "Too short." }));
    const long = scoreResume(makeData({ summary: "A".repeat(40) }));
    const shortCheck = short.checks.find((c) => c.label.includes("Summary"));
    const longCheck = long.checks.find((c) => c.label.includes("Summary"));
    expect(shortCheck?.passed).toBe(false);
    expect(longCheck?.passed).toBe(true);
  });

  it("awards quantified-bullets points when a bullet contains a number", () => {
    const { checks } = scoreResume(
      makeData({
        experience: [
          {
            id: "1", role: "Engineer", company: "Acme", location: "",
            start: "2022", end: "2024",
            bullets: ["Improved performance by 40%"],
          },
        ],
      })
    );
    const qCheck = checks.find((c) => c.label.includes("numbers"));
    expect(qCheck?.passed).toBe(true);
  });

  it("does NOT award quantified-bullets points when bullets have no numbers", () => {
    const { checks } = scoreResume(
      makeData({
        experience: [
          {
            id: "1", role: "Engineer", company: "Acme", location: "",
            start: "2022", end: "2024",
            bullets: ["Worked on the backend"],
          },
        ],
      })
    );
    const qCheck = checks.find((c) => c.label.includes("numbers"));
    expect(qCheck?.passed).toBe(false);
  });

  it("total equals sum of passed check weights", () => {
    const { total, checks } = scoreResume(
      makeData({
        contact: {
          fullName: "Alex", email: "a@b.com", phone: "123",
          title: "Engineer", linkedin: "li.com/alex", website: "",
          country: "USA", state: "CA", city: "SF", showState: true,
        },
        summary: "Senior engineer with 8 years building scalable distributed systems.",
        experience: [
          {
            id: "e1", role: "SWE", company: "Corp", location: "SF",
            start: "2020", end: "2024",
            bullets: ["Shipped feature used by 5000 daily active users"],
          },
        ],
        education: [
          { id: "ed1", degree: "BS CS", school: "MIT", location: "MA", year: "2019", gpa: "3.9", minor: "", info: "" },
        ],
        skillGroups: [
          { id: "s1", title: "Languages", content: "TypeScript, Python, Go, Rust, SQL, Java, C++" },
        ],
        certifications: [
          { id: "c1", name: "AWS SAA", issuer: "Amazon", date: "2023", relevance: "" },
        ],
      })
    );
    const expected = checks.reduce((s, c) => s + (c.passed ? c.weight : 0), 0);
    expect(total).toBe(expected);
  });

  it("total never exceeds 100", () => {
    const allPassed = makeData({
      contact: {
        fullName: "A", email: "a@b.com", phone: "1", title: "Dev",
        linkedin: "li", website: "", country: "", state: "", city: "",
        showState: false,
      },
      summary: "X".repeat(60),
      experience: [{ id: "1", role: "SWE", company: "Co", location: "", start: "2020", end: "2024", bullets: ["Saved 30%"] }],
      education: [{ id: "1", degree: "BS", school: "MIT", location: "", year: "2020", gpa: "", minor: "", info: "" }],
      skillGroups: [{ id: "1", title: "Skills", content: "a, b, c, d, e, f" }],
      certifications: [{ id: "1", name: "CKA", issuer: "CNCF", date: "2023", relevance: "" }],
    });
    const { total } = scoreResume(allPassed);
    expect(total).toBeLessThanOrEqual(100);
  });
});
