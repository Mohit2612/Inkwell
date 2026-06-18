import { ResumeData, defaultFormat, Experience, Education, SkillGroup, Certification } from "./types";

export type SampleLevel = "student" | "entry" | "mid" | "senior" | "executive";

export interface ResumeSample {
  slug: string;
  title: string;
  category: string;
  industry: string;
  level: SampleLevel;
  style: string;
  data: ResumeData;
}

/* ---- tiny builders (stable ids so SSR + client render identically) ---- */

let seq = 0;
const sid = (slug: string) => `${slug}-${seq++}`;

const exp = (slug: string, e: Omit<Experience, "id">): Experience => ({ id: sid(slug), ...e });
const edu = (slug: string, e: Omit<Education, "id">): Education => ({ id: sid(slug), ...e });
const skill = (slug: string, title: string, content: string): SkillGroup => ({ id: sid(slug), title, content });
const cert = (slug: string, c: Omit<Certification, "id">): Certification => ({ id: sid(slug), ...c });

interface Seed {
  slug: string;
  title: string;
  category: string;
  industry: string;
  level: SampleLevel;
  style?: string;
  fullName: string;
  jobTitle: string;
  city: string;
  state: string;
  country: string;
  summary: string;
  experience: Omit<Experience, "id">[];
  education: Omit<Education, "id">[];
  skills: [string, string][];
  certifications?: Omit<Certification, "id">[];
}

function build(s: Seed): ResumeSample {
  return {
    slug: s.slug,
    title: s.title,
    category: s.category,
    industry: s.industry,
    level: s.level,
    style: s.style ?? "modern",
    data: {
      contact: {
        fullName: s.fullName,
        title: s.jobTitle,
        email: `${s.fullName.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
        phone: "+1 (555) 010-2030",
        linkedin: `linkedin.com/in/${s.fullName.toLowerCase().replace(/[^a-z]+/g, "-")}`,
        website: "",
        country: s.country,
        state: s.state,
        city: s.city,
        showState: true,
      },
      summary: s.summary,
      experience: s.experience.map((e) => exp(s.slug, e)),
      projects: [],
      education: s.education.map((e) => edu(s.slug, e)),
      certifications: (s.certifications ?? []).map((c) => cert(s.slug, c)),
      skillGroups: s.skills.map(([t, c]) => skill(s.slug, t, c)),
      format: defaultFormat(),
    },
  };
}

export const SAMPLES: ResumeSample[] = [
  build({
    slug: "software-engineer", title: "Software Engineer", category: "Software Engineer",
    industry: "Technology", level: "mid",
    fullName: "Jordan Patel", jobTitle: "Software Engineer", city: "Austin", state: "Texas", country: "USA",
    summary: "Software Engineer with 4+ years building scalable backend services and customer-facing features. Strong in distributed systems, testing, and shipping reliable code in fast-moving teams.",
    experience: [
      { role: "Software Engineer", company: "Brightline", start: "2022", end: "Present", location: "Austin, TX",
        bullets: [
          "Designed and shipped a microservice handling 12M daily requests, cutting p95 latency by 38%.",
          "Led migration of a monolith module to event-driven architecture, reducing deploy risk and enabling independent releases.",
          "Added contract and integration tests that raised coverage from 54% to 88%, halving production incidents.",
        ] },
      { role: "Junior Developer", company: "Nimbus Labs", start: "2020", end: "2022", location: "Remote",
        bullets: ["Built REST APIs in Node.js and Postgres for a B2B analytics product used by 200+ companies."] },
    ],
    education: [{ degree: "B.S. Computer Science", school: "University of Texas", location: "Austin, TX", year: "2020", minor: "", gpa: "3.7", info: "" }],
    skills: [["Languages", "TypeScript, Go, Python, SQL"], ["Backend", "Node.js, PostgreSQL, Redis, gRPC, REST"], ["Cloud / DevOps", "AWS, Docker, Kubernetes, GitHub Actions"]],
    certifications: [{ name: "AWS Certified Developer – Associate", issuer: "Amazon Web Services", date: "2023", relevance: "" }],
  }),
  build({
    slug: "frontend-developer", title: "Frontend Developer", category: "Frontend Developer",
    industry: "Technology", level: "mid",
    fullName: "Maya Chen", jobTitle: "Frontend Developer", city: "Seattle", state: "Washington", country: "USA",
    summary: "Frontend Developer focused on accessible, performant React interfaces. Turns design systems into reusable component libraries and ships polished UX with measurable engagement lift.",
    experience: [
      { role: "Frontend Developer", company: "Loop Commerce", start: "2021", end: "Present", location: "Seattle, WA",
        bullets: [
          "Rebuilt the checkout flow in React + TypeScript, lifting conversion by 14% and cutting bundle size 31%.",
          "Created a 40-component design system in Storybook adopted by 3 product teams.",
          "Raised Lighthouse accessibility score from 71 to 98 across core pages.",
        ] },
    ],
    education: [{ degree: "B.A. Interaction Design", school: "University of Washington", location: "Seattle, WA", year: "2019", minor: "", gpa: "", info: "" }],
    skills: [["Core", "React, TypeScript, Next.js, JavaScript (ES2023)"], ["Styling", "Tailwind CSS, CSS Modules, Framer Motion"], ["Tooling", "Vite, Jest, Playwright, Figma"]],
  }),
  build({
    slug: "backend-developer", title: "Backend Developer", category: "Backend Developer",
    industry: "Technology", level: "senior",
    fullName: "Diego Ramos", jobTitle: "Senior Backend Developer", city: "Denver", state: "Colorado", country: "USA",
    summary: "Senior Backend Developer specializing in high-throughput APIs and data pipelines. Owns services end to end from schema design to on-call reliability.",
    experience: [
      { role: "Senior Backend Developer", company: "Cargoflow", start: "2019", end: "Present", location: "Denver, CO",
        bullets: [
          "Architected a Kafka-based ingestion pipeline processing 2B events/month with 99.98% uptime.",
          "Reduced database costs 42% by introducing read replicas and query caching.",
          "Mentored 4 engineers and established the team's API design and code-review standards.",
        ] },
    ],
    education: [{ degree: "B.S. Software Engineering", school: "Colorado State University", location: "Fort Collins, CO", year: "2016", minor: "", gpa: "", info: "" }],
    skills: [["Languages", "Java, Go, Python"], ["Data", "PostgreSQL, Kafka, ElasticSearch, Redis"], ["Infra", "Kubernetes, Terraform, AWS, Datadog"]],
  }),
  build({
    slug: "full-stack-developer", title: "Full Stack Developer", category: "Full Stack Developer",
    industry: "Technology", level: "mid",
    fullName: "Sara Khan", jobTitle: "Full Stack Developer", city: "Toronto", state: "Ontario", country: "Canada",
    summary: "Full Stack Developer comfortable across the stack — from React frontends to Node services and cloud infra. Ships features fast without sacrificing test coverage or reliability.",
    experience: [
      { role: "Full Stack Developer", company: "Mapleworks", start: "2021", end: "Present", location: "Toronto, ON",
        bullets: [
          "Delivered a multi-tenant SaaS dashboard (Next.js + Node + Postgres) now used by 5K monthly active users.",
          "Cut onboarding time 50% by building a self-serve setup wizard with Stripe billing.",
          "Set up CI/CD on GitHub Actions, dropping average deploy time from 25 to 6 minutes.",
        ] },
    ],
    education: [{ degree: "B.Eng. Computer Engineering", school: "University of Toronto", location: "Toronto, ON", year: "2020", minor: "", gpa: "", info: "" }],
    skills: [["Frontend", "React, Next.js, TypeScript, Tailwind"], ["Backend", "Node.js, Express, PostgreSQL, Prisma"], ["Cloud", "Vercel, AWS, Docker"]],
  }),
  build({
    slug: "data-analyst", title: "Data Analyst", category: "Data Analyst",
    industry: "Analytics", level: "entry",
    fullName: "Liam O'Brien", jobTitle: "Data Analyst", city: "Chicago", state: "Illinois", country: "USA",
    summary: "Data Analyst translating messy data into decisions. Builds dashboards and models that leadership actually uses, with a focus on clarity and statistical rigor.",
    experience: [
      { role: "Data Analyst", company: "Retail Signal", start: "2022", end: "Present", location: "Chicago, IL",
        bullets: [
          "Built a churn model in Python that flagged at-risk accounts, informing retention plays worth $1.1M ARR.",
          "Automated weekly KPI reporting in SQL + Looker, saving the team 8 hours/week.",
          "Ran A/B tests on pricing pages, identifying a variant that lifted signups 9%.",
        ] },
    ],
    education: [{ degree: "B.S. Statistics", school: "University of Illinois", location: "Urbana, IL", year: "2022", minor: "Economics", gpa: "3.8", info: "" }],
    skills: [["Analysis", "SQL, Python (pandas), Excel, A/B Testing"], ["Visualization", "Looker, Tableau, Power BI"], ["Stats", "Regression, Hypothesis Testing, Forecasting"]],
  }),
  build({
    slug: "product-manager", title: "Product Manager", category: "Product Manager",
    industry: "Technology", level: "senior",
    fullName: "Priya Sharma", jobTitle: "Senior Product Manager", city: "San Francisco", state: "California", country: "USA",
    summary: "Senior Product Manager who ships outcomes, not features. Pairs customer discovery with data to drive roadmaps that move retention and revenue.",
    experience: [
      { role: "Senior Product Manager", company: "Flowstate", start: "2020", end: "Present", location: "San Francisco, CA",
        bullets: [
          "Owned the activation roadmap, raising 30-day retention from 41% to 58% over four quarters.",
          "Led discovery across 60+ customer interviews to define a new collaboration feature now used by 70% of teams.",
          "Partnered with design and eng to cut time-to-first-value from 9 days to 2.",
        ] },
    ],
    education: [{ degree: "MBA", school: "UC Berkeley Haas", location: "Berkeley, CA", year: "2018", minor: "", gpa: "", info: "" }],
    skills: [["Product", "Roadmapping, Discovery, Prioritization, OKRs"], ["Data", "SQL, Amplitude, Mixpanel, A/B Testing"], ["Collaboration", "Stakeholder Management, Agile, Figma"]],
  }),
  build({
    slug: "business-analyst", title: "Business Analyst", category: "Business Analyst",
    industry: "Consulting", level: "mid",
    fullName: "Noah Williams", jobTitle: "Business Analyst", city: "New York", state: "New York", country: "USA",
    summary: "Business Analyst bridging stakeholders and delivery teams. Documents requirements clearly, models processes, and turns ambiguity into shippable scope.",
    experience: [
      { role: "Business Analyst", company: "Meridian Consulting", start: "2021", end: "Present", location: "New York, NY",
        bullets: [
          "Mapped and re-engineered an order-to-cash process, cutting cycle time 27%.",
          "Authored 30+ requirement specs and user stories for a $2M ERP rollout delivered on schedule.",
          "Built reporting dashboards that gave executives real-time visibility into delivery KPIs.",
        ] },
    ],
    education: [{ degree: "B.B.A. Business Administration", school: "Fordham University", location: "New York, NY", year: "2019", minor: "", gpa: "", info: "" }],
    skills: [["Analysis", "Requirements Gathering, Process Mapping, BPMN, Gap Analysis"], ["Tools", "Jira, Confluence, SQL, Visio"], ["Soft", "Stakeholder Management, Facilitation"]],
  }),
  build({
    slug: "marketing-manager", title: "Marketing Manager", category: "Marketing Manager",
    industry: "Marketing", level: "senior",
    fullName: "Ava Rossi", jobTitle: "Marketing Manager", city: "Los Angeles", state: "California", country: "USA",
    summary: "Marketing Manager driving full-funnel growth across paid, content, and lifecycle. Data-led and brand-aware, with a record of efficient, scalable acquisition.",
    experience: [
      { role: "Marketing Manager", company: "Verda Skincare", start: "2020", end: "Present", location: "Los Angeles, CA",
        bullets: [
          "Grew monthly revenue 3.2x in 18 months while holding CAC flat through channel mix optimization.",
          "Launched a lifecycle email program that drove 22% of total revenue.",
          "Managed a $1.4M annual budget and a team of 5 across content, paid, and influencer.",
        ] },
    ],
    education: [{ degree: "B.A. Marketing", school: "UCLA", location: "Los Angeles, CA", year: "2016", minor: "", gpa: "", info: "" }],
    skills: [["Growth", "Paid Social, SEO/SEM, Lifecycle, CRO"], ["Tools", "Google Ads, Meta Ads, HubSpot, GA4"], ["Leadership", "Budgeting, Team Management, Brand Strategy"]],
  }),
  build({
    slug: "sales-executive", title: "Sales Executive", category: "Sales Executive",
    industry: "Sales", level: "mid",
    fullName: "Marcus Bell", jobTitle: "Sales Executive", city: "Atlanta", state: "Georgia", country: "USA",
    summary: "Quota-crushing Sales Executive with a consultative approach to mid-market and enterprise. Builds pipeline, closes complex deals, and grows accounts.",
    experience: [
      { role: "Account Executive", company: "Stackline Software", start: "2021", end: "Present", location: "Atlanta, GA",
        bullets: [
          "Closed $2.6M in new ARR in FY24, finishing at 128% of quota.",
          "Built a referral motion that generated 30% of qualified pipeline.",
          "Shortened average sales cycle from 96 to 71 days via tighter discovery.",
        ] },
    ],
    education: [{ degree: "B.A. Communications", school: "Georgia State University", location: "Atlanta, GA", year: "2018", minor: "", gpa: "", info: "" }],
    skills: [["Sales", "Consultative Selling, Pipeline Management, Negotiation, Forecasting"], ["Tools", "Salesforce, Outreach, Gong, LinkedIn Sales Navigator"]],
  }),
  build({
    slug: "hr-executive", title: "HR Executive", category: "HR Executive",
    industry: "Human Resources", level: "mid",
    fullName: "Hannah Lee", jobTitle: "HR Executive", city: "Boston", state: "Massachusetts", country: "USA",
    summary: "HR Executive supporting the full employee lifecycle — recruiting, onboarding, engagement, and compliance. Builds people programs that scale culture as teams grow.",
    experience: [
      { role: "HR Executive", company: "Northwind Health", start: "2021", end: "Present", location: "Boston, MA",
        bullets: [
          "Reduced time-to-hire from 42 to 28 days by streamlining the interview pipeline.",
          "Rolled out an onboarding program that lifted 90-day retention by 17%.",
          "Administered benefits and HRIS for 350+ employees with zero compliance findings.",
        ] },
    ],
    education: [{ degree: "B.A. Human Resource Management", school: "Northeastern University", location: "Boston, MA", year: "2019", minor: "", gpa: "", info: "" }],
    skills: [["HR", "Recruiting, Onboarding, Employee Relations, Compliance"], ["Systems", "Workday, BambooHR, Greenhouse"]],
    certifications: [{ name: "SHRM-CP", issuer: "SHRM", date: "2022", relevance: "" }],
  }),
  build({
    slug: "finance-analyst", title: "Finance Analyst", category: "Finance Analyst",
    industry: "Finance", level: "mid",
    fullName: "Ethan Cooper", jobTitle: "Financial Analyst", city: "Charlotte", state: "North Carolina", country: "USA",
    summary: "Financial Analyst delivering FP&A, forecasting, and decision support. Turns models into recommendations that protect margin and guide investment.",
    experience: [
      { role: "Financial Analyst", company: "Summit Capital", start: "2021", end: "Present", location: "Charlotte, NC",
        bullets: [
          "Built a driver-based revenue model adopted as the company's planning standard.",
          "Identified $800K in recurring savings through vendor spend analysis.",
          "Automated monthly variance reporting in Excel + Power BI, cutting close time 3 days.",
        ] },
    ],
    education: [{ degree: "B.S. Finance", school: "UNC Charlotte", location: "Charlotte, NC", year: "2019", minor: "", gpa: "3.6", info: "" }],
    skills: [["Finance", "FP&A, Forecasting, Budgeting, Valuation"], ["Tools", "Excel (advanced), Power BI, SQL, NetSuite"]],
    certifications: [{ name: "CFA Level I", issuer: "CFA Institute", date: "2023", relevance: "" }],
  }),
  build({
    slug: "fresher", title: "Fresher / New Graduate", category: "Fresher",
    industry: "Technology", level: "entry",
    fullName: "Aarav Gupta", jobTitle: "Software Developer (Fresher)", city: "Pune", state: "Maharashtra", country: "India",
    summary: "Recent Computer Science graduate eager to start a software career. Strong fundamentals in data structures and web development, with hands-on academic and personal projects.",
    experience: [
      { role: "Software Development Intern", company: "TechNova", start: "2024", end: "2024", location: "Pune, India",
        bullets: [
          "Built REST endpoints in Spring Boot for an internal tooling project used by 20 staff.",
          "Wrote unit tests that caught 15+ defects before release.",
        ] },
    ],
    education: [{ degree: "B.Tech Computer Science", school: "Pune Institute of Technology", location: "Pune, India", year: "2025", minor: "", gpa: "8.4/10", info: "" }],
    skills: [["Languages", "Java, Python, JavaScript, SQL"], ["Web", "HTML, CSS, React, Spring Boot"], ["CS", "Data Structures, Algorithms, OOP, DBMS"]],
  }),
  build({
    slug: "internship", title: "Internship Resume", category: "Internship",
    industry: "Technology", level: "student",
    fullName: "Emily Zhang", jobTitle: "Software Engineering Intern", city: "Waterloo", state: "Ontario", country: "Canada",
    summary: "Second-year Computer Science student seeking a summer software engineering internship. Quick learner with project experience in full-stack web development and a passion for clean code.",
    experience: [
      { role: "Teaching Assistant", company: "University of Waterloo", start: "2024", end: "Present", location: "Waterloo, ON",
        bullets: ["Led weekly labs for 30 first-year students in intro programming, improving average assignment grades."] },
    ],
    education: [{ degree: "B.C.S. Computer Science (in progress)", school: "University of Waterloo", location: "Waterloo, ON", year: "2027", minor: "", gpa: "3.9", info: "Dean's List 2024" }],
    skills: [["Languages", "Python, Java, C, JavaScript"], ["Tools", "Git, Linux, React, Node.js"]],
  }),
  build({
    slug: "student", title: "Student Resume", category: "Student",
    industry: "General", level: "student",
    fullName: "Carlos Mendes", jobTitle: "Business Student", city: "Miami", state: "Florida", country: "USA",
    summary: "Motivated business student with leadership experience through campus organizations and part-time work. Seeking opportunities to apply analytical and communication skills.",
    experience: [
      { role: "Sales Associate (Part-time)", company: "Campus Bookstore", start: "2023", end: "Present", location: "Miami, FL",
        bullets: ["Handled customer service and inventory for a high-traffic store, consistently meeting upsell targets."] },
    ],
    education: [{ degree: "B.B.A. (in progress)", school: "Florida International University", location: "Miami, FL", year: "2026", minor: "Marketing", gpa: "3.5", info: "President, Marketing Club" }],
    skills: [["Skills", "Communication, Teamwork, Microsoft Office, Time Management"], ["Languages", "English, Spanish (fluent)"]],
  }),
  build({
    slug: "executive", title: "Executive Resume", category: "Executive",
    industry: "Leadership", level: "executive",
    fullName: "Patricia Nakamura", jobTitle: "VP of Engineering", city: "San Jose", state: "California", country: "USA",
    summary: "Engineering executive who scales high-performing organizations and ships product at velocity. Built and led teams of 100+ across multiple product lines with strong delivery and retention.",
    experience: [
      { role: "VP of Engineering", company: "Helix Cloud", start: "2018", end: "Present", location: "San Jose, CA",
        bullets: [
          "Scaled engineering from 18 to 140 across 12 teams while improving on-time delivery to 92%.",
          "Drove a platform re-architecture that cut infra spend 35% and tripled release frequency.",
          "Built leadership bench and hiring practices that reduced regretted attrition to under 4%.",
        ] },
      { role: "Director of Engineering", company: "Orbit Systems", start: "2014", end: "2018", location: "Sunnyvale, CA",
        bullets: ["Led 40 engineers delivering the company's flagship analytics platform to 500+ enterprise customers."] },
    ],
    education: [{ degree: "M.S. Computer Science", school: "Stanford University", location: "Stanford, CA", year: "2010", minor: "", gpa: "", info: "" }],
    skills: [["Leadership", "Org Design, Hiring, Mentorship, OKRs, Budgeting"], ["Technical", "Distributed Systems, Cloud Architecture, Platform Strategy"]],
  }),
];

export const SAMPLE_CATEGORIES = Array.from(new Set(SAMPLES.map((s) => s.category)));
export const SAMPLE_INDUSTRIES = Array.from(new Set(SAMPLES.map((s) => s.industry)));
export const SAMPLE_LEVELS: SampleLevel[] = ["student", "entry", "mid", "senior", "executive"];

export function getSample(slug: string): ResumeSample | undefined {
  return SAMPLES.find((s) => s.slug === slug);
}
