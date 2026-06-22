-- ============================================================
-- FIX: Rules trigger was never created in migration 001.
-- Also expands seed_default_rules to cover all default
-- categories and includes common Indian merchant keywords.
-- Finally backfills rules for any existing users who missed it.
-- ============================================================

-- Drop old incomplete version and replace with comprehensive one
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
      (p_user_id, 'swiggy',          v_food, 10),
      (p_user_id, 'zomato',          v_food, 10),
      (p_user_id, 'eternal limited', v_food, 10),
      (p_user_id, 'dominos',         v_food, 10),
      (p_user_id, 'domino',          v_food, 10),
      (p_user_id, 'pizza hut',       v_food, 10),
      (p_user_id, 'mcdonald',        v_food, 10),
      (p_user_id, 'kfc',             v_food, 10),
      (p_user_id, 'burger king',     v_food, 10),
      (p_user_id, 'subway',          v_food, 10),
      (p_user_id, 'dunzo',           v_food, 10),
      (p_user_id, 'barbeque',        v_food, 10),
      (p_user_id, 'restaurant',      v_food,  5),
      (p_user_id, 'cafe',            v_food,  5),
      (p_user_id, 'hotel food',      v_food,  5),
      (p_user_id, 'tea stall',       v_food,  3),
      (p_user_id, 'canteen',         v_food,  3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── GROCERIES ──────────────────────────────────────────────
  IF v_grocery IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'bigbasket',        v_grocery, 10),
      (p_user_id, 'grofers',          v_grocery, 10),
      (p_user_id, 'blinkit',          v_grocery, 10),
      (p_user_id, 'zepto',            v_grocery, 10),
      (p_user_id, 'dunzo daily',      v_grocery, 10),
      (p_user_id, 'jiomart',          v_grocery, 10),
      (p_user_id, 'dmart',            v_grocery, 10),
      (p_user_id, 'reliance retail',  v_grocery,  8),
      (p_user_id, 'reliance fresh',   v_grocery,  8),
      (p_user_id, 'more supermarket', v_grocery,  8),
      (p_user_id, 'grocery',          v_grocery,  5),
      (p_user_id, 'supermarket',      v_grocery,  3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── TRANSPORTATION ─────────────────────────────────────────
  IF v_transport IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'ola',            v_transport, 10),
      (p_user_id, 'uber',           v_transport, 10),
      (p_user_id, 'rapido',         v_transport, 10),
      (p_user_id, 'auto',           v_transport,  3),
      (p_user_id, 'rickshaw',       v_transport,  3),
      (p_user_id, 'metro',          v_transport,  8),
      (p_user_id, 'bus pass',       v_transport,  8),
      (p_user_id, 'parivahan',      v_transport, 10),
      (p_user_id, 'echallan',       v_transport, 10),
      (p_user_id, 'challan',        v_transport,  8),
      (p_user_id, 'vehicle loan',   v_transport, 10),
      (p_user_id, 'car loan',       v_transport, 10),
      (p_user_id, 'bike loan',      v_transport, 10),
      (p_user_id, 'two wheeler',    v_transport,  8)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── FUEL ───────────────────────────────────────────────────
  IF v_fuel IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'petrol',         v_fuel, 10),
      (p_user_id, 'diesel',         v_fuel, 10),
      (p_user_id, 'fuel',           v_fuel, 10),
      (p_user_id, 'hp petro',       v_fuel, 10),
      (p_user_id, 'bharat petro',   v_fuel, 10),
      (p_user_id, 'indian oil',     v_fuel, 10),
      (p_user_id, 'iocl',           v_fuel, 10),
      (p_user_id, 'bpcl',           v_fuel, 10),
      (p_user_id, 'hpcl',           v_fuel, 10),
      (p_user_id, 'shell',          v_fuel,  8),
      (p_user_id, 'petrol bunk',    v_fuel,  8),
      (p_user_id, 'filling station',v_fuel,  8)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── SHOPPING ───────────────────────────────────────────────
  IF v_shopping IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'amazon',         v_shopping, 10),
      (p_user_id, 'flipkart',       v_shopping, 10),
      (p_user_id, 'myntra',         v_shopping, 10),
      (p_user_id, 'ajio',           v_shopping, 10),
      (p_user_id, 'meesho',         v_shopping, 10),
      (p_user_id, 'nykaa',          v_shopping, 10),
      (p_user_id, 'tatacliq',       v_shopping, 10),
      (p_user_id, 'snapdeal',       v_shopping, 10),
      (p_user_id, 'shopsy',         v_shopping, 10),
      (p_user_id, 'max retail',     v_shopping, 10),
      (p_user_id, 'westside',       v_shopping, 10),
      (p_user_id, 'zara',           v_shopping, 10),
      (p_user_id, 'h&m',            v_shopping, 10),
      (p_user_id, 'ikea',           v_shopping, 10),
      (p_user_id, 'croma',          v_shopping, 10),
      (p_user_id, 'vijay sales',    v_shopping, 10),
      (p_user_id, 'reliance digital',v_shopping, 10),
      (p_user_id, 'ekart',          v_shopping,  8),
      (p_user_id, 'shopping',       v_shopping,  3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── ENTERTAINMENT ──────────────────────────────────────────
  IF v_entertain IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'bookmyshow',     v_entertain, 10),
      (p_user_id, 'bms',            v_entertain, 10),
      (p_user_id, 'pvr',            v_entertain, 10),
      (p_user_id, 'inox',           v_entertain, 10),
      (p_user_id, 'cinepolis',      v_entertain, 10),
      (p_user_id, 'multiplex',      v_entertain,  8),
      (p_user_id, 'theatre',        v_entertain,  8),
      (p_user_id, 'cinema',         v_entertain,  8),
      (p_user_id, 'gaming',         v_entertain,  5),
      (p_user_id, 'steam',          v_entertain, 10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── SUBSCRIPTIONS ──────────────────────────────────────────
  IF v_sub IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'netflix',        v_sub, 10),
      (p_user_id, 'spotify',        v_sub, 10),
      (p_user_id, 'prime video',    v_sub, 10),
      (p_user_id, 'amazon prime',   v_sub, 10),
      (p_user_id, 'hotstar',        v_sub, 10),
      (p_user_id, 'disney',         v_sub, 10),
      (p_user_id, 'zee5',           v_sub, 10),
      (p_user_id, 'sonyliv',        v_sub, 10),
      (p_user_id, 'youtube premium',v_sub, 10),
      (p_user_id, 'apple',          v_sub,  8),
      (p_user_id, 'openai',         v_sub, 10),
      (p_user_id, 'chatgpt',        v_sub, 10),
      (p_user_id, 'google one',     v_sub, 10),
      (p_user_id, 'google india',   v_sub, 10),
      (p_user_id, 'microsoft',      v_sub,  8),
      (p_user_id, 'myjio',          v_sub, 10),
      (p_user_id, 'jio recharge',   v_sub, 10),
      (p_user_id, 'airtel',         v_sub, 10),
      (p_user_id, 'vi mobile',      v_sub, 10),
      (p_user_id, 'bsnl',           v_sub, 10),
      (p_user_id, 'recharge',       v_sub,  5),
      (p_user_id, 'subscription',   v_sub,  5),
      (p_user_id, 'freecharge',     v_sub,  8)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── RENT ───────────────────────────────────────────────────
  IF v_rent IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'rent',           v_rent, 10),
      (p_user_id, 'house rent',     v_rent, 10),
      (p_user_id, 'pg rent',        v_rent, 10),
      (p_user_id, 'hostel fee',     v_rent,  8),
      (p_user_id, 'maintenance',    v_rent,  5),
      (p_user_id, 'society',        v_rent,  5)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── UTILITIES ──────────────────────────────────────────────
  IF v_utilities IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'electricity',    v_utilities, 10),
      (p_user_id, 'bescom',         v_utilities, 10),
      (p_user_id, 'tneb',           v_utilities, 10),
      (p_user_id, 'msedcl',         v_utilities, 10),
      (p_user_id, 'water bill',     v_utilities, 10),
      (p_user_id, 'gas bill',       v_utilities, 10),
      (p_user_id, 'lpg',            v_utilities, 10),
      (p_user_id, 'indane',         v_utilities, 10),
      (p_user_id, 'hp gas',         v_utilities, 10),
      (p_user_id, 'broadband',      v_utilities, 10),
      (p_user_id, 'internet',       v_utilities,  5),
      (p_user_id, 'act fibernet',   v_utilities, 10),
      (p_user_id, 'jio fiber',      v_utilities, 10),
      (p_user_id, 'airtel fiber',   v_utilities, 10),
      (p_user_id, 'utility',        v_utilities,  3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── MEDICAL ────────────────────────────────────────────────
  IF v_medical IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'pharmacy',       v_medical, 10),
      (p_user_id, 'medplus',        v_medical, 10),
      (p_user_id, 'apollo pharmacy',v_medical, 10),
      (p_user_id, '1mg',            v_medical, 10),
      (p_user_id, 'netmeds',        v_medical, 10),
      (p_user_id, 'hospital',       v_medical, 10),
      (p_user_id, 'clinic',         v_medical, 10),
      (p_user_id, 'doctor',         v_medical,  8),
      (p_user_id, 'diagnostic',     v_medical,  8),
      (p_user_id, 'lab test',       v_medical,  8),
      (p_user_id, 'thyrocare',      v_medical, 10),
      (p_user_id, 'lal path',       v_medical, 10),
      (p_user_id, 'medical',        v_medical,  3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── TRAVEL ─────────────────────────────────────────────────
  IF v_travel IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'irctc',          v_travel, 10),
      (p_user_id, 'makemytrip',     v_travel, 10),
      (p_user_id, 'make my trip',   v_travel, 10),
      (p_user_id, 'goibibo',        v_travel, 10),
      (p_user_id, 'cleartrip',      v_travel, 10),
      (p_user_id, 'yatra',          v_travel, 10),
      (p_user_id, 'ixigo',          v_travel, 10),
      (p_user_id, 'air india',      v_travel, 10),
      (p_user_id, 'indigo',         v_travel, 10),
      (p_user_id, 'spicejet',       v_travel, 10),
      (p_user_id, 'vistara',        v_travel, 10),
      (p_user_id, 'flight',         v_travel,  5),
      (p_user_id, 'hotel booking',  v_travel,  8),
      (p_user_id, 'oyo',            v_travel, 10),
      (p_user_id, 'airbnb',         v_travel, 10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── EDUCATION ──────────────────────────────────────────────
  IF v_education IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'udemy',          v_education, 10),
      (p_user_id, 'coursera',       v_education, 10),
      (p_user_id, 'byju',           v_education, 10),
      (p_user_id, 'unacademy',      v_education, 10),
      (p_user_id, 'vedantu',        v_education, 10),
      (p_user_id, 'school fee',     v_education, 10),
      (p_user_id, 'college fee',    v_education, 10),
      (p_user_id, 'tuition',        v_education,  8),
      (p_user_id, 'book store',     v_education,  8),
      (p_user_id, 'stationery',     v_education,  5),
      (p_user_id, 'education',      v_education,  3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── PERSONAL CARE ──────────────────────────────────────────
  IF v_personal IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'salon',          v_personal, 10),
      (p_user_id, 'parlour',        v_personal, 10),
      (p_user_id, 'barber',         v_personal, 10),
      (p_user_id, 'spa',            v_personal, 10),
      (p_user_id, 'gym',            v_personal, 10),
      (p_user_id, 'fitness',        v_personal,  8),
      (p_user_id, 'cult fit',       v_personal, 10),
      (p_user_id, 'nykaa beauty',   v_personal,  8),
      (p_user_id, 'personal care',  v_personal,  3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── INSURANCE ──────────────────────────────────────────────
  IF v_insurance IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'lic',            v_insurance, 10),
      (p_user_id, 'hdfc life',      v_insurance, 10),
      (p_user_id, 'icici lombard',  v_insurance, 10),
      (p_user_id, 'star health',    v_insurance, 10),
      (p_user_id, 'bajaj allianz',  v_insurance, 10),
      (p_user_id, 'max life',       v_insurance, 10),
      (p_user_id, 'sbi life',       v_insurance, 10),
      (p_user_id, 'insurance',      v_insurance,  5),
      (p_user_id, 'premium due',    v_insurance,  8),
      (p_user_id, 'policy',         v_insurance,  3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── BANK CHARGES ───────────────────────────────────────────
  IF v_bank IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'bank charges',   v_bank, 10),
      (p_user_id, 'annual fee',     v_bank, 10),
      (p_user_id, 'card fee',       v_bank, 10),
      (p_user_id, 'sms charges',    v_bank, 10),
      (p_user_id, 'min balance',    v_bank, 10),
      (p_user_id, 'atm charges',    v_bank, 10),
      (p_user_id, 'processing fee', v_bank,  8),
      (p_user_id, 'late fee',       v_bank,  8),
      (p_user_id, 'emi bounce',     v_bank, 10),
      (p_user_id, 'gst charge',     v_bank,  5)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── SALARY ─────────────────────────────────────────────────
  IF v_salary IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'salary',         v_salary, 10),
      (p_user_id, 'payroll',        v_salary, 10),
      (p_user_id, 'sal credit',     v_salary, 10),
      (p_user_id, 'sal cr',         v_salary, 10),
      (p_user_id, 'monthly salary', v_salary, 10),
      (p_user_id, 'ctc',            v_salary,  8),
      (p_user_id, 'stipend',        v_salary,  8)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── FREELANCE ──────────────────────────────────────────────
  IF v_freelance IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'freelance',      v_freelance, 10),
      (p_user_id, 'upwork',         v_freelance, 10),
      (p_user_id, 'fiverr',         v_freelance, 10),
      (p_user_id, 'toptal',         v_freelance, 10),
      (p_user_id, 'razorpay',       v_freelance,  8),
      (p_user_id, 'payment received',v_freelance, 5),
      (p_user_id, 'consulting',     v_freelance,  5)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── INVESTMENT INCOME ──────────────────────────────────────
  IF v_invest_inc IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'dividend',       v_invest_inc, 10),
      (p_user_id, 'groww',          v_invest_inc, 10),
      (p_user_id, 'zerodha',        v_invest_inc, 10),
      (p_user_id, 'upstox',         v_invest_inc, 10),
      (p_user_id, 'kuvera',         v_invest_inc, 10),
      (p_user_id, 'mutual fund',    v_invest_inc,  8),
      (p_user_id, 'nse clearing',   v_invest_inc, 10),
      (p_user_id, 'iccl',           v_invest_inc,  8),
      (p_user_id, 'indian clearing',v_invest_inc,  8),
      (p_user_id, 'stock',          v_invest_inc,  3),
      (p_user_id, 'int.pd',         v_invest_inc, 10),
      (p_user_id, 'interest paid',  v_invest_inc,  8),
      (p_user_id, 'interest credit',v_invest_inc, 10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── BUSINESS INCOME ────────────────────────────────────────
  IF v_business IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'business income',v_business, 10),
      (p_user_id, 'invoice payment',v_business,  8),
      (p_user_id, 'gst refund',     v_business, 10),
      (p_user_id, 'tds refund',     v_business, 10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── OTHER INCOME ───────────────────────────────────────────
  IF v_other_inc IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'cashback',       v_other_inc, 10),
      (p_user_id, 'refund',         v_other_inc,  8),
      (p_user_id, 'reward',         v_other_inc,  8),
      (p_user_id, 'bonus',          v_other_inc,  8),
      (p_user_id, 'gift',           v_other_inc,  5)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  -- ── TRANSFER ───────────────────────────────────────────────
  IF v_transfer IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'transfer',       v_transfer,  5),
      (p_user_id, 'self transfer',  v_transfer, 10),
      (p_user_id, 'upi reversal',   v_transfer, 10),
      (p_user_id, 'neft',           v_transfer,  3),
      (p_user_id, 'rtgs',           v_transfer,  3),
      (p_user_id, 'imps',           v_transfer,  3),
      (p_user_id, 'rd booked',      v_transfer, 10),
      (p_user_id, 'iccl - mutual',  v_transfer, 10),
      (p_user_id, 'iccl-groww',     v_transfer, 10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- THE MISSING TRIGGER — attach handle_new_user_rules to categories
-- ============================================================
DROP TRIGGER IF EXISTS trg_on_category_created ON public.categories;

CREATE TRIGGER trg_on_category_created
  AFTER INSERT ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_rules();

-- ============================================================
-- BACKFILL: seed rules for any existing users who missed it
-- (safe — all inserts use ON CONFLICT DO NOTHING)
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
