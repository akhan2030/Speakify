-- Action 5 launch setup (run once in Supabase SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS / IF NOT EXISTS columns

-- 1. Rate limiting
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  key TEXT PRIMARY KEY,
  called_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.api_rate_limits DISABLE ROW LEVEL SECURITY;

-- 2. Password reset tokens
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  method TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
ALTER TABLE public.password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- 3. GT writing scoring columns
ALTER TABLE public.ielts_general_attempts
  ADD COLUMN IF NOT EXISTS ta_score DECIMAL(3,1),
  ADD COLUMN IF NOT EXISTS cc_score DECIMAL(3,1),
  ADD COLUMN IF NOT EXISTS lr_score DECIMAL(3,1),
  ADD COLUMN IF NOT EXISTS gra_score DECIMAL(3,1),
  ADD COLUMN IF NOT EXISTS opening_correct BOOLEAN,
  ADD COLUMN IF NOT EXISTS signoff_correct BOOLEAN,
  ADD COLUMN IF NOT EXISTS register_accurate BOOLEAN,
  ADD COLUMN IF NOT EXISTS bullet_points_covered INTEGER;

-- 4. Speaking sessions patch
ALTER TABLE public.speaking_sessions
  ADD COLUMN IF NOT EXISTS speaking_time_seconds INTEGER DEFAULT 0;

NOTIFY pgrst, 'reload schema';
