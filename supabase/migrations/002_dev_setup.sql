-- ============================================================
-- DEV SETUP — run this in Supabase SQL editor for local dev
-- DO NOT run in production
-- ============================================================

-- 1. Drop FK constraint so a fake dev user can be inserted
--    without a matching row in auth.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 2. Insert dev user
INSERT INTO public.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'dev@example.com')
ON CONFLICT DO NOTHING;

-- 3. Seed default categories and rules for dev user
SELECT public.seed_default_categories('00000000-0000-0000-0000-000000000001');
SELECT public.seed_default_rules('00000000-0000-0000-0000-000000000001');

-- 4. Disable RLS on all tables
--    (anon key has no JWT so RLS blocks everything without a real session)
ALTER TABLE public.users                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.statements             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.statement_transactions DISABLE ROW LEVEL SECURITY;
