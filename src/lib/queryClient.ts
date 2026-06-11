import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 minutes
      gcTime: 1000 * 60 * 10,          // 10 minutes
      retry: (failureCount, error) => {
        if ((error as { status?: number })?.status === 404) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Query key factories
export const queryKeys = {
  transactions: {
    all: ['transactions'] as const,
    list: (filters?: Record<string, unknown>) => ['transactions', 'list', filters] as const,
    detail: (id: string) => ['transactions', 'detail', id] as const,
    summary: (month: string) => ['transactions', 'summary', month] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: () => ['categories', 'list'] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
  },
  rules: {
    all: ['rules'] as const,
    list: () => ['rules', 'list'] as const,
  },
  statements: {
    all: ['statements'] as const,
    list: () => ['statements', 'list'] as const,
  },
  analytics: {
    monthly: (year: number) => ['analytics', 'monthly', year] as const,
    categories: (month: string) => ['analytics', 'categories', month] as const,
    yearly: (year: number) => ['analytics', 'yearly', year] as const,
  },
  user: {
    profile: () => ['user', 'profile'] as const,
  },
} as const;
