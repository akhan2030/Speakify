-- Live classes: orientation + per-course topic allotments, bookings, Moyasar PAYG
-- Run: node scripts/applyLiveClassesMigration.js
-- or paste into the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS live_class_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('orientation', 'topic')),
  course_key TEXT NOT NULL,
  included_count INTEGER NOT NULL DEFAULT 0 CHECK (included_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, kind, course_key)
);

CREATE INDEX IF NOT EXISTS live_class_entitlements_student_idx
  ON live_class_entitlements (student_id);

CREATE TABLE IF NOT EXISTS live_class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type TEXT NOT NULL CHECK (session_type IN ('orientation', 'topic_group', 'one_to_one')),
  starts_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  capacity INTEGER NOT NULL CHECK (capacity >= 1),
  recording_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS live_class_sessions_starts_idx
  ON live_class_sessions (starts_at);

CREATE TABLE IF NOT EXISTS live_class_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES live_class_sessions(id) ON DELETE SET NULL,
  course_key TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('orientation', 'topic_group', 'one_to_one')),
  starts_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  billing TEXT NOT NULL CHECK (billing IN ('included', 'payg')),
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('pending_payment', 'pending_schedule', 'confirmed', 'completed', 'cancelled')),
  moyasar_payment_id TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS live_class_bookings_student_idx
  ON live_class_bookings (student_id, status);

CREATE INDEX IF NOT EXISTS live_class_bookings_session_idx
  ON live_class_bookings (session_id);

CREATE UNIQUE INDEX IF NOT EXISTS live_class_bookings_payment_idx
  ON live_class_bookings (moyasar_payment_id)
  WHERE moyasar_payment_id IS NOT NULL;

ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_product_type_check;
ALTER TABLE payment_transactions
  ADD CONSTRAINT payment_transactions_product_type_check
  CHECK (product_type IN (
    'accelerator',
    'mock_single',
    'mock_pack3',
    'mock_pack5',
    'live_group',
    'live_1to1'
  ));

NOTIFY pgrst, 'reload schema';
