import type { ParsedTransaction, TransactionType } from '@/types/database.types';

/** Generate a fingerprint from date + amount + description */
export function generateFingerprint(date: string, amount: number, description: string): string {
  const raw = `${date}|${amount.toFixed(2)}|${description.toLowerCase().trim()}`;
  // Simple hash function for fingerprinting
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `${Math.abs(hash).toString(36)}-${date}-${amount.toFixed(0)}`;
}

/** Parse common Indian date formats */
export function parseDate(raw: string): string | null {
  const cleaned = raw.trim();

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // YYYY-MM-DD (already ISO)
  const iso = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return cleaned;

  // DD MMM YYYY (e.g., 15 Jan 2024)
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const dmy2 = cleaned.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (dmy2) {
    const [, d, m, y] = dmy2;
    const mm = months[m.toLowerCase()];
    if (mm) return `${y}-${mm}-${d.padStart(2, '0')}`;
  }

  // DD-MMM-YYYY (e.g., 15-Jan-2024)
  const dmy3 = cleaned.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (dmy3) {
    const [, d, m, y] = dmy3;
    const mm = months[m.toLowerCase()];
    if (mm) return `${y}-${mm}-${d.padStart(2, '0')}`;
  }

  return null;
}

/** Parse amount from string, removing commas and currency symbols */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[,₹$€£\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/** Determine transaction type from debit/credit indicators */
export function inferType(
  debit: string | null,
  credit: string | null,
  description: string
): TransactionType {
  if (credit && parseAmount(credit)) return 'income';
  if (debit && parseAmount(debit)) return 'expense';

  const desc = description.toLowerCase();
  const creditKeywords = ['credited', 'credit', 'received', 'refund', 'reversal', 'cashback'];
  const debitKeywords = ['debited', 'debit', 'paid', 'payment', 'purchase', 'withdrawal'];

  if (creditKeywords.some((k) => desc.includes(k))) return 'income';
  if (debitKeywords.some((k) => desc.includes(k))) return 'expense';

  return 'expense';
}

/** Clean up a transaction description */
export function cleanDescription(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E]/g, ' ')
    .trim()
    .slice(0, 200);
}
