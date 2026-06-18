# Inkwell — Architecture

> Last updated: 2026-06-17  
> Stack: Next.js 14 (App Router) · TypeScript · Tailwind CSS · Zustand · Supabase · OpenAI

---

## Directory layout

```
resume-builder/
├── app/
│   ├── api/ai/          # POST /api/ai — Zod-validated, rate-limited AI endpoint
│   ├── auth/            # login · register · callback (OAuth PKCE)
│   ├── builder/         # Resume builder + live xl split-pane preview
│   │   └── preview/     # Finish-up screen + PDF export
│   ├── cover-letter/    # Cover-letter editor
│   ├── dashboard/       # Resume & cover-letter grid/list management
│   ├── global-error.tsx # Root error boundary (Sentry-wired)
│   ├── layout.tsx       # Root layout: AuthProvider + SyncProvider + skip-link
│   └── page.tsx         # Marketing landing page
│
├── components/
│   ├── AuthProvider.tsx  # React context: user · session · profile (role) · signOut
│   ├── SyncProvider.tsx  # Invisible: hydrates Zustand from Supabase on login,
│   │                     #            debounce-syncs writes back (3 s)
│   ├── Sidebar.tsx       # App nav: mobile drawer + desktop static · user footer
│   ├── ResumePreview.tsx # A4 resume renderer (used in builder xl pane + preview page)
│   ├── CreateResumeModal.tsx # A11y-hardened: role, aria-modal, focus trap, scroll lock
│   └── ui/              # Primitive layer: Button · Input · Textarea · Card · Badge
│                         #                 Modal · Toast · Skeleton · EmptyState
│
├── lib/
│   ├── brand.ts         # Single source of truth for all brand strings
│   ├── store.ts         # Zustand resume store (persist → localStorage "inkwell-resumes")
│   ├── coverStore.ts    # Zustand cover-letter store ("inkwell-covers")
│   ├── rateLimit.ts     # In-memory sliding-window rate limiter (IP-keyed)
│   ├── score.ts         # Pure function: ATS completeness score (0–100)
│   ├── keywords.ts      # Pure function: JD keyword matcher
│   ├── types.ts         # All shared TypeScript interfaces + factory functions
│   └── supabase/
│       ├── client.ts    # createBrowserClient() singleton
│       ├── server.ts    # createServerClient() with cookie passthrough
│       └── db.ts        # fetchResumes · syncResumes · fetchCovers · syncCovers
│
├── supabase/
│   └── migrations/
│       └── 0001_init.sql  # profiles · resumes · cover_letters · RLS · triggers
│
├── sentry.client.config.ts
├── sentry.server.config.ts
├── sentry.edge.config.ts
├── instrumentation.ts      # Next.js hook that bootstraps Sentry on server/edge
├── middleware.ts           # Route guard: unauthenticated → /auth/login
├── vitest.config.ts
└── .github/workflows/ci.yml
```

---

## Data flow

### Local-only (unauthenticated)

```
User edits resume
    → setData() in component
    → Zustand store.updateData()
    → zustand/persist → localStorage "inkwell-resumes"
    → 400 ms debounce → store.updateData (already in memory, no-op)
```

### Authenticated (Supabase sync)

```
Login
    → supabase.auth.signInWithPassword / signInWithOAuth
    → AuthProvider.onAuthStateChange fires
    → SyncProvider detects user change
    → fetchResumes(userId) from Supabase
    → resumeStore.hydrate(resumes)   ← overwrites localStorage
    → zustand/persist re-serialises to localStorage

User edits resume
    → setData() → Zustand → localStorage  (instant, synchronous)
    → SyncProvider watches store changes
    → 3 s debounce → syncResumes(userId, resumes)
    → Supabase upsert all resumes + delete any removed rows
```

### Sign out

```
signOut() → supabase.auth.signOut()
    → AuthProvider clears user/session/profile
    → SyncProvider stops syncing (user is null)
    → Zustand store retains last state in localStorage
      (next sign-in will overwrite it with the server copy)
```

---

## Auth flow

```
/auth/login → supabase.auth.signInWithPassword
           → supabase.auth.signInWithOAuth (Google) → /auth/callback
/auth/callback → exchangeCodeForSession → redirect /dashboard
/auth/register → supabase.auth.signUp → confirmation email
                 → user clicks link → /auth/callback
```

Middleware in `middleware.ts` protects `/dashboard`, `/builder`, `/cover-letter`.  
It calls `supabase.auth.getUser()` (never the cached session) on every request.  
If `NEXT_PUBLIC_SUPABASE_URL` is a placeholder, the middleware is a no-op so the  
app works without a Supabase project during local development.

---

## API route: POST /api/ai

```
Request body (Zod discriminated union):
  { task: "rewrite-bullet", text: string }
  { task: "summary", role?, context? }
  { task: "cover-letter", fullName?, company?, position?, ... }

Guards (in order):
  1. Rate limit — 20 req/min per client IP (in-memory sliding window)
  2. Zod parse — 400 if invalid
  3. No API key → local heuristic fallback (200)
  4. OpenAI gpt-4o-mini call
  5. On OpenAI error → Sentry.captureException + local fallback (200)

Response headers (on success):
  X-RateLimit-Remaining, X-RateLimit-Reset
```

**Production note:** the in-memory rate limiter resets on pod restart and does not  
share state across instances. Replace `lib/rateLimit.ts` with a Redis ZADD/ZCARD  
sliding window (same interface) for multi-instance deployments.

---

## Database schema (Supabase / Postgres)

```sql
public.profiles    id · email · role (free|pro|team|admin) · created_at
public.resumes     id · user_id · name · data (JSONB) · created_at · updated_at
public.cover_letters  id · user_id · name · data (JSONB) · created_at · updated_at
```

All tables have Row Level Security enabled.  
Every `FOR ALL` policy uses `auth.uid() = user_id` (or `= id` for profiles).  
A Postgres trigger auto-creates a `profiles` row when a user signs up.  
A second trigger keeps `updated_at` fresh on every row update.

---

## RBAC roles

| Role  | Enforced by | Limits |
|-------|-------------|--------|
| free  | client-side gate (Sidebar upsell) | 1 resume (UI hint only) |
| pro   | future server-side check | unlimited |
| team  | future server-side check | shared templates, team seats |
| admin | future server-side check | full access |

Roles are stored in `public.profiles.role` and read by `AuthProvider` into  
React context. Server-side enforcement (count checks before insert) is Phase 5 work.

---

## Design system

All colour decisions live in two files:

| File | Purpose |
|------|---------|
| `tailwind.config.ts` | Token definitions (`nav.*`, `primary.*`, `accent.*`) |
| `app/globals.css` | CSS custom properties mirroring the Tailwind tokens |

The `nav.*` family drives the entire app shell (sidebar, dashboard, builder).  
Changing those six tokens (`bg`, `panel`, `card`, `border`, `text`, `muted`) plus  
`nav.blue` / `nav.indigo` is sufficient to re-theme the whole product.

---

## Testing

```bash
npm test          # vitest in watch mode
npm run test:run  # single pass (CI)
```

| Suite | File | What it covers |
|-------|------|----------------|
| score | `lib/__tests__/score.test.ts` | all 10 checks, total = sum of weights, ≤ 100 |
| keywords | `lib/__tests__/keywords.test.ts` | stop-word filter, short-token filter, cap at 30 |

---

## CI pipeline (GitHub Actions)

`.github/workflows/ci.yml` runs on every push to `main` / `dev` and every PR:

1. `npm ci` — install from lockfile
2. `npx tsc --noEmit` — type-check
3. `npm run test:run` — unit tests
4. `npm run build` — production Next.js build (with env placeholders)

---

## Observability (Sentry)

| File | Runtime |
|------|---------|
| `sentry.client.config.ts` | Browser — Session Replay at 5%, 100% on error |
| `sentry.server.config.ts` | Node.js server — traces at 20% |
| `sentry.edge.config.ts` | Edge middleware — traces at 20% |
| `app/global-error.tsx` | Root error boundary — captures uncaught React errors |

Set `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`  
in Vercel (or `.env.local`) to activate. All four are empty by default so the app  
builds and runs without a Sentry account.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | No (has local fallback) | gpt-4o-mini for AI rewrites |
| `NEXT_PUBLIC_SUPABASE_URL` | No (middleware is a no-op without it) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon key |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry error reporting |
| `SENTRY_AUTH_TOKEN` | No (skipped in CI) | Source-map upload |
| `SENTRY_ORG` | No | Sentry org slug |
| `SENTRY_PROJECT` | No | Sentry project slug |
