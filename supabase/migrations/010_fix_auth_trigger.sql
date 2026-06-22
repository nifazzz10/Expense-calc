-- ============================================================
-- Fix the auth.users → public.users trigger.
-- The original trigger in 001 may have silently failed because
-- Supabase requires the function to be SECURITY DEFINER and
-- owned by postgres to write across schema boundaries.
-- ============================================================

-- Recreate the profile-creation function with explicit security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::TEXT)  -- fallback if email is null
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Ensure it's owned by postgres (required for cross-schema triggers in Supabase)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Drop old trigger if it exists, then recreate cleanly
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
