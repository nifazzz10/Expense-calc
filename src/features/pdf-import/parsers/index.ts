import type { BankParser } from './types';
import type { ParsedTransaction } from '@/types/database.types';
import { kotakParser } from './kotakParser';
import { hdfcParser } from './hdfcParser';
import { genericParser } from './genericParser';

const parsers: BankParser[] = [kotakParser, hdfcParser];

export function detectAndParse(text: string): {
  bankName: string;
  transactions: ParsedTransaction[];
  openingBalance: number | null;
  closingBalance: number | null;
} {
  for (const parser of parsers) {
    if (parser.canParse(text)) {
      const result = parser.parse(text);
      if (result.transactions.length > 0) {
        return {
          bankName: parser.bankName,
          transactions: dedup(result.transactions),
          openingBalance: result.openingBalance,
          closingBalance: result.closingBalance,
        };
      }
    }
  }
  const result = genericParser.parse(text);
  return {
    bankName: genericParser.bankName,
    transactions: dedup(result.transactions),
    openingBalance: result.openingBalance,
    closingBalance: result.closingBalance,
  };
}

function dedup(txs: ParsedTransaction[]): ParsedTransaction[] {
  const seen = new Set<string>();
  return txs.filter((t) => {
    const key = contentKey(t.description, t.amount);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function contentKey(description: string, amount: number): string {
  const normalized = description
    .toLowerCase()
    .replace(/\b\d{8,}\b/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50);
  return `${normalized}|${amount.toFixed(2)}`;
}

export type { BankParser };
