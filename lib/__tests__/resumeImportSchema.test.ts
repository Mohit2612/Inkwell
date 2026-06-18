import { describe, it, expect } from "vitest";
import { ResumeImportSchema } from "../resumeImportSchema";

const VALID_CONTACT = {
  fullName: "Jane Doe",
  title: "Software Engineer",
  email: "jane@example.com",
  phone: "+1 555 000 0000",
  linkedin: "linkedin.com/in/janedoe",
  website: "",
  country: "USA",
  state: "California",
  city: "San Francisco",
};

const VALID_PAYLOAD = {
  contact: VALID_CONTACT,
  summary: "Experienced engineer with 8 years building distributed systems.",
  experience: [
    {
      role: "Senior Engineer",
      company: "Acme Corp",
      start: "Jan 2020",
      end: "Present",
      location: "San Francisco, CA",
      bullets: ["Led migration of monolith to microservices, reducing latency by 40%."],
    },
  ],
  projects: [
    {
      title: "Open Source CLI",
      organization: "Personal",
      start: "2022",
      end: "2023",
      url: "github.com/janedoe/cli",
      bullets: ["Built a dev-productivity CLI used by 500+ engineers."],
    },
  ],
  education: [
    {
      degree: "B.S. Computer Science",
      school: "UC Berkeley",
      location: "Berkeley, CA",
      year: "2016",
      minor: "Mathematics",
      gpa: "3.9",
      info: "",
    },
  ],
  certifications: [
    { name: "AWS Certified Developer", issuer: "Amazon", date: "2022", relevance: "" },
  ],
  skillGroups: [
    { title: "Languages", content: "TypeScript, Python, Go, Rust" },
    { title: "Tools", content: "Docker, Kubernetes, Terraform" },
  ],
};

describe("ResumeImportSchema — valid inputs", () => {
  it("accepts a fully populated payload", () => {
    const result = ResumeImportSchema.safeParse(VALID_PAYLOAD);
    expect(result.success).toBe(true);
  });

  it("accepts empty arrays for all list sections", () => {
    const payload = {
      ...VALID_PAYLOAD,
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      skillGroups: [],
    };
    expect(ResumeImportSchema.safeParse(payload).success).toBe(true);
  });

  it("accepts empty strings for all string fields", () => {
    const payload = {
      contact: {
        fullName: "",
        title: "",
        email: "",
        phone: "",
        linkedin: "",
        website: "",
        country: "",
        state: "",
        city: "",
      },
      summary: "",
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      skillGroups: [],
    };
    expect(ResumeImportSchema.safeParse(payload).success).toBe(true);
  });

  it("accepts bullets as an empty array", () => {
    const payload = {
      ...VALID_PAYLOAD,
      experience: [
        { ...VALID_PAYLOAD.experience[0], bullets: [] },
      ],
    };
    expect(ResumeImportSchema.safeParse(payload).success).toBe(true);
  });
});

describe("ResumeImportSchema — extra keys rejected by .strict()", () => {
  it("rejects extra top-level key", () => {
    const payload = { ...VALID_PAYLOAD, extraField: "should not be here" };
    const result = ResumeImportSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects extra key inside contact", () => {
    const payload = {
      ...VALID_PAYLOAD,
      contact: { ...VALID_CONTACT, unknownKey: "oops" },
    };
    expect(ResumeImportSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects extra key inside an experience item", () => {
    const payload = {
      ...VALID_PAYLOAD,
      experience: [{ ...VALID_PAYLOAD.experience[0], id: "should-not-be-here" }],
    };
    expect(ResumeImportSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects id field on a project item", () => {
    const payload = {
      ...VALID_PAYLOAD,
      projects: [{ ...VALID_PAYLOAD.projects[0], id: "abc" }],
    };
    expect(ResumeImportSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects format field at top level", () => {
    const payload = { ...VALID_PAYLOAD, format: { fontFamily: "Arial" } };
    expect(ResumeImportSchema.safeParse(payload).success).toBe(false);
  });
});

describe("ResumeImportSchema — missing required keys", () => {
  it("rejects payload missing contact", () => {
    const { contact: _omit, ...rest } = VALID_PAYLOAD;
    const result = ResumeImportSchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toHaveProperty("contact");
    }
  });

  it("rejects contact missing fullName", () => {
    const { fullName: _omit, ...contactRest } = VALID_CONTACT;
    const result = ResumeImportSchema.safeParse({ ...VALID_PAYLOAD, contact: contactRest });
    expect(result.success).toBe(false);
  });

  it("rejects experience item missing bullets", () => {
    const { bullets: _omit, ...expRest } = VALID_PAYLOAD.experience[0];
    const result = ResumeImportSchema.safeParse({
      ...VALID_PAYLOAD,
      experience: [expRest],
    });
    expect(result.success).toBe(false);
  });

  it("rejects payload missing summary", () => {
    const { summary: _omit, ...rest } = VALID_PAYLOAD;
    expect(ResumeImportSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects null where string expected", () => {
    const result = ResumeImportSchema.safeParse({
      ...VALID_PAYLOAD,
      summary: null,
    });
    expect(result.success).toBe(false);
  });
});
