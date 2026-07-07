-- Seed / promote the platform admin account.
--
-- Passwords are NOT stored in this repo. Seed the account with a real password
-- via the env-driven script instead:
--
--   DEMO_ADMIN_PASSWORD='<strong-password>' npm run seed:users
--
-- To rotate an existing admin password in any environment:
--
--   node scripts/rotate-demo-passwords.mjs admin@speakify.com
--
-- This file only ensures the row exists and has the admin role; it never sets
-- a password. Run after supabase/users_role_setup.sql.

UPDATE public.users
SET
  name = 'Speakify Admin',
  role = 'admin'
WHERE lower(email) = lower('admin@speakify.com');

NOTIFY pgrst, 'reload schema';
