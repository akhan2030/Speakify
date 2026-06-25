-- Test accounts for local development (plain-text password matches lib/auth.ts)
-- Run in Supabase SQL Editor, or: npm run seed:users

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
