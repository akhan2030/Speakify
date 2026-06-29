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

INSERT INTO public.business_english_modules (
  programme, title, slug, cefr_level, module_number, week_start, week_end, description
)
VALUES (
  'business_english',
  'Email & Professional Writing',
  'email-professional-writing',
  'B1',
  1,
  1,
  2,
  'Professional email skills for Gulf workplace contexts: tone, structure, requests, complaints, and business reporting at B1 level.'
)
ON CONFLICT (programme, slug) DO UPDATE SET
  title = EXCLUDED.title,
  cefr_level = EXCLUDED.cefr_level,
  module_number = EXCLUDED.module_number,
  week_start = EXCLUDED.week_start,
  week_end = EXCLUDED.week_end,
  description = EXCLUDED.description,
  updated_at = now();

DELETE FROM public.business_english_lessons
WHERE module_id = (
  SELECT id FROM public.business_english_modules
  WHERE programme = 'business_english' AND slug = 'email-professional-writing'
);

INSERT INTO public.business_english_lessons (
  module_id, title, description, duration_minutes, order_number, status
)
SELECT m.id, v.title, v.description, v.duration_minutes, v.order_number, v.status
FROM public.business_english_modules m
CROSS JOIN (
  VALUES
    (1, 'Formal vs Informal Tone', 'Register, formality levels, Gulf professional context', 45, 'available'),
    (2, 'Email Structure & Subject Lines', '4-part structure, subject line writing', 50, 'locked'),
    (3, 'Making Requests Politely', 'Modal verbs, politeness scale, follow-up emails', 45, 'locked'),
    (4, 'Complaint & Apology Emails', 'Complaint structure, apology language', 50, 'locked'),
    (5, 'Meeting Summaries & Progress Reports', 'STAR format, action points, minutes', 55, 'locked')
) AS v(order_number, title, description, duration_minutes, status)
WHERE m.programme = 'business_english' AND m.slug = 'email-professional-writing';

NOTIFY pgrst, 'reload schema';
