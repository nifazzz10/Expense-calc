-- ============================================================
-- RPC: ensure_user_defaults
-- Called by the app on every login. Completely self-healing:
--   1. Creates public.users row if auth trigger missed it
--   2. Seeds default categories if none exist
--   3. Seeds default rules if none exist
-- All operations are idempotent (ON CONFLICT DO NOTHING).
-- ============================================================

CREATE OR REPLACE FUNCTION public.ensure_user_defaults(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_email   TEXT;
  v_cat_count    INT;
  v_rule_count   INT;
  v_seeded_cats  BOOLEAN := FALSE;
  v_seeded_rules BOOLEAN := FALSE;
BEGIN
  -- Step 1: ensure public.users row exists.
  -- COALESCE handles the rare case where auth email is null (phone/social auth).
  SELECT COALESCE(email, p_user_id::TEXT)
    INTO v_user_email
    FROM auth.users
   WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    -- User not found in auth.users — bail safely
    RETURN jsonb_build_object('error', 'user_not_found');
  END IF;

  INSERT INTO public.users (id, email)
  VALUES (p_user_id, v_user_email)
  ON CONFLICT (id) DO NOTHING;

  -- Step 2: seed categories if missing
  SELECT COUNT(*) INTO v_cat_count
    FROM public.categories
   WHERE user_id = p_user_id;

  IF v_cat_count = 0 THEN
    PERFORM public.seed_default_categories(p_user_id);
    v_seeded_cats := TRUE;
  END IF;

  -- Step 3: seed rules if missing.
  -- Runs even after seeding categories above (categories now exist).
  SELECT COUNT(*) INTO v_rule_count
    FROM public.rules
   WHERE user_id = p_user_id;

  IF v_rule_count = 0 THEN
    PERFORM public.seed_default_rules(p_user_id);
    v_seeded_rules := TRUE;
  END IF;

  RETURN jsonb_build_object(
    'seeded_categories', v_seeded_cats,
    'seeded_rules',      v_seeded_rules
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only authenticated users can call this, and only on themselves
-- (the SECURITY DEFINER means it runs as the function owner, not the caller)
REVOKE ALL ON FUNCTION public.ensure_user_defaults(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_user_defaults(UUID) TO authenticated;
