import { create } from 'zustand';
import type { CurrencyCode } from '@/theme';
import { CURRENCIES } from '@/theme';

interface SettingsState {
  currency: CurrencyCode;
  currencySymbol: string;
  theme: 'dark' | 'light';
  setCurrency: (currency: CurrencyCode) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currency: 'INR',
  currencySymbol: '₹',
  theme: 'dark',

  setCurrency: (currency) => {
    const found = CURRENCIES.find((c) => c.code === currency);
    set({ currency, currencySymbol: found?.symbol ?? '₹' });
  },

  setTheme: (theme) => set({ theme }),
}));

// Helper: format amount with currency symbol
export function formatAmount(
  amount: number,
  symbol: string = '₹',
  opts?: { compact?: boolean; sign?: boolean }
): string {
  const sign = opts?.sign && amount > 0 ? '+' : '';
  if (opts?.compact) {
    if (amount >= 1_00_00_000) return `${sign}${symbol}${(amount / 1_00_00_000).toFixed(2)}Cr`;
    if (amount >= 1_00_000)    return `${sign}${symbol}${(amount / 1_00_000).toFixed(1)}L`;
    if (amount >= 1_000)       return `${sign}${symbol}${(amount / 1_000).toFixed(1)}K`;
  }
  return `${sign}${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
