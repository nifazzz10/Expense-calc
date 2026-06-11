-- Add opening/closing balance to statements for reconciliation
ALTER TABLE public.statements
  ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS closing_balance NUMERIC(15, 2);

-- Add starting_balance to users — one-time anchor to sync app balance with bank
-- Defaults to 0 (no change to existing behaviour until user sets it)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS starting_balance NUMERIC(15, 2) NOT NULL DEFAULT 0;
