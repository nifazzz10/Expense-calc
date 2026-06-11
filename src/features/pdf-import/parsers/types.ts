import type { ParsedTransaction } from '@/types/database.types';

export interface ParseResult {
  transactions: ParsedTransaction[];
  openingBalance: number | null;
  closingBalance: number | null;
}

export interface BankParser {
  bankName: string;
  canParse(text: string): boolean;
  parse(text: string): ParseResult;
}
