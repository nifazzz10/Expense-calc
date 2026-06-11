-- Add 'investment' as a valid transaction_type
-- Drop the existing check constraint (name may vary by project) and recreate it
DO $$
BEGIN
  -- Drop any existing check constraint on transaction_type
  ALTER TABLE public.transactions
    DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_transaction_type_check
  CHECK (transaction_type IN ('income', 'expense', 'transfer', 'investment'));
