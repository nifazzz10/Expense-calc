import { supabase } from '@/lib/supabase';
import type { Category, CreateCategory, UpdateCategory } from '@/types/database.types';

export const categoryService = {
  async getAll(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Category[];
  },

  async create(userId: string, payload: CreateCategory): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  async update(id: string, payload: UpdateCategory): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async merge(userId: string, sourceCategoryId: string, targetCategoryId: string): Promise<void> {
    // Reassign all transactions from source to target
    const { error: txnError } = await supabase
      .from('transactions')
      .update({ category_id: targetCategoryId })
      .eq('user_id', userId)
      .eq('category_id', sourceCategoryId);

    if (txnError) throw txnError;

    // Reassign all rules from source to target
    const { error: ruleError } = await supabase
      .from('rules')
      .update({ category_id: targetCategoryId })
      .eq('user_id', userId)
      .eq('category_id', sourceCategoryId);

    if (ruleError) throw ruleError;

    // Delete the source category
    await categoryService.delete(sourceCategoryId);
  },

  async getTransactionCount(categoryId: string): Promise<number> {
    const { count, error } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (error) throw error;
    return count ?? 0;
  },
};
