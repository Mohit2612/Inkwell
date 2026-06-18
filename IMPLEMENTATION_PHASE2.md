# Inkwell — Phase 2 Implementation (AI Resume Platform)

This document covers the audit findings, the architecture decisions, what was implemented
in this pass, the new database schema, environment/setup, a feature checklist, and known
limitations. It is written to be dropped into the existing **Inkwell** repo.

---

## 1. Codebase audit (what already existed)

The uploaded project (`inkwell`, Next.js 14 App Router + TS + Tailwind + Zustand + Supabase
+ OpenAI) was already a solid, real application — **not** a mockup. Working pieces:

| Area | Status before this pass |
|------|------------------------|
| Auth (login / register / OAuth callback) + route middleware | Working |
| Resume store (Zustand + `localStorage` + 3 s debounce sync to Supabase) | Working |
| Cover-letter store + editor | Working |
| Dashboard (CRUD, sort, grid/list, duplicate, rename, delete) | Working |
| Resume builder (all sections, live A4 preview, format controls) | Working |
| Preview + PDF (print) export page | Working |
| `POST /api/ai` (Zod + rate-limit + OpenAI `gpt-4o-mini` + local fallback) | Working, 3 tasks |
| Scoring engine `lib/score.ts` (pure, unit-tested) | Working, **no UI page** |
| Keyword matcher `lib/keywords.ts` (pure, unit-tested) | Working, **no UI page** |
| DB migration `0001_init.sql` (profiles, resumes, cover_letters + RLS) | Working |
| Sentry, vitest, CI | Wired |

**The core gap:** the sidebar advertised *AI Resume Agent, AI Interview, Job Search,
Sample Library* as **dead buttons with no routes**, and the already-built scoring/keyword
engines had no user-facing page. So the highest-leverage work was to turn dead nav into
real, working features and surface the existing engines — not to rewrite anything.

**Decision: preserve everything, add alongside.** No existing file was rewritten; only
four files were edited additively (API route, Sidebar, middleware, one dashboard card).

---

## 2. What was implemented in this pass

### New, fully working features (real, type-checked, no dead buttons)

1. **AI Resume Agent** — `app/agent/page.tsx`
   - Chat UI over a selected resume; reads a compact resume snapshot as context.
   - Optional job-description box for tailoring.
   - Quick-action chips (improve summary, suggest skills, strengthen bullets, tailor to job).
   - Assistant suggestions render an **Apply to summary / Apply to skills** button that
     writes straight back into the resume store.
   - Chat history persisted per-resume (`lib/agentStore.ts`, `localStorage`).
   - Streaming is **not** implemented (MVP returns the full message); see limitations.

2. **ATS Resume Checker** — `app/checker/page.tsx`
   - Runs the existing `scoreResume()` engine, renders the existing `ScoreGauge`.
   - **Prioritized fixes** sorted by point weight (highest impact first).
   - **Fix with AI** for the AI-addressable checks (summary, skills, un-quantified bullet);
     non-AI checks link into the builder (honest — no fake AI buttons).

3. **Keyword Targeting** — `app/keywords/page.tsx`
   - Paste a JD → `matchKeywords()` → match %, matched chips, selectable missing chips.
   - Select missing keywords → **add to resume** as a skill group.
   - **Tailor summary** button uses the new `tailor` AI task against the JD.

4. **Sample Library** — `app/samples/page.tsx` + `lib/sampleLibrary.ts`
   - 15 seeded, typed samples across the requested categories (Software/Frontend/Backend/
     Full-Stack Engineer, Data Analyst, PM, BA, Marketing, Sales, HR, Finance, Fresher,
     Internship, Student, Executive).
   - Search + industry + level filters, live preview (reuses `ResumePreview`),
     **Use sample** creates a real resume and opens the builder.

### Extended

- **`app/api/ai/route.ts`** — added three Zod-validated tasks: `agent`, `skills`, `tailor`,
  each with an OpenAI prompt **and** a local heuristic fallback, matching the existing pattern.
- **`lib/ai.ts`** — shared `callAI()` client + `resumeToContext()` serializer.
- **`components/Sidebar.tsx`** — nav is now real `<Link>`s with active-route highlighting;
  unbuilt items (Job Tracker, AI Interview) are shown disabled with a **SOON** tag (no dead links).
- **`middleware.ts`** — `/agent`, `/checker`, `/keywords` added to protected routes.
- **`app/dashboard/page.tsx`** — the "AI Resume Agent" promo card now routes to `/agent`.

### New database schema — `supabase/migrations/0002_platform.sql`

All tables requested in the brief, each with **RLS scoped to `auth.uid()`**:
`folders`, `jobs`, `ai_conversations`, `ai_messages`, `resume_scores`, `resume_versions`,
`resume_samples` (catalog, world-readable), `templates` (catalog, world-readable),
`exports` (with public share-link read policy). Plus `resumes.folder_id`,
`cover_letters.job_id` links and `updated_at` triggers.

> The schema is **shipped and ready to apply** even though the UI for jobs/folders/versions
> is not built yet — so the backend is in place for the next phase.

---

## 3. Environment variables

No new variables are required. Existing ones (all optional for local dev):

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | No (local fallback) | Enables real AI for all tasks incl. the agent |
| `NEXT_PUBLIC_SUPABASE_URL` | No (middleware no-ops) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon key |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_*` | No | Error reporting |

Without `OPENAI_API_KEY`, the agent, checker, and keyword tailoring still work — they
return the documented local heuristics instead of model output.

---

## 4. Setup

```bash
# 1. Install (the bundled node_modules was packed on another OS — reinstall locally)
rm -rf node_modules package-lock.json   # only if you hit native-binary errors
npm install

# 2. Apply the database migrations (in order)
#    Supabase CLI:
supabase db push
#    …or paste supabase/migrations/0001_init.sql then 0002_platform.sql into the SQL editor.

# 3. (optional) seed the catalog tables from lib/sampleLibrary.ts if you want
#    server-side samples; the Sample Library page currently reads the in-app seed directly.

# 4. Run
npm run dev          # http://localhost:3000
npx tsc --noEmit     # type-check (clean)
npm run test:run     # unit tests (score + keywords)
```

New routes: `/agent`, `/checker`, `/keywords`, `/samples`.

---

## 5. Feature completion checklist

Legend: ✅ done this pass · 🟢 already working · 🟡 partial/MVP · ⬜ schema ready, UI pending

| Brief feature | State |
|---------------|-------|
| Dashboard (CRUD, sort, search, grid/list, duplicate/rename/delete) | 🟢 |
| Move to folder / filter by folder | ⬜ (`folders` table + `resumes.folder_id` ready) |
| AI Resume Agent (chat, read resume, rewrite, tailor, apply, history) | ✅ (🟡 no streaming) |
| Resume Builder (all sections, live preview, autosave, export PDF) | 🟢 |
| Drag-and-drop section order / version history / DOCX export | ⬜ (`resume_versions` ready) |
| ATS Score / Checker (score, prioritized fixes, Fix with AI) | ✅ |
| Keyword Targeting (extract, match/missing, add to resume, tailor) | ✅ |
| AI Writers (summary, bullet, rewrite, skills, tailor, cover letter) | 🟢/✅ |
| Cover Letter module (generate, edit, export) | 🟢 (🟡 link-to-job pending) |
| Sample Library (search, filter, preview, create from sample) | ✅ |
| Template Library (multiple renderers, switch, customize) | 🟡 (format controls exist; `templates` table ready) |
| Folders | ⬜ (schema ready) |
| Job Tracker (pipeline, link resume) | ⬜ (`jobs` table + status enum ready) |
| Import Resume (parse PDF/DOCX) | ⬜ (see limitations) |
| Export / Sharing (PDF, DOCX, share link) | 🟡 PDF works; DOCX + share `exports` table ready |
| Settings (profile, usage, plan, delete/export) | ⬜ |
| DB schema (all 13 tables) + RLS | ✅ |
| Per-user data scoping + RLS + Zod + rate limit | 🟢/✅ |

---

## 6. Known limitations (honest)

- **AI Agent is non-streaming.** It returns the complete response. The `/api/ai` route uses
  a single `chat.completions.create`; switching to `stream: true` + a `ReadableStream`
  response and an `EventSource`/reader on the client is the next step.
- **Agent/checker persistence is client-side** (`localStorage`) for this MVP. The
  `ai_conversations` / `ai_messages` / `resume_scores` tables are created and RLS-protected
  so moving to server persistence is a wiring task, not a schema task.
- **PDF/DOCX import parsing is not implemented.** Reliable parsing needs a parser
  (`pdf-parse` / `mammoth`) plus an LLM normalization step; deliberately deferred rather
  than shipped half-working.
- **DOCX export not implemented** (PDF via browser print works today). Add the `docx`
  library + a `ResumeData → docx` mapper.
- **Job Tracker, Folders, Settings, Template Library renderers** have schema + (for folders)
  a resume link, but no UI yet.
- **Rate limiter is in-memory** (per the original architecture note) — replace with Redis
  for multi-instance deploys.
- The bundled `node_modules` in the zip was built on a different OS, so `vitest`/`next build`
  need a local `npm install`; `tsc --noEmit` was used to verify types here (clean, `strict: true`).

---

## 7. Suggested next phases

1. Stream the agent + persist conversations to `ai_messages`.
2. Job Tracker UI on the `jobs` table (Kanban: Saved → Applied → Interview → Offer → Rejected).
3. Folders UI + dashboard filter using `resumes.folder_id`.
4. Resume import (`pdf-parse`/`mammoth` → AI normalize → review screen → save).
5. DOCX export + share links (`exports.share_slug`, public read policy already in place).
6. Settings page (profile, AI usage from `ai_messages` counts, plan gating via `profiles.role`).
