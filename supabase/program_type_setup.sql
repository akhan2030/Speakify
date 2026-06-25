-- Student program type: pathway (English Pathway) or ielts (IELTS Accelerator)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS program_type text DEFAULT 'ielts';

UPDATE public.users
SET program_type = 'ielts'
WHERE program_type IS NULL;

NOTIFY pgrst, 'reload schema';
