-- Moyasar payment gate for IELTS Academic (Phase 1)
-- Run in Supabase SQL Editor or via scripts/applyPaymentMigration.js

ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_comped_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS checkout_track TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS moyasar_payment_id TEXT;

-- Preserve tier intent for users who registered before paywall
UPDATE users
SET checkout_track = accelerator_track
WHERE checkout_track IS NULL
  AND accelerator_track IS NOT NULL;

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  moyasar_payment_id TEXT NOT NULL UNIQUE,
  track TEXT NOT NULL,
  amount_halalas INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  status TEXT NOT NULL DEFAULT 'initiated',
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_transactions_student_id_idx
  ON payment_transactions (student_id);

NOTIFY pgrst, 'reload schema';
