export type TransactionType = 'income' | 'expense' | 'transfer' | 'investment';
export type CategoryType = 'income' | 'expense' | 'transfer' | 'investment' | 'all';
export type StatementStatus = 'processing' | 'completed' | 'failed';
export type TransactionSource = 'manual' | 'import';

export interface User {
  id: string;
  email: string;
  currency: string;
  starting_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  description: string;
  notes: string | null;
  transaction_type: TransactionType;
  transaction_date: string;
  fingerprint: string | null;
  source: TransactionSource;
  created_at: string;
  updated_at: string;
  // Joined
  category?: Category | null;
}

export interface Rule {
  id: string;
  user_id: string;
  keyword: string;
  category_id: string;
  enabled: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  // Joined
  category?: Category;
}

export interface Statement {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  bank_name: string | null;
  imported_count: number;
  skipped_count: number;
  status: StatementStatus;
  error_message: string | null;
  opening_balance: number | null;
  closing_balance: number | null;
  uploaded_at: string;
}

export interface StatementTransaction {
  id: string;
  statement_id: string;
  transaction_id: string;
}

// DTO types for creating / updating
export type CreateTransaction = Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category'>;
export type UpdateTransaction = Partial<CreateTransaction>;

export type CreateCategory = Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateCategory = Partial<CreateCategory>;

export type CreateRule = Omit<Rule, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category'>;
export type UpdateRule = Partial<CreateRule>;

// Analytics types
export interface MonthlySummary {
  month: string;
  total_income: number;
  total_expense: number;
  total_investment: number;
  net_savings: number;
  transaction_count: number;
}

export interface CategorySpending {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  transaction_type: TransactionType;
  month: string;
  total_amount: number;
  transaction_count: number;
}

// PDF Import types
export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  transaction_type: TransactionType;
  fingerprint: string;
  suggested_category_id?: string | null;
}

export interface ImportPreview {
  parsed: ParsedTransaction[];
  duplicates: ParsedTransaction[];
  toImport: ParsedTransaction[];
  bankName: string | null;
  openingBalance: number | null;
  closingBalance: number | null;
}
