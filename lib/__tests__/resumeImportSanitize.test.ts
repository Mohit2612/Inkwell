import { describe, it, expect } from "vitest";
import { sanitizeResumeImport } from "../resumeImportSanitize";
import { defaultFormat } from "../types";
import { scoreResume } from "../score";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const REALISTIC_INPUT = {
  contact: {
    fullName: "  Jane   Doe  ",
    title: "  Senior Software Engineer  ",
    email: "  jane@example.com  ",
    phone: "+1 555 000 0000",
    linkedin: "linkedin.com/in/janedoe",
    website: "",
    country: "USA",
    state: "California",
    city: "San Francisco",
  },
  summary:
    "  Experienced engineer with 8+ years   building distributed systems   at scale.  ",
  experience: [
    {
      role: "  Senior Engineer  ",
      company: "  Acme Corp  ",
      start: "Jan 2020",
      end: "Present",
      location: "San Francisco, CA",
      bullets: [
        "  Led migration of monolith to microservices, reducing latency by 40%.  ",
        "  ",          // empty — should be dropped
        "Built CI/CD pipelines using GitHub Actions, cutting deploy time by 60%.",
      ],
    },
    {
      role: "Engineer",
      company: "Beta Inc",
      start: "Jun 2018",
      end: "Dec 2019",
      location: "New York, NY",
      bullets: ["Owned the payments integration, processing $5M/month in transactions."],
    },
  ],
  projects: [
    {
      title: "Open Source CLI",
      organization: "Personal",
      start: "2022",
      end: "2023",
      url: "github.com/janedoe/cli",
      bullets: ["Built a dev-productivity CLI tool used by 500+ engineers."],
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
    { name: "GCP Professional Cloud Architect", issuer: "Google", date: "2023", relevance: "" },
  ],
  skillGroups: [
    { title: "Languages", content: "TypeScript, Python, Go, Rust, Java" },
    { title: "Cloud & DevOps", content: "AWS, GCP, Docker, Kubernetes, Terraform" },
    { title: "Databases", content: "PostgreSQL, Redis, DynamoDB" },
  ],
};

describe("sanitizeResumeImport — clean output", () => {
  it("trims and collapses whitespace in strings", () => {
    const result = sanitizeResumeImport(REALISTIC_INPUT);
    expect(result.contact.fullName).toBe("Jane Doe");
    expect(result.contact.title).toBe("Senior Software Engineer");
    expect(result.summary).toBe(
      "Experienced engineer with 8+ years building distributed systems at scale."
    );
  });

  it("drops empty bullets", () => {
    const result = sanitizeResumeImport(REALISTIC_INPUT);
    const firstRole = result.experience[0];
    expect(firstRole.bullets).not.toContain("  ");
    expect(firstRole.bullets).not.toContain("");
    expect(firstRole.bullets.length).toBe(2); // empty one was dropped
  });

  it("assigns fresh UUIDs to every array item", () => {
    const result = sanitizeResumeImport(REALISTIC_INPUT);
    const ids = [
      ...result.experience.map((e) => e.id),
      ...result.projects.map((p) => p.id),
      ...result.education.map((e) => e.id),
      ...result.certifications.map((c) => c.id),
      ...result.skillGroups.map((s) => s.id),
    ];
    for (const id of ids) {
      expect(id).toMatch(UUID_RE);
    }
    // All IDs are unique
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("merges format with defaultFormat()", () => {
    const result = sanitizeResumeImport(REALISTIC_INPUT);
    expect(result.format).toEqual(defaultFormat());
  });

  it("sets showState = true when state is non-empty", () => {
    const result = sanitizeResumeImport(REALISTIC_INPUT);
    expect(result.contact.state).toBe("California");
    expect(result.contact.showState).toBe(true);
  });

  it("sets showState = false when state is empty", () => {
    const input = {
      ...REALISTIC_INPUT,
      contact: { ...REALISTIC_INPUT.contact, state: "" },
    };
    const result = sanitizeResumeImport(input);
    expect(result.contact.showState).toBe(false);
  });
});

describe("sanitizeResumeImport — array caps", () => {
  it("caps experience at 15", () => {
    const input = {
      ...REALISTIC_INPUT,
      experience: Array.from({ length: 20 }, (_, i) => ({
        role: `Role ${i}`,
        company: `Company ${i}`,
        start: "2020",
        end: "Present",
        location: "",
        bullets: ["Did something impactful."],
      })),
    };
    expect(sanitizeResumeImport(input).experience.length).toBe(15);
  });

  it("caps projects at 15", () => {
    const input = {
      ...REALISTIC_INPUT,
      projects: Array.from({ length: 18 }, (_, i) => ({
        title: `Project ${i}`,
        organization: "Org",
        start: "2022",
        end: "2023",
        url: "",
        bullets: [],
      })),
    };
    expect(sanitizeResumeImport(input).projects.length).toBe(15);
  });

  it("caps education at 10", () => {
    const input = {
      ...REALISTIC_INPUT,
      education: Array.from({ length: 12 }, (_, i) => ({
        degree: `Degree ${i}`,
        school: `School ${i}`,
        location: "",
        year: "2020",
        minor: "",
        gpa: "",
        info: "",
      })),
    };
    expect(sanitizeResumeImport(input).education.length).toBe(10);
  });

  it("caps certifications at 20", () => {
    const input = {
      ...REALISTIC_INPUT,
      certifications: Array.from({ length: 25 }, (_, i) => ({
        name: `Cert ${i}`,
        issuer: "Issuer",
        date: "2023",
        relevance: "",
      })),
    };
    expect(sanitizeResumeImport(input).certifications.length).toBe(20);
  });

  it("caps skill groups at 12", () => {
    const input = {
      ...REALISTIC_INPUT,
      skillGroups: Array.from({ length: 15 }, (_, i) => ({
        title: `Group ${i}`,
        content: "skill1, skill2",
      })),
    };
    expect(sanitizeResumeImport(input).skillGroups.length).toBe(12);
  });

  it("caps bullets per role at 8", () => {
    const input = {
      ...REALISTIC_INPUT,
      experience: [
        {
          role: "Engineer",
          company: "Corp",
          start: "2020",
          end: "Present",
          location: "",
          bullets: Array.from({ length: 12 }, (_, i) => `Bullet ${i + 1} with some content.`),
        },
      ],
    };
    expect(sanitizeResumeImport(input).experience[0].bullets.length).toBe(8);
  });
});

describe("sanitizeResumeImport — messy inputs", () => {
  it("handles completely empty arrays gracefully", () => {
    const input = {
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
    const result = sanitizeResumeImport(input);
    expect(result.format).toEqual(defaultFormat());
    expect(result.experience).toEqual([]);
  });

  it("throws a ZodError for invalid input (not ResumeImport shape)", () => {
    expect(() => sanitizeResumeImport({ garbage: true })).toThrow();
  });

  it("produces scoreResume() ≥ 70 for a realistic well-formed resume", () => {
    const result = sanitizeResumeImport(REALISTIC_INPUT);
    const { total } = scoreResume(result);
    expect(total).toBeGreaterThanOrEqual(70);
  });
});

describe("sanitizeResumeImport — integration with fixture data", () => {
  const MOCK_OPENAI_RESPONSE = {
    contact: {
      fullName: "Alex Rivera",
      title: "Quality Assurance Engineer / SDET",
      email: "alex.rivera@example.com",
      phone: "+1 (555) 234-5678",
      linkedin: "linkedin.com/in/alex-rivera",
      website: "",
      country: "USA",
      state: "Massachusetts",
      city: "Boston",
    },
    summary:
      "Senior QA Automation Engineer with 5+ years delivering enterprise-scale quality engineering across Banking, Healthcare, and Telecom.",
    experience: [
      {
        role: "Quality Assurance Engineer / SDET",
        company: "Elevance Health",
        start: "Jan 2024",
        end: "Present",
        location: "USA",
        bullets: [
          "Architected a Java-based Selenium WebDriver + Cucumber BDD regression framework covering 600+ automated test cases, reducing manual regression effort by 65%.",
          "Built RESTAssured API automation suites identifying 30+ pre-production defects per quarter.",
          "Integrated smoke and regression suites into Jenkins/GitHub Actions CI/CD pipelines.",
        ],
      },
      {
        role: "Quality Engineering Analyst",
        company: "Accenture",
        start: "Jun 2021",
        end: "Dec 2022",
        location: "India",
        bullets: ["Led functional and regression testing, achieving 98% sprint coverage."],
      },
    ],
    projects: [
      {
        title: "LCA Visual Studios",
        organization: "Clark University",
        start: "Jan 2024",
        end: "Jun 2024",
        url: "github.com/aswini/lca",
        bullets: [
          "Built a multi-portal web app using Next.js/TypeScript, MongoDB, and role-based auth.",
        ],
      },
    ],
    education: [
      {
        degree: "Master of Science in Computer Science",
        school: "Clark University",
        location: "USA",
        year: "2024",
        minor: "",
        gpa: "3.82",
        info: "",
      },
      {
        degree: "Bachelor of Engineering in Computer Science",
        school: "Vel Tech University",
        location: "India",
        year: "2020",
        minor: "Mathematics",
        gpa: "",
        info: "",
      },
    ],
    certifications: [
      { name: "Microsoft Azure Fundamentals", issuer: "Microsoft", date: "2023", relevance: "" },
      {
        name: "AWS Certified Solutions Architect - Associate",
        issuer: "Amazon Web Services",
        date: "2022",
        relevance: "",
      },
    ],
    skillGroups: [
      {
        title: "Test Automation",
        content: "Selenium WebDriver, RESTAssured, JUnit, TestNG, Cucumber/Gherkin, Playwright, Cypress",
      },
      { title: "Programming", content: "Java, Python, SQL, JavaScript, TypeScript" },
      { title: "API / Integration", content: "REST, SOAP, gRPC, GraphQL, JSON, XML" },
    ],
  };

  it("clean single-column resume: all 7 sections populated, scoreResume ≥ 70", () => {
    const result = sanitizeResumeImport(MOCK_OPENAI_RESPONSE);

    expect(result.contact.fullName).toBe("Alex Rivera");
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.experience.length).toBeGreaterThan(0);
    expect(result.projects.length).toBeGreaterThan(0);
    expect(result.education.length).toBeGreaterThan(0);
    expect(result.certifications.length).toBeGreaterThan(0);
    expect(result.skillGroups.length).toBeGreaterThan(0);

    // All items have fresh UUIDs
    for (const exp of result.experience) expect(exp.id).toMatch(UUID_RE);
    for (const edu of result.education) expect(edu.id).toMatch(UUID_RE);

    const { total } = scoreResume(result);
    expect(total).toBeGreaterThanOrEqual(70);
  });

  it("multi-column / list-heavy variant: sanitized correctly and scores ≥ 70", () => {
    const listHeavy = {
      ...MOCK_OPENAI_RESPONSE,
      experience: [
        ...MOCK_OPENAI_RESPONSE.experience,
        {
          role: "QA Engineer",
          company: "TechCorp",
          start: "Mar 2019",
          end: "May 2021",
          location: "Remote",
          bullets: [
            "Delivered 200+ test cases for an e-commerce platform handling 1M+ monthly users.",
            "Automated smoke suite in Cypress, reducing QA cycle by 3 days per sprint.",
            "Mentored 2 junior QA engineers in Selenium best practices.",
            "",  // empty bullet — should be dropped
            "   ",  // whitespace-only — should be dropped
          ],
        },
      ],
    };

    const result = sanitizeResumeImport(listHeavy);
    const lastExp = result.experience[result.experience.length - 1];

    // Empty bullets dropped
    expect(lastExp.bullets.every((b) => b.trim().length > 0)).toBe(true);
    expect(lastExp.bullets.length).toBe(3);

    const { total } = scoreResume(result);
    expect(total).toBeGreaterThanOrEqual(70);
  });
});
