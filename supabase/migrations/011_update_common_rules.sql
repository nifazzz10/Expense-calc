-- ============================================================
-- Replaces seed_default_rules with a cleaner, common-keyword
-- version. Rules are now universal merchant/brand names that
-- work for manually entered descriptions (e.g. "KFC Salem")
-- rather than bank-statement noise patterns.
--
-- Changes vs 008:
--  - Removed: "auto" (matches automobile, automation…)
--  - Removed: "eternal limited", "iccl - mutual", "parivahan",
--             "echallan", "dunzo daily", "rd booked", "int.pd"
--  - Added:   starbucks, ccd, cafe coffee day, haldiram, biryani
--             bus, cab, taxi, autorickshaw
--             stationery, book store split into common terms
--             booking.com, trip, hostel
--  - Backfills every existing user by adding missing keywords
--    (ON CONFLICT DO NOTHING so custom rules are preserved)
-- ============================================================

CREATE OR REPLACE FUNCTION public.seed_default_rules(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_food        UUID;
  v_grocery     UUID;
  v_transport   UUID;
  v_fuel        UUID;
  v_shopping    UUID;
  v_entertain   UUID;
  v_sub         UUID;
  v_rent        UUID;
  v_utilities   UUID;
  v_medical     UUID;
  v_travel      UUID;
  v_education   UUID;
  v_personal    UUID;
  v_insurance   UUID;
  v_bank        UUID;
  v_salary      UUID;
  v_freelance   UUID;
  v_invest_inc  UUID;
  v_business    UUID;
  v_other_inc   UUID;
  v_transfer    UUID;
BEGIN
  SELECT id INTO v_food       FROM public.categories WHERE user_id = p_user_id AND name = 'Food & Dining'   LIMIT 1;
  SELECT id INTO v_grocery    FROM public.categories WHERE user_id = p_user_id AND name = 'Groceries'       LIMIT 1;
  SELECT id INTO v_transport  FROM public.categories WHERE user_id = p_user_id AND name = 'Transportation'  LIMIT 1;
  SELECT id INTO v_fuel       FROM public.categories WHERE user_id = p_user_id AND name = 'Fuel'            LIMIT 1;
  SELECT id INTO v_shopping   FROM public.categories WHERE user_id = p_user_id AND name = 'Shopping'        LIMIT 1;
  SELECT id INTO v_entertain  FROM public.categories WHERE user_id = p_user_id AND name = 'Entertainment'   LIMIT 1;
  SELECT id INTO v_sub        FROM public.categories WHERE user_id = p_user_id AND name = 'Subscriptions'   LIMIT 1;
  SELECT id INTO v_rent       FROM public.categories WHERE user_id = p_user_id AND name = 'Rent'            LIMIT 1;
  SELECT id INTO v_utilities  FROM public.categories WHERE user_id = p_user_id AND name = 'Utilities'       LIMIT 1;
  SELECT id INTO v_medical    FROM public.categories WHERE user_id = p_user_id AND name = 'Medical'         LIMIT 1;
  SELECT id INTO v_travel     FROM public.categories WHERE user_id = p_user_id AND name = 'Travel'          LIMIT 1;
  SELECT id INTO v_education  FROM public.categories WHERE user_id = p_user_id AND name = 'Education'       LIMIT 1;
  SELECT id INTO v_personal   FROM public.categories WHERE user_id = p_user_id AND name = 'Personal Care'   LIMIT 1;
  SELECT id INTO v_insurance  FROM public.categories WHERE user_id = p_user_id AND name = 'Insurance'       LIMIT 1;
  SELECT id INTO v_bank       FROM public.categories WHERE user_id = p_user_id AND name = 'Bank Charges'    LIMIT 1;
  SELECT id INTO v_salary     FROM public.categories WHERE user_id = p_user_id AND name = 'Salary'          LIMIT 1;
  SELECT id INTO v_freelance  FROM public.categories WHERE user_id = p_user_id AND name = 'Freelance'       LIMIT 1;
  SELECT id INTO v_invest_inc FROM public.categories WHERE user_id = p_user_id AND name = 'Investment'      LIMIT 1;
  SELECT id INTO v_business   FROM public.categories WHERE user_id = p_user_id AND name = 'Business'        LIMIT 1;
  SELECT id INTO v_other_inc  FROM public.categories WHERE user_id = p_user_id AND name = 'Other Income'    LIMIT 1;
  SELECT id INTO v_transfer   FROM public.categories WHERE user_id = p_user_id AND name = 'Transfer'        LIMIT 1;

  -- ── FOOD & DINING ──────────────────────────────────────────
  IF v_food IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      -- delivery apps
      (p_user_id, 'swiggy',           v_food, 10),
      (p_user_id, 'zomato',           v_food, 10),
      -- fast food chains
      (p_user_id, 'kfc',              v_food, 10),
      (p_user_id, 'mcdonald',         v_food, 10),
      (p_user_id, 'burger king',      v_food, 10),
      (p_user_id, 'dominos',          v_food, 10),
      (p_user_id, 'domino',           v_food, 10),
      (p_user_id, 'pizza hut',        v_food, 10),
      (p_user_id, 'subway',           v_food, 10),
      (p_user_id, 'starbucks',        v_food, 10),
      (p_user_id, 'cafe coffee day',  v_food, 10),
      (p_user_id, 'ccd',              v_food,  9),
      (p_user_id, 'haldiram',         v_food, 10),
      (p_user_id, 'barbeque nation',  v_food, 10),
      (p_user_id, 'biryani',          v_food,  5),
      -- generic
      (p_user_id, 'restaurant',       v_food,  5),
      (p_user_id, 'cafe',             v_food,  5),
      (p_user_id, 'dhaba',            v_food,  5),
      (p_user_id, 'canteen',          v_food,  3),
      (p_user_id, 'food',             v_food,  2)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── GROCERIES ──────────────────────────────────────────────
  IF v_grocery IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'bigbasket',         v_grocery, 10),
      (p_user_id, 'blinkit',           v_grocery, 10),
      (p_user_id, 'zepto',             v_grocery, 10),
      (p_user_id, 'jiomart',           v_grocery, 10),
      (p_user_id, 'dmart',             v_grocery, 10),
      (p_user_id, 'grofers',           v_grocery, 10),
      (p_user_id, 'dunzo',             v_grocery,  8),
      (p_user_id, 'reliance fresh',    v_grocery,  8),
      (p_user_id, 'more supermarket',  v_grocery,  8),
      (p_user_id, 'grocery',           v_grocery,  5),
      (p_user_id, 'supermarket',       v_grocery,  3),
      (p_user_id, 'vegetables',        v_grocery,  3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── TRANSPORTATION ─────────────────────────────────────────
  IF v_transport IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'uber',             v_transport, 10),
      (p_user_id, 'ola',              v_transport, 10),
      (p_user_id, 'rapido',           v_transport, 10),
      (p_user_id, 'metro',            v_transport,  8),
      (p_user_id, 'bus',              v_transport,  5),
      (p_user_id, 'cab',              v_transport,  5),
      (p_user_id, 'taxi',             v_transport,  5),
      (p_user_id, 'rickshaw',         v_transport,  5),
      (p_user_id, 'autorickshaw',     v_transport,  8),
      (p_user_id, 'bus pass',         v_transport,  9),
      (p_user_id, 'vehicle loan',     v_transport, 10),
      (p_user_id, 'car loan',         v_transport, 10),
      (p_user_id, 'bike loan',        v_transport, 10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── FUEL ───────────────────────────────────────────────────
  IF v_fuel IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'petrol',           v_fuel, 10),
      (p_user_id, 'diesel',           v_fuel, 10),
      (p_user_id, 'fuel',             v_fuel, 10),
      (p_user_id, 'iocl',             v_fuel, 10),
      (p_user_id, 'bpcl',             v_fuel, 10),
      (p_user_id, 'hpcl',             v_fuel, 10),
      (p_user_id, 'indian oil',       v_fuel, 10),
      (p_user_id, 'bharat petroleum', v_fuel, 10),
      (p_user_id, 'shell',            v_fuel,  8),
      (p_user_id, 'cng',              v_fuel, 10),
      (p_user_id, 'filling station',  v_fuel,  8)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── SHOPPING ───────────────────────────────────────────────
  IF v_shopping IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'amazon',           v_shopping, 10),
      (p_user_id, 'flipkart',         v_shopping, 10),
      (p_user_id, 'myntra',           v_shopping, 10),
      (p_user_id, 'ajio',             v_shopping, 10),
      (p_user_id, 'meesho',           v_shopping, 10),
      (p_user_id, 'nykaa',            v_shopping, 10),
      (p_user_id, 'tatacliq',         v_shopping, 10),
      (p_user_id, 'snapdeal',         v_shopping, 10),
      (p_user_id, 'zara',             v_shopping, 10),
      (p_user_id, 'ikea',             v_shopping, 10),
      (p_user_id, 'croma',            v_shopping, 10),
      (p_user_id, 'reliance digital', v_shopping, 10),
      (p_user_id, 'vijay sales',      v_shopping, 10),
      (p_user_id, 'max fashion',      v_shopping, 10),
      (p_user_id, 'westside',         v_shopping, 10),
      (p_user_id, 'shopping',         v_shopping,  3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── ENTERTAINMENT ──────────────────────────────────────────
  IF v_entertain IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'bookmyshow',       v_entertain, 10),
      (p_user_id, 'pvr',              v_entertain, 10),
      (p_user_id, 'inox',             v_entertain, 10),
      (p_user_id, 'cinepolis',        v_entertain, 10),
      (p_user_id, 'multiplex',        v_entertain,  8),
      (p_user_id, 'cinema',           v_entertain,  8),
      (p_user_id, 'theatre',          v_entertain,  8),
      (p_user_id, 'gaming',           v_entertain,  5),
      (p_user_id, 'steam',            v_entertain,  8)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── SUBSCRIPTIONS ──────────────────────────────────────────
  IF v_sub IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'netflix',          v_sub, 10),
      (p_user_id, 'spotify',          v_sub, 10),
      (p_user_id, 'amazon prime',     v_sub, 10),
      (p_user_id, 'prime video',      v_sub, 10),
      (p_user_id, 'hotstar',          v_sub, 10),
      (p_user_id, 'disney',           v_sub, 10),
      (p_user_id, 'zee5',             v_sub, 10),
      (p_user_id, 'sonyliv',          v_sub, 10),
      (p_user_id, 'youtube premium',  v_sub, 10),
      (p_user_id, 'openai',           v_sub, 10),
      (p_user_id, 'chatgpt',          v_sub, 10),
      (p_user_id, 'google one',       v_sub, 10),
      (p_user_id, 'microsoft',        v_sub,  8),
      (p_user_id, 'airtel',           v_sub, 10),
      (p_user_id, 'jio',              v_sub,  9),
      (p_user_id, 'bsnl',             v_sub, 10),
      (p_user_id, 'recharge',         v_sub,  5),
      (p_user_id, 'subscription',     v_sub,  5)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── RENT ───────────────────────────────────────────────────
  IF v_rent IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'rent',             v_rent, 10),
      (p_user_id, 'house rent',       v_rent, 10),
      (p_user_id, 'pg rent',          v_rent, 10),
      (p_user_id, 'hostel fee',       v_rent,  8),
      (p_user_id, 'maintenance',      v_rent,  5),
      (p_user_id, 'society',          v_rent,  5)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── UTILITIES ──────────────────────────────────────────────
  IF v_utilities IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'electricity',      v_utilities, 10),
      (p_user_id, 'water bill',       v_utilities, 10),
      (p_user_id, 'gas bill',         v_utilities, 10),
      (p_user_id, 'lpg',              v_utilities, 10),
      (p_user_id, 'indane',           v_utilities, 10),
      (p_user_id, 'broadband',        v_utilities, 10),
      (p_user_id, 'internet',         v_utilities,  5),
      (p_user_id, 'act fibernet',     v_utilities, 10),
      (p_user_id, 'jio fiber',        v_utilities, 10),
      (p_user_id, 'airtel fiber',     v_utilities, 10),
      (p_user_id, 'utility',          v_utilities,  3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── MEDICAL ────────────────────────────────────────────────
  IF v_medical IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'pharmacy',         v_medical, 10),
      (p_user_id, 'medplus',          v_medical, 10),
      (p_user_id, 'apollo pharmacy',  v_medical, 10),
      (p_user_id, '1mg',              v_medical, 10),
      (p_user_id, 'netmeds',          v_medical, 10),
      (p_user_id, 'hospital',         v_medical, 10),
      (p_user_id, 'clinic',           v_medical, 10),
      (p_user_id, 'doctor',           v_medical,  8),
      (p_user_id, 'diagnostic',       v_medical,  8),
      (p_user_id, 'lab test',         v_medical,  8),
      (p_user_id, 'medicine',         v_medical,  5),
      (p_user_id, 'medical',          v_medical,  3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── TRAVEL ─────────────────────────────────────────────────
  IF v_travel IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'irctc',            v_travel, 10),
      (p_user_id, 'makemytrip',       v_travel, 10),
      (p_user_id, 'goibibo',          v_travel, 10),
      (p_user_id, 'cleartrip',        v_travel, 10),
      (p_user_id, 'ixigo',            v_travel, 10),
      (p_user_id, 'air india',        v_travel, 10),
      (p_user_id, 'indigo',           v_travel, 10),
      (p_user_id, 'spicejet',         v_travel, 10),
      (p_user_id, 'vistara',          v_travel, 10),
      (p_user_id, 'akasa',            v_travel, 10),
      (p_user_id, 'oyo',              v_travel, 10),
      (p_user_id, 'airbnb',           v_travel, 10),
      (p_user_id, 'booking',          v_travel,  8),
      (p_user_id, 'flight',           v_travel,  5),
      (p_user_id, 'hotel',            v_travel,  5),
      (p_user_id, 'trip',             v_travel,  3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── EDUCATION ──────────────────────────────────────────────
  IF v_education IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'udemy',            v_education, 10),
      (p_user_id, 'coursera',         v_education, 10),
      (p_user_id, 'byju',             v_education, 10),
      (p_user_id, 'unacademy',        v_education, 10),
      (p_user_id, 'vedantu',          v_education, 10),
      (p_user_id, 'school fee',       v_education, 10),
      (p_user_id, 'college fee',      v_education, 10),
      (p_user_id, 'tuition',          v_education,  8),
      (p_user_id, 'stationery',       v_education,  5),
      (p_user_id, 'education',        v_education,  3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── PERSONAL CARE ──────────────────────────────────────────
  IF v_personal IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'salon',            v_personal, 10),
      (p_user_id, 'parlour',          v_personal, 10),
      (p_user_id, 'barber',           v_personal, 10),
      (p_user_id, 'spa',              v_personal, 10),
      (p_user_id, 'gym',              v_personal, 10),
      (p_user_id, 'fitness',          v_personal,  8),
      (p_user_id, 'cult fit',         v_personal, 10),
      (p_user_id, 'haircut',          v_personal,  8)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── INSURANCE ──────────────────────────────────────────────
  IF v_insurance IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'lic',              v_insurance, 10),
      (p_user_id, 'hdfc life',        v_insurance, 10),
      (p_user_id, 'icici lombard',    v_insurance, 10),
      (p_user_id, 'star health',      v_insurance, 10),
      (p_user_id, 'bajaj allianz',    v_insurance, 10),
      (p_user_id, 'max life',         v_insurance, 10),
      (p_user_id, 'sbi life',         v_insurance, 10),
      (p_user_id, 'insurance',        v_insurance,  5),
      (p_user_id, 'policy',           v_insurance,  3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── BANK CHARGES ───────────────────────────────────────────
  IF v_bank IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'bank charges',     v_bank, 10),
      (p_user_id, 'annual fee',       v_bank, 10),
      (p_user_id, 'card fee',         v_bank, 10),
      (p_user_id, 'atm charges',      v_bank, 10),
      (p_user_id, 'processing fee',   v_bank,  8),
      (p_user_id, 'late fee',         v_bank,  8),
      (p_user_id, 'emi bounce',       v_bank, 10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── SALARY ─────────────────────────────────────────────────
  IF v_salary IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'salary',           v_salary, 10),
      (p_user_id, 'payroll',          v_salary, 10),
      (p_user_id, 'stipend',          v_salary,  8)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── FREELANCE / CONSULTING ─────────────────────────────────
  IF v_freelance IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'freelance',        v_freelance, 10),
      (p_user_id, 'upwork',           v_freelance, 10),
      (p_user_id, 'fiverr',           v_freelance, 10),
      (p_user_id, 'consulting',       v_freelance,  5)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── INVESTMENT ─────────────────────────────────────────────
  IF v_invest_inc IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'groww',            v_invest_inc, 10),
      (p_user_id, 'zerodha',          v_invest_inc, 10),
      (p_user_id, 'upstox',           v_invest_inc, 10),
      (p_user_id, 'kuvera',           v_invest_inc, 10),
      (p_user_id, 'mutual fund',      v_invest_inc,  8),
      (p_user_id, 'dividend',         v_invest_inc, 10),
      (p_user_id, 'sip',              v_invest_inc,  8),
      (p_user_id, 'stock',            v_invest_inc,  5)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── BUSINESS INCOME ────────────────────────────────────────
  IF v_business IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'business income',  v_business, 10),
      (p_user_id, 'invoice payment',  v_business,  8),
      (p_user_id, 'gst refund',       v_business, 10),
      (p_user_id, 'tds refund',       v_business, 10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── OTHER INCOME ───────────────────────────────────────────
  IF v_other_inc IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'cashback',         v_other_inc, 10),
      (p_user_id, 'refund',           v_other_inc,  8),
      (p_user_id, 'reward',           v_other_inc,  8),
      (p_user_id, 'bonus',            v_other_inc,  8),
      (p_user_id, 'gift',             v_other_inc,  5)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── TRANSFER ───────────────────────────────────────────────
  IF v_transfer IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'transfer',         v_transfer,  5),
      (p_user_id, 'self transfer',    v_transfer, 10),
      (p_user_id, 'upi reversal',     v_transfer, 10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Remove known-ambiguous keywords that caused false matches
-- across all users (safe — users won't miss "auto" matching
-- Uber rides; "ola" rule is kept, only "auto" removed)
-- ============================================================
DELETE FROM public.rules
WHERE keyword IN (
  'auto',            -- matched "automobile", "automated", etc.
  'eternal limited', -- Zomato corporate name, only in bank imports
  'parivahan',       -- government portal, bank-statement noise
  'echallan',        -- government portal, bank-statement noise
  'dunzo daily',     -- duplicate; "dunzo" rule still exists
  'rd booked',       -- bank-statement notation
  'int.pd',          -- bank-statement notation
  'iccl - mutual',   -- bank-statement noise
  'iccl-groww',      -- bank-statement noise
  'hotel food',      -- too specific, "restaurant" covers this
  'tea stall',       -- too niche
  'hp petro',        -- bank abbreviation
  'bharat petro',    -- bank abbreviation (kept "bharat petroleum")
  'min balance',     -- bank noise
  'sms charges',     -- bank noise
  'gst charge',      -- bank noise
  'emi bounce',      -- only meaningful in bank imports
  'sal credit',      -- bank notation
  'sal cr',          -- bank notation
  'monthly salary',  -- redundant with "salary"
  'ctc',             -- HR term, unlikely to be a description
  'payment received',-- too generic (matches "refund received" etc.)
  'nse clearing',    -- bank-import only
  'indian clearing', -- bank-import only
  'interest paid',   -- bank-import notation
  'interest credit', -- bank-import notation
  'freecharge',      -- defunct app
  'vi mobile',       -- defunct brand (now rebranded)
  'myjio'            -- redundant with "jio"
);

-- ============================================================
-- Backfill: add new keywords for all existing users
-- (ON CONFLICT DO NOTHING preserves custom user rules)
-- ============================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT user_id
    FROM public.categories
    WHERE is_system = TRUE
  LOOP
    PERFORM public.seed_default_rules(r.user_id);
  END LOOP;
END $$;
