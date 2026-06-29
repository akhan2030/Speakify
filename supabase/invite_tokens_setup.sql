-- Teacher invite tokens for admin-sent registration links
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.invite_tokens (
  token text PRIMARY KEY,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invite_tokens_email_idx ON public.invite_tokens (email);
CREATE INDEX IF NOT EXISTS invite_tokens_expires_at_idx ON public.invite_tokens (expires_at);

COMMENT ON TABLE public.invite_tokens IS 'One-time teacher registration invite links';

NOTIFY pgrst, 'reload schema';
