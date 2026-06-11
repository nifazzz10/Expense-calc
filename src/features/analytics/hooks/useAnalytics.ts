import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import type { MonthlySummary, CategorySpending } from '@/types/database.types';

export function useMonthlyAnalytics(year: number) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKeys.analytics.monthly(year),
    queryFn: async (): Promise<MonthlySummary[]> => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, transaction_type, transaction_date')
        .eq('user_id', userId!)
        .neq('transaction_type', 'transfer')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (error) throw error;

      const monthMap = new Map<string, MonthlySummary>();

      for (let m = 1; m <= 12; m++) {
        const key = `${year}-${String(m).padStart(2, '0')}-01`;
        monthMap.set(key, {
          month: key,
          total_income: 0,
          total_expense: 0,
          total_investment: 0,
          net_savings: 0,
          transaction_count: 0,
        });
      }

      for (const row of data ?? []) {
        const monthKey = row.transaction_date.slice(0, 7) + '-01';
        const entry = monthMap.get(monthKey);
        if (!entry) continue;

        entry.transaction_count++;
        if (row.transaction_type === 'income') {
          entry.total_income += Number(row.amount);
        } else if (row.transaction_type === 'investment') {
          entry.total_investment += Number(row.amount);
        } else if (row.transaction_type === 'expense') {
          entry.total_expense += Number(row.amount);
        }
        entry.net_savings = entry.total_income - entry.total_expense;
      }

      return Array.from(monthMap.values());
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCategoryAnalytics(year: number, month: number) {
  const userId = useAuthStore((s) => s.user?.id);
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  return useQuery({
    queryKey: queryKeys.analytics.categories(monthStr),
    queryFn: async (): Promise<CategorySpending[]> => {
      const startDate = `${monthStr}-01`;
      const daysInMonth = new Date(year, month, 0).getDate();
      const endDate = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, transaction_type, category_id, category:categories(name, icon, color)')
        .eq('user_id', userId!)
        .neq('transaction_type', 'transfer')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (error) throw error;

      const categoryMap = new Map<string, CategorySpending>();

      for (const row of data ?? []) {
        const catId = row.category_id ?? 'uncategorized';
        const cat = Array.isArray(row.category) ? row.category[0] : row.category;
        const key = `${catId}-${row.transaction_type}`;

        if (!categoryMap.has(key)) {
          categoryMap.set(key, {
            category_id: catId,
            category_name: cat?.name ?? 'Uncategorized',
            category_icon: cat?.icon ?? 'apps',
            category_color: cat?.color ?? '#78909C',
            transaction_type: row.transaction_type,
            month: monthStr,
            total_amount: 0,
            transaction_count: 0,
          });
        }

        const entry = categoryMap.get(key)!;
        entry.total_amount += Number(row.amount);
        entry.transaction_count++;
      }

      return Array.from(categoryMap.values()).sort((a, b) => b.total_amount - a.total_amount);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}
