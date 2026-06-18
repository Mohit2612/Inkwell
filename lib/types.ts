/* ===================== Resume model ===================== */

export interface Contact {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  website: string;
  country: string;
  state: string;
  city: string;
  showState: boolean;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  start: string;
  end: string;
  location: string;
  bullets: string[];
}

export interface Project {
  id: string;
  title: string;
  organization: string;
  start: string;
  end: string;
  url: string;
  bullets: string[];
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  location: string;
  year: string;
  minor: string;
  gpa: string;
  info: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  relevance: string;
}

export interface SkillGroup {
  id: string;
  title: string; // e.g. "Test Automation"
  content: string; // comma-separated skills
}

export interface ResumeFormat {
  fontFamily: string;
  fontSizePt: number;
  lineHeight: number;
  paraSpacing: number;
  zoom: number; // percent
  paper: "A4" | "Letter";
  viewAsPages: boolean;
}

export const defaultFormat = (): ResumeFormat => ({
  fontFamily: "Merriweather, Georgia, serif",
  fontSizePt: 11,
  lineHeight: 1.55,
  paraSpacing: 1.5,
  zoom: 100,
  paper: "A4",
  viewAsPages: true,
});

export const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "Merriweather", value: "Merriweather, Georgia, serif" },
  { label: "Lora", value: "Lora, Georgia, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Roboto", value: "Roboto, system-ui, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
];

export interface ResumeData {
  contact: Contact;
  summary: string;
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  skillGroups: SkillGroup[];
  format: ResumeFormat;
}

export interface Resume {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  data: ResumeData;
}

export const emptyResumeData = (): ResumeData => ({
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
    showState: true,
  },
  summary: "",
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  skillGroups: [],
  format: defaultFormat(),
});

export const newExperience = (): Experience => ({
  id: crypto.randomUUID(),
  role: "",
  company: "",
  start: "",
  end: "",
  location: "",
  bullets: [""],
});

export const newProject = (): Project => ({
  id: crypto.randomUUID(),
  title: "",
  organization: "",
  start: "",
  end: "",
  url: "",
  bullets: [""],
});

export const newEducation = (): Education => ({
  id: crypto.randomUUID(),
  degree: "",
  school: "",
  location: "",
  year: "",
  minor: "",
  gpa: "",
  info: "",
});

export const newCertification = (): Certification => ({
  id: crypto.randomUUID(),
  name: "",
  issuer: "",
  date: "",
  relevance: "",
});

export const newSkillGroup = (): SkillGroup => ({
  id: crypto.randomUUID(),
  title: "",
  content: "",
});

export const sampleResumeData = (): ResumeData => ({
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
    showState: true,
  },
  summary:
    "Senior QA Automation Engineer / SDET with 5+ years delivering enterprise-scale quality engineering across Banking, Healthcare, and Telecom. Strong in Java, Selenium WebDriver, RESTAssured, and CI/CD, with a track record of cutting regression effort and raising sprint coverage.",
  experience: [
    {
      id: crypto.randomUUID(),
      role: "Quality Assurance Engineer / SDET",
      company: "Elevance Health",
      start: "Jan 2024",
      end: "Present",
      location: "USA",
      bullets: [
        "Architected a Java-based Selenium WebDriver + Cucumber BDD regression framework using Page Object Model, covering 600+ automated test cases and reducing manual regression effort by 65%.",
        "Built RESTAssured API automation suites validating REST and gRPC payloads against OpenAPI/Swagger contracts, identifying 30+ pre-production defects per quarter.",
        "Integrated automated smoke and regression suites into Jenkins/GitHub Actions CI/CD pipelines, enabling continuous testing and faster feedback.",
      ],
    },
    {
      id: crypto.randomUUID(),
      role: "Quality Engineering Analyst",
      company: "Accenture",
      start: "Jun 2021",
      end: "Dec 2022",
      location: "India",
      bullets: [
        "Led functional and regression testing across enterprise platforms, achieving 98% sprint coverage.",
      ],
    },
  ],
  projects: [
    {
      id: crypto.randomUUID(),
      title: "LCA Visual Studios | Full-Stack Web App",
      organization: "Clark University",
      start: "Jan 2024",
      end: "Jun 2024",
      url: "github.com/aswini/lca",
      bullets: [
        "Built a multi-portal web app with public portfolio, admin and customer dashboards using Next.js/TypeScript, MongoDB, and role-based auth.",
      ],
    },
  ],
  education: [
    {
      id: crypto.randomUUID(),
      degree: "Master of Science in Computer Science",
      school: "Clark University",
      location: "USA",
      year: "2024",
      minor: "",
      gpa: "3.82",
      info: "",
    },
    {
      id: crypto.randomUUID(),
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
    {
      id: crypto.randomUUID(),
      name: "Microsoft Azure Fundamentals",
      issuer: "Microsoft",
      date: "2023",
      relevance: "",
    },
    {
      id: crypto.randomUUID(),
      name: "AWS Certified Solutions Architect - Associate",
      issuer: "Amazon Web Services",
      date: "2022",
      relevance: "",
    },
  ],
  skillGroups: [
    {
      id: crypto.randomUUID(),
      title: "Test Automation",
      content:
        "Selenium WebDriver, RESTAssured, JUnit, TestNG, Cucumber/Gherkin, Playwright, Cypress, POM",
    },
    {
      id: crypto.randomUUID(),
      title: "Programming",
      content: "Java, Python, SQL, JavaScript, TypeScript",
    },
    {
      id: crypto.randomUUID(),
      title: "API / Integration",
      content: "REST, SOAP, gRPC, GraphQL, JSON, XML, OpenAPI/Swagger",
    },
  ],
  format: defaultFormat(),
});

/* ===================== Cover letter model ===================== */

export interface CoverContact {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  date: string;
  company: string;
  recipient: string;
}

export interface CoverData {
  contact: CoverContact;
  content: string;
  fontSize: number;
  lineHeight: number;
}

export interface CoverLetter {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  data: CoverData;
}

export const emptyCoverData = (): CoverData => ({
  contact: {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    date: "",
    company: "",
    recipient: "Dear Hiring Team,",
  },
  content: "",
  fontSize: 11,
  lineHeight: 1.5,
});
