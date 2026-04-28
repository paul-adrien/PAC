import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { parseJobExportJSON, type JobInput, type JobNormalized } from './schema';
import { buildNormalized } from './buildNormalized';
import { applyFilter } from './filter';
import { fetchFilterRules } from './filter-rules';

const ImportResultSchema = z.object({
  total_in_file: z.number(),
  valid: z.number(),
  skipped: z.number(),
  unique_in_file: z.number(),
  inserted: z.number(),
  auto_dismissed: z.number(),
  updated_last_seen: z.number(),
});

export type ImportResult = z.infer<typeof ImportResultSchema>;

const PreviewResultSchema = z.object({
  total_in_file: z.number(),
  valid: z.number(),
  skipped: z.number(),
  unique_in_file: z.number(),
  samples: z.array(z.object({
    title: z.string(),
    company: z.string(),
    location: z.string().nullable(),
    source: z.string(),
  })),
});

export type PreviewResult = z.infer<typeof PreviewResultSchema>;

type ValidJobInput = JobInput & { title: string; company: string };

function isValidInput(input: JobInput): input is ValidJobInput {
  return input.title != null && input.title.length > 0
    && input.company != null && input.company.length > 0;
}

function dedupByFingerprint(rows: JobNormalized[]): JobNormalized[] {
  const map = new Map<string, JobNormalized>();
  for (const r of rows) map.set(r.fingerprint, r);
  return Array.from(map.values());
}

export function previewJobsJSON(jsonText: string): PreviewResult {
  const inputs = parseJobExportJSON(jsonText);
  const validInputs = inputs.filter(isValidInput);
  const normalizedAll = validInputs.map(buildNormalized);
  const normalized = dedupByFingerprint(normalizedAll);

  const samples = normalized.slice(0, 10).map(r => ({
    title: r.title,
    company: r.company,
    location: r.location,
    source: r.source,
  }));

  return PreviewResultSchema.parse({
    total_in_file: inputs.length,
    valid: validInputs.length,
    skipped: inputs.length - validInputs.length,
    unique_in_file: normalized.length,
    samples,
  });
}

export async function importJobsJSON(params: {
  supabase: SupabaseClient;
  userId: string;
  jsonText: string;
}): Promise<ImportResult> {
  const { supabase, userId, jsonText } = params;

  const inputs = parseJobExportJSON(jsonText);
  const validInputs = inputs.filter(isValidInput);
  const normalizedAll = validInputs.map(buildNormalized);
  const normalized = dedupByFingerprint(normalizedAll);

  const rules = await fetchFilterRules(supabase, userId);

  const fingerprints = normalized.map(r => r.fingerprint);

  const { data: existingRows, error: existingErr } = await supabase
    .from('jobs')
    .select('fingerprint')
    .eq('user_id', userId)
    .in('fingerprint', fingerprints);

  if (existingErr) throw existingErr;

  const existing = new Set<string>((existingRows ?? []).map((r: { fingerprint: string }) => r.fingerprint));

  const toInsert = normalized.filter(r => !existing.has(r.fingerprint));
  const toUpdate = normalized.filter(r => existing.has(r.fingerprint));

  let autoDismissedCount = 0;

  if (toInsert.length) {
    const now = new Date().toISOString();
    const payload = toInsert.map(r => {
      const decision = applyFilter(rules, r.title);
      if (decision.dismissed) autoDismissedCount += 1;
      return {
        user_id: userId,
        fingerprint: r.fingerprint,
        title: r.title,
        company: r.company,
        location: r.location,
        source: r.source,
        source_url: r.source_url,
        scraped_at: r.scraped_at,
        raw: r.raw ?? null,
        auto_dismissed_at: decision.dismissed ? now : null,
        auto_dismissed_reason: decision.dismissed ? decision.reason : null,
      };
    });

    const { error: insErr } = await supabase.from('jobs').insert(payload);
    if (insErr) throw insErr;
  }

  if (toUpdate.length) {
    const { error: updErr } = await supabase
      .from('jobs')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in(
        'fingerprint',
        toUpdate.map(r => r.fingerprint),
      );

    if (updErr) throw updErr;
  }

  return ImportResultSchema.parse({
    total_in_file: inputs.length,
    valid: validInputs.length,
    skipped: inputs.length - validInputs.length,
    unique_in_file: normalized.length,
    inserted: toInsert.length,
    auto_dismissed: autoDismissedCount,
    updated_last_seen: toUpdate.length,
  });
}
