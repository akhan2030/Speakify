-- Seed platform admin (bcrypt hash for Speakify2026!)
-- Run after supabase/users_role_setup.sql
-- Login: admin@speakify.com / Speakify2026!

UPDATE public.users
SET
  name = 'Speakify Admin',
  password = '$2b$10$EnxxxG55fnAmAu.KDeJ7xe65MN/IQcd1XEGn2TzeuYIUhpG7sx4c2',
  role = 'admin'
WHERE lower(email) = lower('admin@speakify.com');

INSERT INTO public.users (id, name, email, password, role)
SELECT
  gen_random_uuid(),
  'Speakify Admin',
  'admin@speakify.com',
  '$2b$10$EnxxxG55fnAmAu.KDeJ7xe65MN/IQcd1XEGn2TzeuYIUhpG7sx4c2',
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE lower(email) = lower('admin@speakify.com')
);

NOTIFY pgrst, 'reload schema';
