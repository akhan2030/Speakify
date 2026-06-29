-- Business English LMS: modules + lessons
-- Run in Supabase SQL Editor before: npm run seed:business-english:module1

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.business_english_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme text NOT NULL DEFAULT 'business_english',
  title text NOT NULL,
  slug text NOT NULL,
  cefr_level text NOT NULL,
  module_number integer NOT NULL,
  week_start integer NOT NULL,
  week_end integer NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (programme, slug),
  UNIQUE (programme, module_number)
);

CREATE TABLE IF NOT EXISTS public.business_english_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.business_english_modules (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL,
  order_number integer NOT NULL,
  status text NOT NULL DEFAULT 'locked',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, order_number),
  CONSTRAINT business_english_lessons_status_check
    CHECK (status IN ('available', 'locked', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_business_english_modules_programme
  ON public.business_english_modules (programme, module_number);

CREATE INDEX IF NOT EXISTS idx_business_english_lessons_module
  ON public.business_english_lessons (module_id, order_number);

ALTER TABLE public.business_english_modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_english_lessons DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
