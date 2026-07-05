-- IELTS Academic tier purchased at registration (foundation | plus | elite)
ALTER TABLE users ADD COLUMN IF NOT EXISTS accelerator_track TEXT;

NOTIFY pgrst, 'reload schema';
