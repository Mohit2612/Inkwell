import { z } from "zod";

const ContactImportSchema = z
  .object({
    fullName: z.string(),
    title: z.string(),
    email: z.string(),
    phone: z.string(),
    linkedin: z.string(),
    website: z.string(),
    country: z.string(),
    state: z.string(),
    city: z.string(),
  })
  .strict();

const ExperienceImportSchema = z
  .object({
    role: z.string(),
    company: z.string(),
    start: z.string(),
    end: z.string(),
    location: z.string(),
    bullets: z.array(z.string()),
  })
  .strict();

const ProjectImportSchema = z
  .object({
    title: z.string(),
    organization: z.string(),
    start: z.string(),
    end: z.string(),
    url: z.string(),
    bullets: z.array(z.string()),
  })
  .strict();

const EducationImportSchema = z
  .object({
    degree: z.string(),
    school: z.string(),
    location: z.string(),
    year: z.string(),
    minor: z.string(),
    gpa: z.string(),
    info: z.string(),
  })
  .strict();

const CertificationImportSchema = z
  .object({
    name: z.string(),
    issuer: z.string(),
    date: z.string(),
    relevance: z.string(),
  })
  .strict();

const SkillGroupImportSchema = z
  .object({
    title: z.string(),
    content: z.string(),
  })
  .strict();

export const ResumeImportSchema = z
  .object({
    contact: ContactImportSchema,
    summary: z.string(),
    experience: z.array(ExperienceImportSchema),
    projects: z.array(ProjectImportSchema),
    education: z.array(EducationImportSchema),
    certifications: z.array(CertificationImportSchema),
    skillGroups: z.array(SkillGroupImportSchema),
  })
  .strict();

export type ResumeImport = z.infer<typeof ResumeImportSchema>;
