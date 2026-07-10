CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  key TEXT PRIMARY KEY,
  called_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.api_rate_limits DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
