-- Local development test accounts only. Do NOT run against production.
--
-- Prefer the env-driven Node seeder, which bcrypt-hashes passwords and reads
-- demo/admin passwords from env vars:
--
--   npm run seed:users
--
-- The plain-text password below is a throwaway local-dev convenience and must
-- never be used for an account that exists in production.

INSERT INTO public.users (id, name, email, password, role)
VALUES (
  gen_random_uuid(),
  'Test Teacher',
  'teacher@test.com',
  '123456',
  'teacher'
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  name = EXCLUDED.name;
