import { supabase } from '@/lib/supabase';
import type {
  Transaction,
  CreateTransaction,
  UpdateTransaction,
} from '@/types/database.types';

const PAGE_SIZE = 30;

export interface TransactionFilters {
  search?: string;
  category_id?: string;
  transaction_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'date' | 'amount';
  sort_order?: 'asc' | 'desc';
  page?: number;
}

export const transactionService = {
  async getList(userId: string, filters: TransactionFilters = {}) {
    const {
      search,
      category_id,
      transaction_type,
      date_from,
      date_to,
      sort_by = 'date',
      sort_order = 'desc',
      page = 0,
    } = filters;

    let query = supabase
      .from('transactions')
      .select('*, category:categories(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order(sort_by === 'date' ? 'transaction_date' : 'amount', { ascending: sort_order === 'asc' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search) {
      query = query.ilike('description', `%${search}%`);
    }
    if (category_id) {
      query = query.eq('category_id', category_id);
    }
    if (transaction_type) {
      query = query.eq('transaction_type', transaction_type);
    }
    if (date_from) {
      query = query.gte('transaction_date', date_from);
    }
    if (date_to) {
      query = query.lte('transaction_date', date_to);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: (data ?? []) as Transaction[],
      total: count ?? 0,
      hasMore: (count ?? 0) > (page + 1) * PAGE_SIZE,
    };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Transaction;
  },

  async create(userId: string, payload: CreateTransaction) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...payload, user_id: userId })
      .select('*, category:categories(*)')
      .single();

    if (error) throw error;
    return data as Transaction;
  },

  async update(id: string, payload: UpdateTransaction) {
    const { data, error } = await supabase
      .from('transactions')
      .update(payload)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();

    if (error) throw error;
    return data as Transaction;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async bulkDelete(ids: string[]) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  async bulkCreate(userId: string, transactions: CreateTransaction[]) {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactions.map((t) => ({ ...t, user_id: userId })))
      .select('id, fingerprint');

    if (error) throw error;
    return data ?? [];
  },

  async checkFingerprints(userId: string, fingerprints: string[]) {
    const { data, error } = await supabase
      .from('transactions')
      .select('fingerprint')
      .eq('user_id', userId)
      .in('fingerprint', fingerprints);

    if (error) throw error;
    return new Set((data ?? []).map((t) => t.fingerprint as string));
  },

  async getMonthSummary(userId: string, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, transaction_type')
      .eq('user_id', userId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .neq('transaction_type', 'transfer')
      .neq('transaction_type', 'investment');

    if (error) throw error;

    const rows = data ?? [];
    const income = rows
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = rows
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { income, expense, savings: income - expense };
  },

  async getBalance(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, transaction_type')
      .eq('user_id', userId)
      .in('transaction_type', ['income', 'expense', 'investment']);

    if (error) throw error;

    const rows = data ?? [];
    const totalIncome = rows
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = rows
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalInvestment = rows
      .filter((t) => t.transaction_type === 'investment')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalIncome,
      totalExpense,
      totalInvestment,
      // Cash balance: income minus expenses and investments (invested money leaves your cash)
      balance: totalIncome - totalExpense - totalInvestment,
    };
  },

  async getByType(userId: string, type: string, limit = 20) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .eq('transaction_type', type)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as Transaction[];
  },

  async getRecent(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as Transaction[];
  },

  async reassignCategory(userId: string, oldCategoryId: string, newCategoryId: string) {
    const { error } = await supabase
      .from('transactions')
      .update({ category_id: newCategoryId })
      .eq('user_id', userId)
      .eq('category_id', oldCategoryId);

    if (error) throw error;
  },

  async getCategoryHistory(userId: string): Promise<Array<{ description: string; category_id: string }>> {
    const { data, error } = await supabase
      .from('transactions')
      .select('description, category_id')
      .eq('user_id', userId)
      .not('category_id', 'is', null)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    return (data ?? []) as Array<{ description: string; category_id: string }>;
  },
};
