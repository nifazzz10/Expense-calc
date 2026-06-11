import type { BankParser, ParseResult } from './types';
import type { ParsedTransaction } from '@/types/database.types';
import { parseDate, parseAmount, inferType, cleanDescription, generateFingerprint } from './utils';

const LINE_DATE_RE =
  /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[\-\/](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\-\/]\d{4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i;

const AMT_RE = /\b(\d{1,3}(?:,\d{2,3})*\.\d{2})\b/g;

export const genericParser: BankParser = {
  bankName: 'Generic',
  canParse(_text: string): boolean { return true; },

  parse(text: string): ParseResult {
    const results: ParsedTransaction[] = [];
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    // Pre-scan: find opening balance to enable balance-direction Dr/Cr detection.
    // When available, comparing the running balance before and after each row is
    // 100% accurate — no Cr/Dr keyword guessing needed.
    let prevBalance: number | null = null;
    let openingBalance: number | null = null;
    for (const line of lines) {
      if (/opening balance/i.test(line) && !/account summary/i.test(line)) {
        AMT_RE.lastIndex = 0;
        const matches = [...line.matchAll(AMT_RE)];
        if (matches.length > 0) {
          const v = parseAmount(matches[matches.length - 1][1]);
          if (v) { prevBalance = v; openingBalance = v; break; }
        }
      }
    }

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const dateMatch = line.match(LINE_DATE_RE);
      if (!dateMatch) { i++; continue; }

      const date = parseDate(dateMatch[1]);
      if (!date) { i++; continue; }

      // Merge up to 2 continuation lines (wrapped descriptions)
      let body = line.slice(dateMatch[0].length).trim();
      for (let k = 1; k <= 2 && i + k < lines.length; k++) {
        const next = lines[i + k];
        if (next.match(LINE_DATE_RE)) break;
        body += ' ' + next;
        AMT_RE.lastIndex = 0;
        if (AMT_RE.test(body)) { AMT_RE.lastIndex = 0; i += k; break; }
        AMT_RE.lastIndex = 0;
      }

      // Collect all amounts in the body
      AMT_RE.lastIndex = 0;
      const amtHits: { val: number; idx: number }[] = [];
      let am: RegExpExecArray | null;
      while ((am = AMT_RE.exec(body)) !== null) {
        const v = parseAmount(am[1]);
        if (v && v > 0) amtHits.push({ val: v, idx: am.index });
      }
      if (amtHits.length === 0) { i++; continue; }

      // Description = everything before the first amount
      const descRaw = body.slice(0, amtHits[0].idx);
      const description = cleanDescription(descRaw);
      if (!description || description.length < 3) { i++; continue; }

      const afterDesc = body.slice(amtHits[0].idx);
      const hasCr = /\bCr\b/i.test(afterDesc);
      const hasDr = /\bDr\b/i.test(afterDesc);

      let amount: number;
      let txType: ReturnType<typeof inferType>;

      // ── Primary: balance direction (when opening balance was found) ──────────
      // The last amount on a row is the running balance. Diff from previous
      // balance gives direction and exact amount — no column guessing.
      if (prevBalance !== null && amtHits.length >= 2) {
        const newBalance = amtHits[amtHits.length - 1].val;
        const diff = newBalance - prevBalance;
        if (Math.abs(diff) < 0.01) { i++; continue; } // zero-diff / header row
        amount = Math.abs(diff);
        txType = diff > 0 ? 'income' : 'expense';
        prevBalance = newBalance;
      }

      // ── Fallback: column-count heuristics ───────────────────────────────────
      else if (amtHits.length >= 3) {
        const [a0, a1] = [amtHits[0].val, amtHits[1].val];
        if (hasCr) { amount = a1 || a0; txType = 'income'; }
        else if (hasDr) { amount = a0; txType = 'expense'; }
        else { amount = Math.min(a0, a1); txType = inferType(null, null, description); }
        if (prevBalance !== null) prevBalance = amtHits[amtHits.length - 1].val;
      } else if (amtHits.length === 2) {
        const [a0, a1] = [amtHits[0].val, amtHits[1].val];
        amount = a0 <= a1 ? a0 : a1;
        if (hasCr) txType = 'income';
        else if (hasDr) txType = 'expense';
        else txType = inferType(null, null, description);
        if (prevBalance !== null) prevBalance = amtHits[amtHits.length - 1].val;
      } else {
        amount = amtHits[0].val;
        if (hasCr) txType = 'income';
        else if (hasDr) txType = 'expense';
        else txType = inferType(null, null, description);
      }

      if (!amount || amount <= 0 || amount > 100_000_000) { i++; continue; }

      results.push({
        date,
        description,
        amount,
        transaction_type: txType,
        fingerprint: generateFingerprint(date, amount, description),
      });
      i++;
    }

    return { transactions: results, openingBalance, closingBalance: prevBalance };
  },
};
