-- Add prompt_id to writing_attempts for prompt variety tracking — run in Supabase SQL Editor

alter table public.writing_attempts
  add column if not exists prompt_id text;

create index if not exists idx_writing_attempts_student_prompt
  on public.writing_attempts (student_id, task_type, prompt_id);

notify pgrst, 'reload schema';
