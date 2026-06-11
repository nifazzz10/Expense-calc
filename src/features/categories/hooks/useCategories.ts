import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { categoryService } from './useCategoryService';
import { useAuthStore } from '@/store/authStore';
import type { CreateCategory, UpdateCategory } from '@/types/database.types';
import * as Haptics from 'expo-haptics';

export function useCategories() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => categoryService.getAll(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCategory() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategory) =>
      categoryService.create(userId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategory }) =>
      categoryService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  });
}

export function useMergeCategories() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: string; targetId: string }) =>
      categoryService.merge(userId!, sourceId, targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });
}
