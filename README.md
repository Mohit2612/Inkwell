# Inkwell — Land the interview.

An ATS-friendly resume builder with live preview, a transparent ATS score, and
AI-assisted bullet rewriting. Built for US-based professionals and job seekers.

## Stack

| Layer      | Tech                                    |
| ---------- | --------------------------------------- |
| Framework  | Next.js 14 (App Router)                 |
| Language   | TypeScript (strict)                     |
| Styling    | Tailwind CSS + CSS custom properties    |
| State      | Zustand (localStorage in Phase 1)       |
| AI         | OpenAI API (`gpt-4o-mini`)              |
| PDF export | Browser print (`window.print`) → A4     |

## Getting started

```bash
npm install
cp .env.example .env.local   # add your OPENAI_API_KEY
npm run dev
```

Open http://localhost:3000

AI features work without a key — the API route falls back to a local heuristic
so the app never hard-fails. Add a key to get real GPT rewrites.

## Environment variables

| Variable         | Required | Purpose                        |
| ---------------- | -------- | ------------------------------ |
| `OPENAI_API_KEY` | No       | Enables real AI rewrites/draft |

## Project structure

```
app/
  page.tsx                  Landing page
  layout.tsx                Root layout + metadata
  dashboard/page.tsx        Resume & cover-letter dashboard
  builder/page.tsx          Resume editor
  builder/preview/page.tsx  Preview + format + PDF export
  cover-letter/page.tsx     Cover-letter editor
  api/ai/route.ts           OpenAI endpoint (bullet rewrite, summary, cover letter)
  globals.css               Design tokens (CSS vars) + global styles
components/
  Sidebar.tsx               Dashboard sidebar nav
  ResumePreview.tsx         Live resume sheet (also used for PDF print)
  ResumeThumbnail.tsx       Scaled-down resume card thumbnail
  CoverLetterPreview.tsx    Live cover-letter sheet
  CoverThumbnail.tsx        Scaled-down cover-letter thumbnail
  CreateResumeModal.tsx     New-resume creation modal
  builder/
    fields.tsx              Dark-theme form primitives (DInput, DTextarea, BulletEditor)
    SectionSidebar.tsx      Section list + score ring panel
    ScoreGauge.tsx          Half-circle score gauge for preview page
    ScoreRing.tsx           Compact score ring for builder sidebar
  ui/                       Shared primitive components (Phase 1 design system)
    Button.tsx
    Input.tsx
    Textarea.tsx
    Card.tsx
    Badge.tsx
    Modal.tsx
    Toast.tsx
    Skeleton.tsx
    EmptyState.tsx
    index.ts
lib/
  brand.ts                  Single source of truth for brand strings
  types.ts                  Data model (ResumeData, CoverLetter) + sample data
  store.ts                  Zustand resume store (localStorage)
  coverStore.ts             Zustand cover-letter store (localStorage)
  score.ts                  ATS scoring heuristic
  keywords.ts               Keyword-match utility for job description targeting
```

## Phases

| Phase | Scope                                        | Status      |
| ----- | -------------------------------------------- | ----------- |
| 0     | Audit & plan                                 | ✅ Complete |
| 1     | Rebrand + design tokens + UI primitives      | ✅ Complete |
| 2     | Redesign all screens on the new design system| 🔜 Next     |
| 3     | Backend (Supabase), auth, multi-tenancy, RBAC| 🔜 Planned  |
| 4     | Security, testing, CI/CD, observability, docs| 🔜 Planned  |

## Going to a real backend (Phase 3)

Persistence is currently localStorage via Zustand `persist`. Phase 3 will add:

- **Supabase/Postgres** — `resumes` and `cover_letters` tables with `data jsonb`
- **Supabase Auth** — email/password + Google OAuth, designed for SAML expansion
- **Row-level security** — tenant isolation at the database layer
- **RBAC** — Owner / Admin / Member / Viewer roles

The `ResumeData` and `CoverData` types in `lib/types.ts` map cleanly to a single
`jsonb` column, so the UI doesn't have to change shape.

## Notes

- The ATS score in `lib/score.ts` is a transparent completeness heuristic, not a
  real applicant-tracking system parser. It's intentionally readable and editable.
- One clean single-column ATS resume template is included. A template picker and
  additional layouts are planned for Phase 2.
- Brand strings are centralized in `lib/brand.ts` — future rebrands are one-file changes.
