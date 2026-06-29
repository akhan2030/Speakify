-- Remap legacy invalid CEFR sub-levels to official Speakify vocabulary levels.
-- Does NOT remap C2.1 / C2.2 (official vocabulary levels).
-- Run in Supabase SQL Editor after deploying vocabulary level updates.

UPDATE public.vocabulary_words SET cefr_level = 'A1.2' WHERE cefr_level IN ('A1.3', 'A1.4');
UPDATE public.vocabulary_words SET cefr_level = 'A2.2' WHERE cefr_level IN ('A2.3', 'A2.4');

UPDATE public.student_vocab_progress SET cefr_level = 'A1.2' WHERE cefr_level IN ('A1.3', 'A1.4');
UPDATE public.student_vocab_progress SET cefr_level = 'A2.2' WHERE cefr_level IN ('A2.3', 'A2.4');

NOTIFY pgrst, 'reload schema';
