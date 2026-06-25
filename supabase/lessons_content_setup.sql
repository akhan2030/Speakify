-- Pathway lesson AI-generated content cache (shared per lesson slot)

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS content jsonb DEFAULT NULL;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS content_generated_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_lessons_unit_day
  ON public.lessons (unit_id, day_type);

NOTIFY pgrst, 'reload schema';
