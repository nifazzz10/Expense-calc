import type { BankParser, ParseResult } from './types';
import type { ParsedTransaction } from '@/types/database.types';
import { parseDate, parseAmount, inferType, cleanDescription, generateFingerprint } from './utils';

export const hdfcParser: BankParser = {
  bankName: 'HDFC Bank',

  canParse(text: string): boolean {
    return /HDFC\s*BANK/i.test(text) || /hdfc/i.test(text.slice(0, 500));
  },

  parse(text: string): ParseResult {
    const results: ParsedTransaction[] = [];

    // Pre-scan for opening balance line
    let openingBalance: number | null = null;
    const obMatch = text.match(/opening\s+balance[^\d]*([\d,]+\.\d{2})/i);
    if (obMatch) {
      openingBalance = parseAmount(obMatch[1]) ?? null;
    }

    // HDFC format: Date | Narration | Chq/Ref No. | Value Date | Withdrawal | Deposit | Closing Bal
    const rowPattern =
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+(.+?)\s+(\S+)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+([\d,\.]+)?\s+([\d,\.]+)?\s+([\d,\.]+)/g;

    let closingBalance: number | null = null;
    let match: RegExpExecArray | null;
    while ((match = rowPattern.exec(text)) !== null) {
      const [, rawDate, narration, , , withdrawal, deposit, closingRaw] = match;

      const date = parseDate(rawDate);
      if (!date) continue;

      const description = cleanDescription(narration);
      const debitAmt = parseAmount(withdrawal ?? '');
      const creditAmt = parseAmount(deposit ?? '');
      const amount = creditAmt ?? debitAmt;
      if (!amount || amount <= 0) continue;

      const transactionType = inferType(
        withdrawal ?? null,
        deposit ?? null,
        description
      );

      const rowClosing = parseAmount(closingRaw ?? '');
      if (rowClosing) closingBalance = rowClosing;

      results.push({
        date,
        description,
        amount,
        transaction_type: transactionType,
        fingerprint: generateFingerprint(date, amount, description),
      });
    }

    return { transactions: results, openingBalance, closingBalance };
  },
};
