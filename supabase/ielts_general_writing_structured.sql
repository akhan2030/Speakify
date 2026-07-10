-- GT structured writing attempt detail columns
ALTER TABLE public.ielts_general_attempts
  ADD COLUMN IF NOT EXISTS task_type_detail text,
  ADD COLUMN IF NOT EXISTS ta_score numeric(3, 1),
  ADD COLUMN IF NOT EXISTS cc_score numeric(3, 1),
  ADD COLUMN IF NOT EXISTS lr_score numeric(3, 1),
  ADD COLUMN IF NOT EXISTS gra_score numeric(3, 1),
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS feedback jsonb,
  ADD COLUMN IF NOT EXISTS bullet_points_covered int,
  ADD COLUMN IF NOT EXISTS opening_correct boolean,
  ADD COLUMN IF NOT EXISTS signoff_correct boolean,
  ADD COLUMN IF NOT EXISTS register_accurate boolean;

NOTIFY pgrst, 'reload schema';
