import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Job } from '@/lib/domain';
import { JobsImportPanel } from './_components/JobsImportPanel';
import { JobsList } from './_components/JobsList';

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

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JobsPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = createSupabaseServerClient();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) redirect('/auth/login');

  const page = Math.max(0, Number(params.page) || 0);
  const perPage = [10, 25, 50].includes(Number(params.perPage)) ? Number(params.perPage) : 10;
  const sortKey = String(params.sortKey || 'createdAt');
  const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';
  const search = String(params.search || '');
  const filterCompany = String(params.company || '');
  const filterSource = String(params.source || '');
  const filterLocation = String(params.location || '');
  const unseenOnly = params.unseen === '1';
  const appliedFilter = params.applied === 'yes' || params.applied === 'no' ? params.applied : '';

  const dbSortCol = SORT_COLUMNS[sortKey] ?? 'created_at';

  const { data: dismissedCompaniesData } = await supabase
    .from('dismissed_companies')
    .select('company')
    .eq('user_id', auth.user.id);
  const dismissedCompanies = (dismissedCompaniesData ?? []).map(r => r.company);

  let query = supabase.from('jobs').select('*', { count: 'exact' }).eq('user_id', auth.user.id);

  if (filterCompany) query = query.eq('company', filterCompany);
  if (filterSource) query = query.eq('source', filterSource);
  if (filterLocation) query = query.ilike('location', `%${filterLocation}%`);
  if (unseenOnly) query = query.is('viewed_at', null);
  if (appliedFilter === 'yes') query = query.not('applied_at', 'is', null);
  if (appliedFilter === 'no') query = query.is('applied_at', null);
  query = query.is('dismissed_at', null);
  if (dismissedCompanies.length > 0) {
    for (const c of dismissedCompanies) {
      query = query.neq('company', c);
    }
  }
  if (search)
    query = query.or(
      `title.ilike.%${search}%,company.ilike.%${search}%,location.ilike.%${search}%`,
    );

  query = query
    .order(dbSortCol, { ascending: sortDir === 'asc' })
    .range(page * perPage, (page + 1) * perPage - 1);

  const { data: rows, count, error } = await query;

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-red-200 bg-white/90 px-6 py-4 shadow-lg backdrop-blur">
          <p className="text-sm text-red-600">{error.message}</p>
        </div>
      </div>
    );
  }

  const jobs = (rows as Row[]).map(rowToJob);
  const totalCount = count ?? 0;

  const [{ data: companiesData }, { data: sourcesData }] = await Promise.all([
    supabase.rpc('jobs_distinct_companies', { p_user_id: auth.user.id }),
    supabase.rpc('jobs_distinct_sources', { p_user_id: auth.user.id }),
  ]);

  const companies = (companiesData as string[]) ?? [];
  const sources = (sourcesData as string[]) ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-4 shadow-lg backdrop-blur">
        <JobsImportPanel />
      </div>
      <div className="rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-4 shadow-lg backdrop-blur">
        <JobsList
          jobs={jobs}
          companies={companies}
          sources={sources}
          totalCount={totalCount}
          page={page}
          perPage={perPage}
          sortKey={sortKey}
          sortDir={sortDir}
          search={search}
          filterCompany={filterCompany}
          filterSource={filterSource}
          filterLocation={filterLocation}
          unseenOnly={unseenOnly}
          appliedFilter={appliedFilter}
        />
      </div>
    </div>
  );
}
