import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

export function formatCurrency(
  amount: number,
  symbol: string = '₹',
  compact = false
): string {
  if (compact) {
    if (amount >= 1_00_00_000) return `${symbol}${(amount / 1_00_00_000).toFixed(2)}Cr`;
    if (amount >= 1_00_000)    return `${symbol}${(amount / 1_00_000).toFixed(1)}L`;
    if (amount >= 1_000)       return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  }
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatTransactionDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'd MMM yyyy');
}

export function formatMonthYear(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM yyyy');
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM');
}

export function formatTimeAgo(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
}

export function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('en', { month: 'short' });
}
