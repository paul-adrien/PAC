import type { SupabaseClient } from '@supabase/supabase-js';
import { type FilterRules } from './filter';

const EMPTY: FilterRules = { include: [], exclude: [] };

export async function fetchFilterRules(
  supabase: SupabaseClient,
  userId: string,
): Promise<FilterRules> {
  const { data, error } = await supabase
    .from('job_filter_rules')
    .select('include_keywords, exclude_keywords')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return EMPTY;

  return {
    include: (data.include_keywords as string[] | null) ?? [],
    exclude: (data.exclude_keywords as string[] | null) ?? [],
  };
}

export async function upsertFilterRules(
  supabase: SupabaseClient,
  userId: string,
  rules: FilterRules,
): Promise<void> {
  const { error } = await supabase
    .from('job_filter_rules')
    .upsert(
      {
        user_id: userId,
        include_keywords: rules.include,
        exclude_keywords: rules.exclude,
      },
      { onConflict: 'user_id' },
    );

  if (error) throw error;
}
