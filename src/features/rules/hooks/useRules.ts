import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { ruleService } from './useRuleService';
import { useAuthStore } from '@/store/authStore';
import type { CreateRule, UpdateRule } from '@/types/database.types';
import * as Haptics from 'expo-haptics';

export function useRules() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKeys.rules.list(),
    queryFn: () => ruleService.getAll(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateRule() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRule) => ruleService.create(userId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rules.all });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRule }) =>
      ruleService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rules.all });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ruleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rules.all });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  });
}

export function useToggleRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      ruleService.toggle(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rules.all });
    },
  });
}
