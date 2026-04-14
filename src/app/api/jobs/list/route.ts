import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Job } from '@/lib/domain';

type Row = {
  id: string;
  user_id: string;
  fingerprint: string;
  title: string;
  company: string;
  location: string | null;
  source: string;
  source_url: string;
  first_seen_at: string;
  last_seen_at: string;
  scraped_at: string | null;
  viewed_at: string | null;
  applied_at: string | null;
  dismissed_at: string | null;
  details: Record<string, unknown> | null;
  raw: unknown;
  created_at: string;
  updated_at: string;
};

function rowToJob(r: Row): Job {
  return {
    id: r.id,
    userId: r.user_id,
    fingerprint: r.fingerprint,
    title: r.title,
    company: r.company,
    location: r.location,
    source: r.source,
    sourceUrl: r.source_url,
    firstSeenAt: r.first_seen_at,
    lastSeenAt: r.last_seen_at,
    scrapedAt: r.scraped_at,
    viewedAt: r.viewed_at,
    appliedAt: r.applied_at,
    dismissedAt: r.dismissed_at,
    details: (r.details as Job['details']) ?? null,
    raw: r.raw,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const SORT_COLUMNS: Record<string, string> = {
  title: 'title',
  company: 'company',
  location: 'location',
  source: 'source',
  viewedAt: 'viewed_at',
};

export async function GET(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 1));
  const sortKey = searchParams.get('sortKey') ?? 'createdAt';
  const sortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';
  const search = searchParams.get('search') ?? '';
  const filterCompany = searchParams.get('company') ?? '';
  const filterSource = searchParams.get('source') ?? '';
  const unseenOnly = searchParams.get('unseen') === '1';
  const appliedFilter = searchParams.get('applied');

  const dbSortCol = SORT_COLUMNS[sortKey] ?? 'created_at';

  const { data: dismissedCompaniesData } = await supabase
    .from('dismissed_companies')
    .select('company')
    .eq('user_id', auth.user.id);
  const dismissedCompanies = (dismissedCompaniesData ?? []).map(r => r.company);

  let query = supabase.from('jobs').select('*').eq('user_id', auth.user.id);

  if (filterCompany) query = query.eq('company', filterCompany);
  if (filterSource) query = query.eq('source', filterSource);
  if (unseenOnly) query = query.is('viewed_at', null);
  if (appliedFilter === 'yes') query = query.not('applied_at', 'is', null);
  if (appliedFilter === 'no') query = query.is('applied_at', null);
  query = query.is('dismissed_at', null);
  for (const c of dismissedCompanies) query = query.neq('company', c);
  if (search)
    query = query.or(
      `title.ilike.%${search}%,company.ilike.%${search}%,location.ilike.%${search}%`,
    );

  query = query.order(dbSortCol, { ascending: sortDir === 'asc' }).range(offset, offset + limit - 1);

  const { data: rows, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ jobs: (rows as Row[]).map(rowToJob) });
}
