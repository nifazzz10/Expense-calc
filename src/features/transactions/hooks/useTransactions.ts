import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { transactionService, type TransactionFilters } from '../services/transactionService';
import { useAuthStore } from '@/store/authStore';
import type { CreateTransaction, UpdateTransaction } from '@/types/database.types';
import * as Haptics from 'expo-haptics';

export function useTransactionList(filters: TransactionFilters = {}) {
  const userId = useAuthStore((s) => s.user?.id);

  return useInfiniteQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: ({ pageParam = 0 }) =>
      transactionService.getList(userId!, { ...filters, page: pageParam as number }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length : undefined,
    initialPageParam: 0,
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}

export function useRecentTransactions(limit = 10) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: [...queryKeys.transactions.all, 'recent', limit],
    queryFn: () => transactionService.getRecent(userId!, limit),
    enabled: !!userId,
  });
}

export function useMonthSummary(year: number, month: number) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKeys.transactions.summary(`${year}-${month}`),
    queryFn: () => transactionService.getMonthSummary(userId!, year, month),
    enabled: !!userId,
  });
}

export function useBalance() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: [...queryKeys.transactions.all, 'balance'],
    queryFn: () => transactionService.getBalance(userId!),
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}

export function useCreateTransaction() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTransaction) =>
      transactionService.create(userId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTransaction }) =>
      transactionService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  });
}

export function useDeleteTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => transactionService.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });
}

export function useInvestmentTransactions(limit = 20) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: [...queryKeys.transactions.all, 'investments', limit],
    queryFn: () => transactionService.getByType(userId!, 'investment', limit),
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}

export function useSetStartingBalance() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => transactionService.setStartingBalance(userId!, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.transactions.all, 'balance'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });
}
