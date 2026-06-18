-- ─────────────────────────────────────────────────────────
-- Inkwell platform schema (Phase 2)
-- Adds: folders, jobs, ai_conversations, ai_messages,
--       resume_scores, resume_versions, resume_samples,
--       templates, exports  + resumes.folder_id link.
--
-- Run AFTER 0001_init.sql via:
--   supabase db push      (Supabase CLI)
--   or paste into SQL Editor → Run
--
-- Every user-owned table enables RLS scoped to auth.uid().
-- Catalog tables (resume_samples, templates) are world-readable
-- but writable only by service-role / admin.
-- ─────────────────────────────────────────────────────────

-- ── Folders ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.folders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'New folder',
  color      TEXT NOT NULL DEFAULT 'violet',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_folders" ON public.folders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS folders_user_id_idx ON public.folders (user_id);

-- Link resumes → folders (nullable: NULL = "All resumes").
ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS folder_id UUID
  REFERENCES public.folders (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS resumes_folder_id_idx ON public.resumes (folder_id);

-- ── Jobs (application tracker) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  company     TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT '',
  url         TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'saved'
                CHECK (status IN ('saved','applied','interview','offer','rejected')),
  resume_id   UUID REFERENCES public.resumes (id) ON DELETE SET NULL,
  notes       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_jobs" ON public.jobs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON public.jobs (user_id);

-- ── AI conversations + messages (Resume Agent) ─────────────
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  resume_id  UUID REFERENCES public.resumes (id) ON DELETE SET NULL,
  title      TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_conversations" ON public.ai_conversations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS ai_conversations_user_id_idx ON public.ai_conversations (user_id);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations (id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content         TEXT NOT NULL DEFAULT '',
  suggestion      JSONB,             -- optional structured "apply to resume" payload
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_messages" ON public.ai_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS ai_messages_conversation_idx ON public.ai_messages (conversation_id);

-- ── Resume scores (cached ATS snapshots) ───────────────────
CREATE TABLE IF NOT EXISTS public.resume_scores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  resume_id  UUID NOT NULL REFERENCES public.resumes (id) ON DELETE CASCADE,
  total      INT  NOT NULL DEFAULT 0 CHECK (total BETWEEN 0 AND 100),
  breakdown  JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resume_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_scores" ON public.resume_scores
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS resume_scores_resume_idx ON public.resume_scores (resume_id);

-- ── Resume versions (history / restore) ────────────────────
CREATE TABLE IF NOT EXISTS public.resume_versions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  resume_id  UUID NOT NULL REFERENCES public.resumes (id) ON DELETE CASCADE,
  label      TEXT NOT NULL DEFAULT 'autosave',
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_versions" ON public.resume_versions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS resume_versions_resume_idx ON public.resume_versions (resume_id);

-- ── Cover letter ↔ job link (optional) ─────────────────────
ALTER TABLE public.cover_letters
  ADD COLUMN IF NOT EXISTS job_id UUID
  REFERENCES public.jobs (id) ON DELETE SET NULL;

-- ── Exports (history) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  resume_id  UUID REFERENCES public.resumes (id) ON DELETE SET NULL,
  format     TEXT NOT NULL CHECK (format IN ('pdf','docx')),
  is_public  BOOLEAN NOT NULL DEFAULT false,
  share_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
-- Owner can do everything…
CREATE POLICY "users_own_exports" ON public.exports
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- …and anyone may read a row that has been explicitly made public (share links).
CREATE POLICY "public_share_read" ON public.exports
  FOR SELECT USING (is_public = true);
CREATE INDEX IF NOT EXISTS exports_user_id_idx ON public.exports (user_id);

-- ── Catalog: resume_samples (world-readable) ───────────────
CREATE TABLE IF NOT EXISTS public.resume_samples (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,        -- e.g. "Software Engineer"
  industry    TEXT NOT NULL DEFAULT 'Technology',
  level       TEXT NOT NULL DEFAULT 'mid'
                CHECK (level IN ('student','entry','mid','senior','executive')),
  style       TEXT NOT NULL DEFAULT 'modern',
  data        JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resume_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "samples_read_all" ON public.resume_samples
  FOR SELECT USING (true);
-- Writes only via service-role key (no INSERT/UPDATE/DELETE policy for end users).

-- ── Catalog: templates (world-readable) ────────────────────
CREATE TABLE IF NOT EXISTS public.templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_ats      BOOLEAN NOT NULL DEFAULT true,
  config      JSONB NOT NULL DEFAULT '{}',  -- font, spacing, accent defaults
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_read_all" ON public.templates
  FOR SELECT USING (true);

-- ── updated_at triggers for the new mutable tables ─────────
CREATE OR REPLACE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
