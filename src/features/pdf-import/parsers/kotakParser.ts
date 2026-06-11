import type { BankParser, ParseResult } from './types';
import type { ParsedTransaction, TransactionType } from '@/types/database.types';
import { parseDate, parseAmount, cleanDescription, generateFingerprint } from './utils';

const AMOUNT_RE = /\b(\d{1,3}(?:,\d{2,3})*\.\d{2})\b/g;

// Real transaction rows start with a sequential row number then a date.
// e.g. "1 01 Jun 2026 ..."  or  "23 04 Apr 2025 ..."
// This anchors parsing to actual table rows and skips ALL header/footer content.
const TXN_ROW_RE =
  /^(\d{1,3})\s+(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})\s+(.*)/i;

export const kotakParser: BankParser = {
  bankName: 'Kotak Mahindra Bank',

  canParse(text: string): boolean {
    const head = text.slice(0, 3000);
    return /kotak/i.test(head) || /\b811\b/.test(head) || /kmbl/i.test(head);
  },

  parse(text: string): ParseResult {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 1);
    const results: ParsedTransaction[] = [];

    let inTable = false;
    let runningBalance: number | null = null;
    let openingBalance: number | null = null;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // ── Stop at footer / end-of-statement sections ──────────────────────────
      // "Account Summary" section repeats the opening/closing balance and must
      // not be parsed as transactions. Same for the legal disclaimer footer.
      if (/^account summary\b|^important information\b|positive pay system/i.test(line)) break;

      // ── Detect start of the actual transaction table ─────────────────────────
      if (/savings account transactions/i.test(line)) {
        inTable = true;
        i++;
        continue;
      }

      if (!inTable) { i++; continue; }

      // ── Skip the column-header row ───────────────────────────────────────────
      if (/^#\s+date\s+desc/i.test(line)) { i++; continue; }

      // ── Extract opening balance to seed running-balance tracking ─────────────
      if (runningBalance === null && /opening balance/i.test(line)) {
        const obAmts = getAmounts(line);
        if (obAmts.length > 0) {
          runningBalance = obAmts[obAmts.length - 1].val;
        } else if (i + 1 < lines.length) {
          // Balance might be on the next cell/line if columns were split by pdfjs
          const nextAmts = getAmounts(lines[i + 1]);
          if (nextAmts.length > 0) {
            runningBalance = nextAmts[nextAmts.length - 1].val;
            i++;
          }
        }
        openingBalance = runningBalance;
        console.log(`[Kotak] opening balance: ${runningBalance}`);
        i++;
        continue;
      }

      // ── Match a transaction row ──────────────────────────────────────────────
      const rowMatch = line.match(TXN_ROW_RE);
      if (!rowMatch) { i++; continue; }

      const [, , dateStr, firstPart] = rowMatch;
      const date = parseDate(dateStr);
      if (!date) { i++; continue; }

      // Merge continuation lines until amounts appear.
      // (pdfjs sometimes wraps long descriptions onto the next line.)
      let body = firstPart;
      while (i + 1 < lines.length) {
        const next = lines[i + 1];
        if (TXN_ROW_RE.test(next)) break;                              // next row
        if (/account summary|important information/i.test(next)) break; // footer
        body += ' ' + next;
        i++;
        if (getAmounts(body).length > 0) break;                        // have amounts
      }

      const amts = getAmounts(body);
      if (amts.length === 0) { i++; continue; }

      // The LAST amount is always the running balance printed by the bank.
      // Comparing with the previous running balance gives us the exact
      // transaction direction and amount without any column-position guessing.
      const newBalance = amts[amts.length - 1].val;

      let txnAmount: number;
      let txType: TransactionType;

      if (runningBalance !== null) {
        const diff = newBalance - runningBalance;
        txnAmount = Math.abs(diff);
        txType = diff > 0 ? 'income' : 'expense';
      } else {
        // Opening balance not found — fall back to printed amount + Cr/Dr keyword
        txnAmount = amts[0].val;
        txType = /\bCr\b/i.test(body) ? 'income' : 'expense';
      }

      runningBalance = newBalance;

      if (txnAmount < 0.01 || txnAmount > 100_000_000) { i++; continue; }

      // Description = everything in the body before the first amount
      const descRaw = body.slice(0, amts[0].pos).trim();
      const description = cleanDescription(descRaw);
      if (!description || description.length < 3) { i++; continue; }

      // Override type to 'transfer' for known internal bank movements
      if (
        /\bto rd\b|\bfrom rd\b|recurring deposit|kotak811|\bfd\b|fixed deposit|sweep in|sweep out/i.test(
          description,
        )
      ) {
        txType = 'transfer';
      }

      results.push({
        date,
        description,
        amount: txnAmount,
        transaction_type: txType,
        fingerprint: generateFingerprint(date, txnAmount, description),
      });

      i++;
    }

    if (results.length > 0) {
      const cr = results.filter((t) => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0);
      const dr = results.filter((t) => t.transaction_type !== 'income').reduce((s, t) => s + t.amount, 0);
      console.log(
        `[Kotak] ${results.length} txns | credits: ${cr.toFixed(2)} | debits: ${dr.toFixed(2)} | closing: ${runningBalance?.toFixed(2)}`,
      );
    }

    return { transactions: results, openingBalance, closingBalance: runningBalance };
  },
};

function getAmounts(text: string): Array<{ val: number; pos: number }> {
  AMOUNT_RE.lastIndex = 0;
  const out: Array<{ val: number; pos: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = AMOUNT_RE.exec(text)) !== null) {
    const v = parseAmount(m[1]);
    if (v != null && v > 0) out.push({ val: v, pos: m.index });
  }
  return out;
}
