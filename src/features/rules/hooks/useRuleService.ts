import { supabase } from '@/lib/supabase';
import type { Rule, CreateRule, UpdateRule } from '@/types/database.types';

// ─────────────────────────────────────────────────────────────────────────────
// Normalization helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip bank noise from a raw description so matching works on merchant tokens.
 *
 * Input:  "PCD/7484/ZOMATO LIMITED/NEW DELHI100425/09:28"
 * Output: "zomato limited new delhi"
 *
 * Input:  "UPI/ARUN RAMAMOORTH/600198374455/RDA Cr to KYC c"
 * Output: "arun ramamoorth rda cr to kyc c"
 */
function normalize(raw: string): string {
  return (
    raw
      .toLowerCase()
      // strip leading bank channel prefixes
      .replace(/^(upi|neft|imps|rtgs|nach|ach|revupi|recd:|fos\d*)\s*/g, '')
      // strip PCD/ATL channel codes like "pcd/7484/" or "atl/7484/"
      .replace(/\b(pcd|atl)\/\d+\//g, '')
      // strip slash-delimited reference segments that are all-numeric or alphanumeric IDs
      // e.g. "/509379092339" "/UPI" "/B2WSAL00060592"
      .replace(/\/[a-z0-9]{4,}(?=[/ ]|$)/gi, ' ')
      // strip time stamps like "09:28" "13:50"
      .replace(/\d{1,2}:\d{2}/g, '')
      // strip 6+ digit numbers (transaction refs, dates embedded in strings)
      .replace(/\b\d{6,}\b/g, '')
      // replace all remaining non-alphanumeric chars with space
      .replace(/[^a-z0-9\s]/g, ' ')
      // collapse whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** Same normalization applied to a rule keyword before comparison. */
function normalizeKeyword(kw: string): string {
  return kw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a score > 0 if `rule` matches `normalizedDesc`, 0 otherwise.
 *
 * Scoring tiers (highest to lowest):
 *  Multi-word keyword:
 *   1. Exact contiguous phrase match  → (priority+1) × kwLen × 2
 *   2. All tokens present as whole words (any order) → (priority+1) × kwLen
 *  Single-word keyword:
 *   3. Whole-word boundary match only → (priority+1) × kwLen
 *      (substring is intentionally NOT used for single words — "ola" must not
 *       match inside "cola", "bipolar", "angola", etc.)
 */
function matchScore(normalizedDesc: string, rule: Rule): number {
  const kw = normalizeKeyword(rule.keyword);
  if (!kw) return 0;

  const p = (rule.priority ?? 0) + 1;
  const len = kw.length;
  // Keep all tokens including single-char ones (e.g. "h" from "h&m")
  const kwTokens = kw.split(' ').filter((t) => t.length > 0);
  if (kwTokens.length === 0) return 0;

  if (kwTokens.length >= 2) {
    // Tier 1 — contiguous phrase (safe for multi-word: "pizza hut" ⊂ "pizza hut delivery")
    if (normalizedDesc.includes(kw)) {
      return p * len * 2;
    }
    // Tier 2 — all tokens as individual whole words, any order
    const descWords = new Set(normalizedDesc.split(' '));
    if (kwTokens.every((t) => descWords.has(t))) {
      return p * len;
    }
    return 0;
  }

  // Tier 3 — single-word: whole-word boundary ONLY
  // "kfc" matches "kfc salem" ✓ but NOT inside "ekfc" or "kfcbd" ✓
  const escaped = kwTokens[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordBoundary = new RegExp(`\\b${escaped}\\b`);
  if (wordBoundary.test(normalizedDesc)) {
    return p * len;
  }

  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rule service
// ─────────────────────────────────────────────────────────────────────────────

export const ruleService = {
  async getAll(userId: string): Promise<Rule[]> {
    const { data, error } = await supabase
      .from('rules')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('priority', { ascending: false })
      .order('keyword', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Rule[];
  },

  async create(userId: string, payload: CreateRule): Promise<Rule> {
    const { data, error } = await supabase
      .from('rules')
      .insert({ ...payload, user_id: userId })
      .select('*, category:categories(*)')
      .single();

    if (error) throw error;
    return data as Rule;
  },

  async update(id: string, payload: UpdateRule): Promise<Rule> {
    const { data, error } = await supabase
      .from('rules')
      .update(payload)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();

    if (error) throw error;
    return data as Rule;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('rules').delete().eq('id', id);
    if (error) throw error;
  },

  async toggle(id: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('rules')
      .update({ enabled })
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Apply rules to a transaction description.
   *
   * Steps:
   *  1. Normalize the raw bank description (strip refs, channels, timestamps).
   *  2. Score every enabled rule using 3-tier matching (contiguous → token → boundary).
   *  3. Return the category_id of the highest-scoring rule, or null.
   *
   * Examples:
   *  "PCD/7484/ZOMATO LIMITED/NEW DELHI100425/09:28"  → Food & Dining (zomato)
   *  "UPI/ICCL - Mutual F/102407855867/UPI Autopay"   → Transfer       (iccl mutual)
   *  "UPI/ARUN RAMAMOORTH/600198374455/RDA Cr to KYC" → Freelance      (arun ramamoorth)
   *  "811 SUPER CASHBACK MAR25 ONBFm9oea71hb"         → Other Income   (811 super cashback)
   */
  applyRules(description: string, rules: Rule[]): string | null {
    const normalizedDesc = normalize(description);
    const enabledRules = rules.filter((r) => r.enabled);

    let bestCategoryId: string | null = null;
    let bestScore = 0;

    for (const rule of enabledRules) {
      const score = matchScore(normalizedDesc, rule);
      if (score > bestScore) {
        bestScore = score;
        bestCategoryId = rule.category_id;
      }
    }

    return bestCategoryId;
  },

  /** Apply rules to a batch of descriptions. Returns index → category_id map. */
  applyRulesBatch(descriptions: string[], rules: Rule[]): Map<number, string> {
    const result = new Map<number, string>();
    for (let i = 0; i < descriptions.length; i++) {
      const categoryId = ruleService.applyRules(descriptions[i], rules);
      if (categoryId) result.set(i, categoryId);
    }
    return result;
  },

  /**
   * Suggest a rule keyword from a raw bank description.
   *
   * Extracts the merchant/payee segment from common Kotak patterns:
   *  - UPI/MERCHANT/REF/...     → MERCHANT
   *  - PCD/7484/MERCHANT/LOC    → MERCHANT
   *  - NEFT BANKREF SENDER CODE → SENDER (first non-code segment)
   *  - Otherwise: strip noise, take first 2 meaningful words
   */
  suggestKeyword(description: string): string {
    const raw = description.trim();

    // UPI/PAYEE/... → extract payee
    const upiMatch = raw.match(/^UPI\/([^/]+)\//i);
    if (upiMatch) {
      return upiMatch[1].replace(/\d+/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    // PCD/NNNN/MERCHANT/... → extract merchant
    const pcdMatch = raw.match(/^(?:PCD|ATL)\/\d+\/([^/]+)\//i);
    if (pcdMatch) {
      return pcdMatch[1].replace(/\d+/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    // NEFT BANKREF SENDER BANKCODE → skip first all-caps bank-code token, take next words
    const neftMatch = raw.match(/^(?:NEFT|IMPS)\s+\S+\s+(.+)/i);
    if (neftMatch) {
      const words = neftMatch[1]
        .replace(/\b[A-Z0-9]{6,}\b/g, '')  // strip bank codes
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter((w) => w.length > 2);
      return words.slice(0, 3).join(' ').toLowerCase();
    }

    // Fallback: normalize and take first 2 meaningful words
    const fallback = normalize(raw).split(' ').filter((w) => w.length > 2);
    return fallback.slice(0, 2).join(' ');
  },

  /**
   * Find which descriptions in `others` match the same merchant as `targetDescription`.
   * Uses the same 3-tier scoring as rule matching so results are consistent.
   * Returns indices into the `others` array.
   */
  findSimilarInBatch(targetDescription: string, others: string[]): number[] {
    const keyword = ruleService.suggestKeyword(targetDescription);
    if (!keyword || keyword.length < 2) return [];

    const tempRule: Rule = {
      id: '', user_id: '', keyword, category_id: '',
      enabled: true, priority: 0, created_at: '', updated_at: '',
    };

    return others
      .map((desc, i) => ({ i, score: matchScore(normalize(desc), tempRule) }))
      .filter(({ score }) => score > 0)
      .map(({ i }) => i);
  },
};
