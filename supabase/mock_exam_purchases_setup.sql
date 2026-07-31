-- Per-mock IELTS Academic purchases (separate from Accelerator enrollment)
-- Run in Supabase SQL Editor or: node scripts/applyMockExamPurchasesMigration.js

-- Mock-only buyers vs full Accelerator enrollees
ALTER TABLE users ADD COLUMN IF NOT EXISTS purchase_intent TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_purchase_intent_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_purchase_intent_check
      CHECK (purchase_intent IS NULL OR purchase_intent IN ('accelerator', 'mock_only'));
  END IF;
END $$;

-- Extend payment_transactions for mock products (reuse Moyasar pipeline)
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'accelerator';
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS mock_numbers SMALLINT[];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_transactions_product_type_check'
  ) THEN
    ALTER TABLE payment_transactions
      ADD CONSTRAINT payment_transactions_product_type_check
      CHECK (product_type IN ('accelerator', 'mock_single', 'mock_pack3', 'mock_pack5'));
  END IF;
END $$;

-- Mock payments do not use accelerator track tiers
ALTER TABLE payment_transactions ALTER COLUMN track DROP NOT NULL;

CREATE INDEX IF NOT EXISTS payment_transactions_product_type_idx
  ON payment_transactions (product_type);

-- One row per mock unlocked for a student (idempotent grants via UNIQUE)
CREATE TABLE IF NOT EXISTS mock_exam_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mock_number SMALLINT NOT NULL CHECK (mock_number BETWEEN 1 AND 5),
  product_type TEXT NOT NULL CHECK (product_type IN ('single', 'pack3', 'pack5')),
  moyasar_payment_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, mock_number)
);

CREATE INDEX IF NOT EXISTS mock_exam_purchases_student_id_idx
  ON mock_exam_purchases (student_id);

CREATE INDEX IF NOT EXISTS mock_exam_purchases_payment_id_idx
  ON mock_exam_purchases (moyasar_payment_id);

NOTIFY pgrst, 'reload schema';
