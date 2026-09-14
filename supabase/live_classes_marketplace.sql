-- Marketplace fill, credits, and notification timestamps
-- Run: node scripts/applyLiveClassesMigration.js
-- (this file is applied after live_classes_setup.sql)

ALTER TABLE live_class_sessions
  ADD COLUMN IF NOT EXISTS fill_status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE live_class_sessions
  ADD COLUMN IF NOT EXISTS confirmed_notified_at TIMESTAMPTZ;
ALTER TABLE live_class_sessions
  ADD COLUMN IF NOT EXISTS completed_notified_at TIMESTAMPTZ;
ALTER TABLE live_class_sessions
  ADD COLUMN IF NOT EXISTS cancelled_notified_at TIMESTAMPTZ;

ALTER TABLE live_class_sessions DROP CONSTRAINT IF EXISTS live_class_sessions_status_check;
ALTER TABLE live_class_sessions
  ADD CONSTRAINT live_class_sessions_status_check
  CHECK (status IN ('scheduled', 'open', 'confirmed', 'completed', 'cancelled'));

ALTER TABLE live_class_sessions DROP CONSTRAINT IF EXISTS live_class_sessions_fill_status_check;
ALTER TABLE live_class_sessions
  ADD CONSTRAINT live_class_sessions_fill_status_check
  CHECK (fill_status IN ('open', 'confirmed', 'cancelled'));

UPDATE live_class_sessions
SET status = 'open'
WHERE status = 'scheduled';

ALTER TABLE live_class_bookings DROP CONSTRAINT IF EXISTS live_class_bookings_status_check;
ALTER TABLE live_class_bookings
  ADD CONSTRAINT live_class_bookings_status_check
  CHECK (status IN (
    'pending_payment',
    'pending_schedule',
    'reserved',
    'confirmed',
    'completed',
    'cancelled'
  ));

ALTER TABLE live_class_bookings DROP CONSTRAINT IF EXISTS live_class_bookings_billing_check;
ALTER TABLE live_class_bookings
  ADD CONSTRAINT live_class_bookings_billing_check
  CHECK (billing IN ('included', 'payg', 'credit'));

CREATE TABLE IF NOT EXISTS live_class_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_halalas INTEGER NOT NULL CHECK (amount_halalas > 0),
  remaining_halalas INTEGER NOT NULL CHECK (remaining_halalas >= 0),
  reason TEXT NOT NULL,
  session_id UUID,
  booking_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS live_class_credits_student_idx
  ON live_class_credits (student_id, remaining_halalas);

NOTIFY pgrst, 'reload schema';
