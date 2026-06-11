import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
// Importing the worker entry bundles it into the JS thread (no Web Worker in RN)
import 'pdfjs-dist/legacy/build/pdf.worker.entry';
import { supabase } from '@/lib/supabase';
import { transactionService } from '@/features/transactions/services/transactionService';
import { ruleService } from '@/features/rules/hooks/useRuleService';
import { detectAndParse } from '../parsers';
import type { ImportPreview, ParsedTransaction, Rule } from '@/types/database.types';

export type ImportStep =
  | 'idle'
  | 'picking'
  | 'parsing'
  | 'preview'
  | 'importing'
  | 'done'
  | 'error';

interface ImportState {
  step: ImportStep;
  preview: ImportPreview | null;
  error: string | null;
  result: { imported: number; skipped: number } | null;
}

export function usePdfImport(userId: string, rules: Rule[]) {
  const [state, setState] = useState<ImportState>({
    step: 'idle',
    preview: null,
    error: null,
    result: null,
  });

  const reset = useCallback(() => {
    setState({ step: 'idle', preview: null, error: null, result: null });
  }, []);

  const pickAndParse = useCallback(async () => {
    setState((s) => ({ ...s, step: 'picking', error: null }));

    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (picked.canceled || !picked.assets?.[0]) {
        setState((s) => ({ ...s, step: 'idle' }));
        return;
      }

      const file = picked.assets[0];
      setState((s) => ({ ...s, step: 'parsing' }));

      console.log('[PDF] reading file:', file.name, '— size:', file.size, 'bytes');
      const t0 = Date.now();
      const fileContent = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('[PDF] file read done in', Date.now() - t0, 'ms — base64 length:', fileContent.length);

      const text = await extractTextFromPdf(fileContent);
      console.log('[PDF] extracted text length:', text.length);
      console.log('[PDF] first 800 chars:\n', text.slice(0, 800));

      const { bankName, transactions: parsed, openingBalance, closingBalance } = detectAndParse(text);
      console.log('[PDF] bank detected:', bankName);
      console.log('[PDF] transactions parsed:', parsed.length);
      parsed.forEach((t, i) =>
        console.log(`[PDF]  [${i}] ${t.date} | ${t.transaction_type} | ${t.amount} | ${t.description}`)
      );

      if (parsed.length === 0) {
        setState((s) => ({
          ...s,
          step: 'error',
          error:
            'Could not extract transactions from this PDF. ' +
            'Make sure it is a text-based (not scanned) bank statement.',
        }));
        return;
      }

      // Step 1: apply explicit rules
      const withRules: ParsedTransaction[] = parsed.map((t) => ({
        ...t,
        suggested_category_id: ruleService.applyRules(t.description, rules),
      }));

      // Step 2: for anything rules didn't match, fall back to past transaction history.
      // Uses fuzzy merchant matching (same 3-tier scoring as rules) so reference numbers,
      // dates, and other noise in the description don't break the match.
      const historyRows = await transactionService.getCategoryHistory(userId);
      const historyDescs = historyRows.map((r) => r.description);
      console.log('[PDF] history rows for matching:', historyRows.length);

      const withCategories: ParsedTransaction[] = withRules.map((t) => {
        if (t.suggested_category_id) return t; // rule already matched — keep it

        // findSimilarInBatch extracts the merchant keyword from t.description, then
        // scores it against each history description using substring/token/boundary
        // matching — so "UPI/ARUN RAMAMOORTH/600198374455" matches history row
        // "UPI/ARUN RAMAMOORTH/500298374456" because "arun ramamoorth" appears in both.
        const matches = ruleService.findSimilarInBatch(t.description, historyDescs);
        if (matches.length === 0) return t;

        // historyRows is ordered newest-first; use the most recent match
        const hist = historyRows[matches[0]];
        console.log(`[PDF] history fill: "${t.description.slice(0, 40)}" → ${hist.category_id}`);
        return { ...t, suggested_category_id: hist.category_id };
      });

      // Filter duplicates against DB
      const fingerprints = withCategories.map((t) => t.fingerprint);
      const existingFingerprints = await transactionService.checkFingerprints(
        userId,
        fingerprints,
      );

      const duplicates = withCategories.filter((t) =>
        existingFingerprints.has(t.fingerprint),
      );
      const toImport = withCategories.filter(
        (t) => !existingFingerprints.has(t.fingerprint),
      );

      setState((s) => ({
        ...s,
        step: 'preview',
        preview: { parsed: withCategories, duplicates, toImport, bankName, openingBalance, closingBalance },
      }));

      await supabase.from('statements').insert({
        user_id: userId,
        file_name: file.name,
        bank_name: bankName,
        status: 'processing',
        opening_balance: openingBalance,
        closing_balance: closingBalance,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        step: 'error',
        error: err instanceof Error ? err.message : 'An unexpected error occurred.',
      }));
    }
  }, [userId, rules]);

  const confirmImport = useCallback(
    async (selectedTransactions: ParsedTransaction[]) => {
      if (selectedTransactions.length === 0) {
        setState((s) => ({ ...s, step: 'done', result: { imported: 0, skipped: 0 } }));
        return;
      }

      setState((s) => ({ ...s, step: 'importing' }));

      try {
        const rows = selectedTransactions.map((t) => ({
          amount: t.amount,
          description: t.description,
          notes: null,
          transaction_type: t.transaction_type,
          transaction_date: t.date,
          fingerprint: t.fingerprint,
          source: 'import' as const,
          category_id: t.suggested_category_id ?? null,
        }));

        const imported = await transactionService.bulkCreate(userId, rows);

        setState((s) => ({
          ...s,
          step: 'done',
          result: {
            imported: imported.length,
            skipped: s.preview?.duplicates.length ?? 0,
          },
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          step: 'error',
          error: err instanceof Error ? err.message : 'Import failed.',
        }));
      }
    },
    [userId],
  );

  return { state, pickAndParse, confirmImport, reset };
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF text extraction via pdfjs-dist (handles custom font encoding / ToUnicode)
// ─────────────────────────────────────────────────────────────────────────────

async function extractTextFromPdf(base64: string): Promise<string> {
  try {
    const t0 = Date.now();

    // Convert base64 → Uint8Array
    const binary = atob(base64);
    const data = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i);

    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    console.log(`[PDF] pages: ${pdf.numPages}`);

    const pageTexts: string[] = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();

      // Reconstruct lines by grouping items with the same Y coordinate
      const lineMap = new Map<number, string[]>();
      for (const item of content.items) {
        if (!('str' in item) || !item.str.trim()) continue;
        // Round Y to nearest 2px to group items on the same visual line
        const y = Math.round((item as any).transform[5] / 2) * 2;
        if (!lineMap.has(y)) lineMap.set(y, []);
        lineMap.get(y)!.push(item.str);
      }

      // Sort lines top→bottom (higher Y = higher on page in PDF coords)
      const lines = [...lineMap.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([, words]) => words.join(' ').trim())
        .filter(Boolean);

      pageTexts.push(lines.join('\n'));
      console.log(`[PDF] page ${p}: ${lines.length} lines`);
    }

    const result = pageTexts.join('\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    console.log(`[PDF] done in ${Date.now() - t0}ms — chars: ${result.length}`);
    console.log('[PDF] sample:\n', result.slice(0, 800));
    return result;
  } catch (e) {
    console.log('[PDF] extraction error:', e);
    return '';
  }
}

