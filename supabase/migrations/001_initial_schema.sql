-- ============================================================
-- EXPENSE TRACKER — INITIAL SCHEMA
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (profile extension on auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'INR',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  icon         TEXT NOT NULL DEFAULT 'apps',
  color        TEXT NOT NULL DEFAULT '#7C6FF7',
  type         TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'all')),
  is_system    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT categories_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_categories_type    ON public.categories(user_id, type);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount           NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  description      TEXT NOT NULL DEFAULT '',
  notes            TEXT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  transaction_date DATE NOT NULL,
  fingerprint      TEXT,
  source           TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'import')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id    ON public.transactions(user_id);
CREATE INDEX idx_transactions_date       ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category   ON public.transactions(user_id, category_id);
CREATE INDEX idx_transactions_type       ON public.transactions(user_id, transaction_type);
CREATE INDEX idx_transactions_fingerprint ON public.transactions(user_id, fingerprint) WHERE fingerprint IS NOT NULL;

-- ============================================================
-- RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  keyword     TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  priority    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT rules_user_keyword_unique UNIQUE (user_id, keyword)
);

CREATE INDEX idx_rules_user_id    ON public.rules(user_id);
CREATE INDEX idx_rules_keyword    ON public.rules(user_id, keyword);
CREATE INDEX idx_rules_category   ON public.rules(user_id, category_id);
CREATE INDEX idx_rules_enabled    ON public.rules(user_id, enabled);

-- ============================================================
-- STATEMENTS (PDF imports)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.statements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  bank_name     TEXT,
  imported_count  INTEGER NOT NULL DEFAULT 0,
  skipped_count   INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_statements_user_id ON public.statements(user_id);
CREATE INDEX idx_statements_uploaded ON public.statements(user_id, uploaded_at DESC);

-- ============================================================
-- STATEMENT TRANSACTIONS (link table)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.statement_transactions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statement_id   UUID NOT NULL REFERENCES public.statements(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,

  CONSTRAINT statement_transactions_unique UNIQUE (statement_id, transaction_id)
);

CREATE INDEX idx_stmt_txn_statement    ON public.statement_transactions(statement_id);
CREATE INDEX idx_stmt_txn_transaction  ON public.statement_transactions(transaction_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_rules_updated_at
  BEFORE UPDATE ON public.rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGN UP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DEFAULT CATEGORIES (seeded per new user via function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, icon, color, type, is_system, sort_order)
  VALUES
    (p_user_id, 'Food & Dining',   'restaurant',     '#FF7043', 'expense',  true, 1),
    (p_user_id, 'Groceries',       'cart',           '#FF8A65', 'expense',  true, 2),
    (p_user_id, 'Transportation',  'car',            '#42A5F5', 'expense',  true, 3),
    (p_user_id, 'Fuel',            'flash',          '#29B6F6', 'expense',  true, 4),
    (p_user_id, 'Shopping',        'bag',            '#AB47BC', 'expense',  true, 5),
    (p_user_id, 'Entertainment',   'film',           '#7E57C2', 'expense',  true, 6),
    (p_user_id, 'Subscriptions',   'tv',             '#5C6BC0', 'expense',  true, 7),
    (p_user_id, 'Rent',            'home',           '#EC407A', 'expense',  true, 8),
    (p_user_id, 'Utilities',       'flash',          '#FFA726', 'expense',  true, 9),
    (p_user_id, 'Medical',         'medical',        '#EF5350', 'expense',  true, 10),
    (p_user_id, 'Travel',          'airplane',       '#26C6DA', 'expense',  true, 11),
    (p_user_id, 'Education',       'school',         '#26A69A', 'expense',  true, 12),
    (p_user_id, 'Personal Care',   'person',         '#66BB6A', 'expense',  true, 13),
    (p_user_id, 'Insurance',       'shield-checkmark','78909C', 'expense',  true, 14),
    (p_user_id, 'Bank Charges',    'card',           '#8D6E63', 'expense',  true, 15),
    (p_user_id, 'Salary',          'briefcase',      '#00D4A8', 'income',   true, 1),
    (p_user_id, 'Freelance',       'laptop',         '#4FC3F7', 'income',   true, 2),
    (p_user_id, 'Investment',      'trending-up',    '#66BB6A', 'income',   true, 3),
    (p_user_id, 'Business',        'business',       '#FFA726', 'income',   true, 4),
    (p_user_id, 'Gift',            'gift',           '#F06292', 'income',   true, 5),
    (p_user_id, 'Other Income',    'cash',           '#78909C', 'income',   true, 6),
    (p_user_id, 'Transfer',        'swap-horizontal','FFB547',  'transfer', true, 1),
    (p_user_id, 'Other',           'apps',           '#78909C', 'all',      true, 99)
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default categories automatically when user profile is created
CREATE OR REPLACE FUNCTION public.handle_new_user_categories()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.seed_default_categories(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_on_user_profile_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_categories();

-- ============================================================
-- DEFAULT RULES (seeded per new user)
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_default_rules(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_food_id       UUID;
  v_grocery_id    UUID;
  v_fuel_id       UUID;
  v_salary_id     UUID;
  v_shopping_id   UUID;
  v_sub_id        UUID;
  v_travel_id     UUID;
  v_medical_id    UUID;
  v_transfer_id   UUID;
BEGIN
  SELECT id INTO v_food_id      FROM public.categories WHERE user_id = p_user_id AND name = 'Food & Dining'  LIMIT 1;
  SELECT id INTO v_grocery_id   FROM public.categories WHERE user_id = p_user_id AND name = 'Groceries'      LIMIT 1;
  SELECT id INTO v_fuel_id      FROM public.categories WHERE user_id = p_user_id AND name = 'Fuel'           LIMIT 1;
  SELECT id INTO v_salary_id    FROM public.categories WHERE user_id = p_user_id AND name = 'Salary'         LIMIT 1;
  SELECT id INTO v_shopping_id  FROM public.categories WHERE user_id = p_user_id AND name = 'Shopping'       LIMIT 1;
  SELECT id INTO v_sub_id       FROM public.categories WHERE user_id = p_user_id AND name = 'Subscriptions'  LIMIT 1;
  SELECT id INTO v_travel_id    FROM public.categories WHERE user_id = p_user_id AND name = 'Travel'         LIMIT 1;
  SELECT id INTO v_medical_id   FROM public.categories WHERE user_id = p_user_id AND name = 'Medical'        LIMIT 1;
  SELECT id INTO v_transfer_id  FROM public.categories WHERE user_id = p_user_id AND name = 'Transfer'       LIMIT 1;

  IF v_food_id IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'swiggy',      v_food_id,     10),
      (p_user_id, 'zomato',      v_food_id,     10),
      (p_user_id, 'dominos',     v_food_id,     10),
      (p_user_id, 'mcdonald',    v_food_id,     10),
      (p_user_id, 'kfc',         v_food_id,     10),
      (p_user_id, 'restaurant',  v_food_id,     5),
      (p_user_id, 'cafe',        v_food_id,     5),
      (p_user_id, 'hotel',       v_food_id,     3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  IF v_grocery_id IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'bigbasket',   v_grocery_id,  10),
      (p_user_id, 'grofers',     v_grocery_id,  10),
      (p_user_id, 'blinkit',     v_grocery_id,  10),
      (p_user_id, 'zepto',       v_grocery_id,  10),
      (p_user_id, 'grocery',     v_grocery_id,  5)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  IF v_fuel_id IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'petrol',      v_fuel_id,     10),
      (p_user_id, 'diesel',      v_fuel_id,     10),
      (p_user_id, 'fuel',        v_fuel_id,     10),
      (p_user_id, 'hp petro',    v_fuel_id,     10),
      (p_user_id, 'bharat petro',v_fuel_id,     10),
      (p_user_id, 'indian oil',  v_fuel_id,     10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  IF v_salary_id IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'salary',      v_salary_id,   10),
      (p_user_id, 'payroll',     v_salary_id,   10),
      (p_user_id, 'sal credit',  v_salary_id,   10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  IF v_shopping_id IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'amazon',      v_shopping_id, 10),
      (p_user_id, 'flipkart',    v_shopping_id, 10),
      (p_user_id, 'myntra',      v_shopping_id, 10),
      (p_user_id, 'ajio',        v_shopping_id, 10),
      (p_user_id, 'meesho',      v_shopping_id, 10),
      (p_user_id, 'shopping',    v_shopping_id, 3)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  IF v_sub_id IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'netflix',     v_sub_id,      10),
      (p_user_id, 'spotify',     v_sub_id,      10),
      (p_user_id, 'prime video', v_sub_id,      10),
      (p_user_id, 'hotstar',     v_sub_id,      10),
      (p_user_id, 'subscription',v_sub_id,      5)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  IF v_travel_id IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'ola',         v_travel_id,   10),
      (p_user_id, 'uber',        v_travel_id,   10),
      (p_user_id, 'rapido',      v_travel_id,   10),
      (p_user_id, 'irctc',       v_travel_id,   10),
      (p_user_id, 'makemytrip',  v_travel_id,   10),
      (p_user_id, 'goibibo',     v_travel_id,   10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  IF v_medical_id IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'pharmacy',    v_medical_id,  10),
      (p_user_id, 'hospital',    v_medical_id,  10),
      (p_user_id, 'clinic',      v_medical_id,  10),
      (p_user_id, 'medplus',     v_medical_id,  10),
      (p_user_id, 'apollo',      v_medical_id,  10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;

  IF v_transfer_id IS NOT NULL THEN
    INSERT INTO public.rules (user_id, keyword, category_id, priority) VALUES
      (p_user_id, 'transfer',    v_transfer_id, 5),
      (p_user_id, 'self transfer',v_transfer_id,10),
      (p_user_id, 'upi reversal',v_transfer_id, 10)
    ON CONFLICT (user_id, keyword) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default rules when categories are seeded
CREATE OR REPLACE FUNCTION public.handle_new_user_rules()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_system = TRUE THEN
    -- Only seed rules after all system categories are present
    -- This is triggered on each system category insert, so we check count
    PERFORM public.seed_default_rules(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VIEWS
-- ============================================================

-- Monthly summary view
CREATE OR REPLACE VIEW public.monthly_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', transaction_date)::DATE AS month,
  SUM(CASE WHEN transaction_type = 'income'   THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN transaction_type = 'expense'  THEN amount ELSE 0 END) AS total_expense,
  SUM(CASE WHEN transaction_type = 'income'   THEN amount
           WHEN transaction_type = 'expense'  THEN -amount
           ELSE 0 END)                                                 AS net_savings,
  COUNT(*)                                                             AS transaction_count
FROM public.transactions
WHERE transaction_type != 'transfer'
GROUP BY user_id, DATE_TRUNC('month', transaction_date);

-- Category spending view
CREATE OR REPLACE VIEW public.category_spending AS
SELECT
  t.user_id,
  t.category_id,
  c.name AS category_name,
  c.icon AS category_icon,
  c.color AS category_color,
  t.transaction_type,
  DATE_TRUNC('month', t.transaction_date)::DATE AS month,
  SUM(t.amount) AS total_amount,
  COUNT(*) AS transaction_count
FROM public.transactions t
LEFT JOIN public.categories c ON c.id = t.category_id
WHERE t.transaction_type != 'transfer'
GROUP BY t.user_id, t.category_id, c.name, c.icon, c.color, t.transaction_type, DATE_TRUNC('month', t.transaction_date);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statements             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statement_transactions ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_own_row" ON public.users
  FOR ALL USING (auth.uid() = id);

-- categories
CREATE POLICY "categories_own_rows" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- transactions
CREATE POLICY "transactions_own_rows" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- rules
CREATE POLICY "rules_own_rows" ON public.rules
  FOR ALL USING (auth.uid() = user_id);

-- statements
CREATE POLICY "statements_own_rows" ON public.statements
  FOR ALL USING (auth.uid() = user_id);

-- statement_transactions — accessible if the statement belongs to the user
CREATE POLICY "stmt_txn_own_rows" ON public.statement_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.statements s
      WHERE s.id = statement_id AND s.user_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKET (run this in Supabase dashboard or CLI)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('statements', 'statements', false);
-- CREATE POLICY "statements_storage_own" ON storage.objects FOR ALL USING (auth.uid()::text = (storage.foldername(name))[1]);
