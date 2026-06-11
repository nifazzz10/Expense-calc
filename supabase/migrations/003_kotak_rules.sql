-- ============================================================
-- KOTAK STATEMENT KEYWORD RULES
-- Run AFTER 001 + 002. Adds rules so PDF import auto-categorizes
-- all merchants seen in the Kotak statement (Apr 2025 – Mar 2026).
-- ============================================================

DO $$
DECLARE
  uid          UUID := '00000000-0000-0000-0000-000000000001';

  -- expense categories
  v_food       UUID;
  v_grocery    UUID;
  v_transport  UUID;
  v_fuel       UUID;
  v_shopping   UUID;
  v_entertain  UUID;
  v_sub        UUID;
  v_medical    UUID;
  v_insurance  UUID;
  v_travel     UUID;
  v_education  UUID;
  v_bank       UUID;

  -- income categories
  v_freelance  UUID;
  v_invest_inc UUID;
  v_other_inc  UUID;

  -- transfer
  v_transfer   UUID;

BEGIN
  SELECT id INTO v_food       FROM categories WHERE user_id = uid AND name = 'Food & Dining'  LIMIT 1;
  SELECT id INTO v_grocery    FROM categories WHERE user_id = uid AND name = 'Groceries'      LIMIT 1;
  SELECT id INTO v_transport  FROM categories WHERE user_id = uid AND name = 'Transportation' LIMIT 1;
  SELECT id INTO v_fuel       FROM categories WHERE user_id = uid AND name = 'Fuel'           LIMIT 1;
  SELECT id INTO v_shopping   FROM categories WHERE user_id = uid AND name = 'Shopping'       LIMIT 1;
  SELECT id INTO v_entertain  FROM categories WHERE user_id = uid AND name = 'Entertainment'  LIMIT 1;
  SELECT id INTO v_sub        FROM categories WHERE user_id = uid AND name = 'Subscriptions'  LIMIT 1;
  SELECT id INTO v_medical    FROM categories WHERE user_id = uid AND name = 'Medical'        LIMIT 1;
  SELECT id INTO v_insurance  FROM categories WHERE user_id = uid AND name = 'Insurance'      LIMIT 1;
  SELECT id INTO v_travel     FROM categories WHERE user_id = uid AND name = 'Travel'         LIMIT 1;
  SELECT id INTO v_education  FROM categories WHERE user_id = uid AND name = 'Education'      LIMIT 1;
  SELECT id INTO v_bank       FROM categories WHERE user_id = uid AND name = 'Bank Charges'   LIMIT 1;
  SELECT id INTO v_freelance  FROM categories WHERE user_id = uid AND name = 'Freelance'      LIMIT 1;
  SELECT id INTO v_invest_inc FROM categories WHERE user_id = uid AND name = 'Investment'     LIMIT 1;
  SELECT id INTO v_other_inc  FROM categories WHERE user_id = uid AND name = 'Other Income'   LIMIT 1;
  SELECT id INTO v_transfer   FROM categories WHERE user_id = uid AND name = 'Transfer'       LIMIT 1;

  -- ── FOOD & DINING ──────────────────────────────────────────
  IF v_food IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      -- Swiggy parent company (ETERNAL LIMITED)
      (uid, 'eternal limited',   v_food, 10),
      -- Barbeque Nation
      (uid, 'barbequeen',        v_food, 10),
      -- Local Salem restaurants
      (uid, 'sree guhan',        v_food, 10),
      (uid, 'nonvee foods',      v_food, 10),
      (uid, 'merry berry',       v_food, 10),
      (uid, 'shafi mutton',      v_food, 10),
      (uid, 'renuka mess',       v_food, 10),
      (uid, 'smart point sal',   v_food, 10),
      (uid, 'chennai cakes',     v_food,  8),
      (uid, 'sathish cakes',     v_food,  8),
      (uid, 'brown fening',      v_food,  8),  -- Brown Fenny restaurant
      (uid, 'suprrme hotel',     v_food, 10),
      (uid, 'lakshmi hotels',    v_food, 10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── GROCERIES ──────────────────────────────────────────────
  IF v_grocery IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      -- Recurring monthly provision store
      (uid, 'mohan enterprises',   v_grocery, 10),
      (uid, 'anita enterprises',   v_grocery, 10),
      (uid, 'sellers hypermarket', v_grocery, 10),
      (uid, 'reliance retail',     v_grocery,  8)  -- Reliance Smart / Fresh
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── SHOPPING ───────────────────────────────────────────────
  IF v_shopping IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      (uid, 'headphone zone',  v_shopping, 10),
      (uid, 'mohans shoppy',   v_shopping, 10),  -- clothing store Tirupur
      (uid, 'max retail',      v_shopping, 10),  -- Max Fashion
      (uid, 'domesc',          v_shopping,  8),
      (uid, 'caratLane',       v_shopping, 10),  -- jewellery
      (uid, 'smi battery',     v_shopping, 10),
      (uid, 'ekart',           v_shopping,  8),  -- Flipkart delivery/return
      (uid, 'bookmyshow',      v_entertain,10)   -- placed here to keep insert clean
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── ENTERTAINMENT ──────────────────────────────────────────
  IF v_entertain IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      (uid, 'bms',         v_entertain, 10)  -- BookMyShow short form
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── FUEL ───────────────────────────────────────────────────
  IF v_fuel IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      (uid, 'sakthi fuels',   v_fuel, 10),
      (uid, 'pcm petroleum',  v_fuel, 10),  -- ADHOC PCM PETROLEUM
      (uid, 'madalaimuthu',   v_fuel, 10)   -- P MADALAIMUTHU AND SON (petrol bunk)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── TRANSPORTATION ─────────────────────────────────────────
  IF v_transport IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      (uid, 'bajaj auto cons',  v_transport, 10),  -- vehicle loan EMI
      (uid, 'romans seat',      v_transport, 10),  -- car seat covers / accessories
      (uid, 'parivahan',        v_transport, 10),  -- road tax / vehicle services
      (uid, 'echallan',         v_transport, 10),  -- traffic fine
      (uid, 'challan',          v_transport,  8)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── SUBSCRIPTIONS ──────────────────────────────────────────
  IF v_sub IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      (uid, 'myjio',           v_sub, 10),
      (uid, 'jio',             v_sub,  8),
      (uid, 'openai',          v_sub, 10),  -- ChatGPT
      (uid, 'google india',    v_sub, 10),  -- Google One / Workspace
      (uid, 'vyapar',          v_sub, 10),  -- billing software
      (uid, 'facebook india',  v_sub,  8),  -- Meta ads / subscription
      (uid, 'freecharge',      v_sub,  8)   -- mobile recharge
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── MEDICAL ────────────────────────────────────────────────
  IF v_medical IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      (uid, 'shruthi pharmacy', v_medical, 10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── INSURANCE ──────────────────────────────────────────────
  IF v_insurance IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      (uid, 'icici lombard', v_insurance, 10)  -- vehicle / health insurance
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── TRAVEL ─────────────────────────────────────────────────
  IF v_travel IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      (uid, 'make my trip',   v_travel, 10),  -- MakeMyTrip flight/hotel
      (uid, 'makemytrip',     v_travel, 10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── EDUCATION ──────────────────────────────────────────────
  IF v_education IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      (uid, 'nopaperforms',           v_education, 10),  -- college admission platform
      (uid, 'tamil nadu engineering', v_education, 10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── BANK CHARGES ───────────────────────────────────────────
  IF v_bank IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      (uid, '811 super program fee', v_bank, 10),  -- Kotak 811 annual fee
      (uid, 'bank charges',          v_bank,  5),
      (uid, 'tbms',                  v_bank,  8)   -- Kotak bank charge ref prefix
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── FREELANCE INCOME ───────────────────────────────────────
  IF v_freelance IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      (uid, 'arun ramamoorth',         v_freelance, 10),  -- confirmed freelance client
      (uid, 'nextbillion technology',  v_freelance, 10),  -- NEFT income from employer
      (uid, 'moitechnol',              v_freelance, 10),  -- MOI Technology payment
      (uid, 'moi technology',          v_freelance, 10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── INVESTMENT RETURNS (income) ────────────────────────────
  IF v_invest_inc IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      (uid, 'groww invest tech',       v_invest_inc, 10),  -- Groww dividend NEFT
      (uid, 'gr0ww invest',            v_invest_inc, 10),  -- alternate spelling in NEFT
      (uid, 'indian clearing',         v_invest_inc,  8)   -- ICCL settlement credit
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── OTHER INCOME ───────────────────────────────────────────
  IF v_other_inc IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      (uid, '811 super cashback', v_other_inc, 10),  -- Kotak 811 monthly cashback
      (uid, 'cashback earned',    v_other_inc, 10),
      (uid, 'onbf',               v_other_inc,  5),  -- Kotak cashback ref prefix
      (uid, 'int.pd',             v_other_inc, 10),  -- savings account interest
      (uid, 'interest paid',      v_other_inc,  8)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── TRANSFER ───────────────────────────────────────────────
  -- Mutual fund SIPs, RD installments, self-transfers, investment platform
  IF v_transfer IS NOT NULL THEN
    INSERT INTO rules (user_id, keyword, category_id, priority) VALUES
      (uid, 'iccl - mutual',     v_transfer, 10),  -- SIP autopay
      (uid, 'iccl-groww',        v_transfer, 10),  -- Groww demat purchase
      (uid, 'groww invest te',   v_transfer, 10),  -- Groww UPIIntent purchase
      (uid, 'rd booked',         v_transfer, 10),  -- Recurring Deposit booking
      (uid, 'kotak811',          v_transfer,  8),  -- Kotak 811 → RD sweep
      (uid, 'nextbillion tec',   v_transfer, 10),  -- investment platform payment
      (uid, 'ac xfr',            v_transfer, 10),  -- internal GL account transfer
      (uid, 'utiitsl',           v_transfer,  8)   -- UTI LTCF SIP
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

END $$;
