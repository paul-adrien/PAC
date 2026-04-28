import { z } from 'zod';

export const FilterRulesSchema = z.object({
  include: z.array(z.string()),
  exclude: z.array(z.string()),
});

export type FilterRules = z.infer<typeof FilterRulesSchema>;

export type FilterDecision =
  | { dismissed: false; reason: null }
  | { dismissed: true; reason: string };

const PASS: FilterDecision = { dismissed: false, reason: null };

function normalizeKeyword(k: string): string {
  return k.trim().toLowerCase();
}

export function normalizeRules(rules: FilterRules): FilterRules {
  const include = rules.include.map(normalizeKeyword).filter(k => k.length > 0);
  const exclude = rules.exclude.map(normalizeKeyword).filter(k => k.length > 0);
  return { include, exclude };
}

function escapeRegex(s: string): string {
  return s.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function matchesKeyword(text: string, keyword: string): boolean {
  return new RegExp(String.raw`\b${escapeRegex(keyword)}\b`, 'i').test(text);
}

export function applyFilter(rules: FilterRules, title: string | null = ''): FilterDecision {
  const t = title ?? '';
  if (!t) return PASS;

  const { include, exclude } = normalizeRules(rules);

  for (const kw of exclude) {
    if (matchesKeyword(t, kw)) {
      return { dismissed: true, reason: `exclude:${kw}` };
    }
  }

  if (include.length > 0) {
    const matches = include.some(kw => matchesKeyword(t, kw));
    if (!matches) {
      return { dismissed: true, reason: 'no_include_match' };
    }
  }

  return PASS;
}
