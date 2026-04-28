import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchFilterRules } from '@/lib/jobs/filter-rules';
import type { Job } from '@/lib/domain';
import { Text } from '@/components/ui/text';
import { RulesEditor } from './_components/RulesEditor';
import { ReapplyPanel } from './_components/ReapplyPanel';
import { AuditList } from './_components/AuditList';

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
  auto_dismissed_at: string | null;
  auto_dismissed_reason: string | null;
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
    autoDismissedAt: r.auto_dismissed_at,
    autoDismissedReason: r.auto_dismissed_reason,
    details: (r.details as Job['details']) ?? null,
    raw: r.raw,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FiltersPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = createSupabaseServerClient();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) redirect('/auth/login');

  const page = Math.max(0, Number(params.page) || 0);
  const perPage = [10, 25, 50].includes(Number(params.perPage)) ? Number(params.perPage) : 25;
  const unseenOnly = params.unseen === '1';

  const rules = await fetchFilterRules(supabase as never, auth.user.id);

  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('user_id', auth.user.id)
    .not('auto_dismissed_at', 'is', null);

  if (unseenOnly) query = query.is('viewed_at', null);

  query = query
    .order('auto_dismissed_at', { ascending: false })
    .range(page * perPage, (page + 1) * perPage - 1);

  const { data: rows, count, error } = await query;

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-red-200 bg-white/90 px-6 py-4 shadow-lg backdrop-blur">
          <p className="text-sm text-red-600">{error.message}</p>
        </div>
      </div>
    );
  }

  const auditJobs = (rows as Row[]).map(rowToJob);
  const totalCount = count ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Filtres d&apos;import</h1>
        <Text variant="muted" className="mt-1">
          Définis des mots-clés pour masquer automatiquement les offres dont le titre ne correspond pas à ton profil.
          Le filtre s&apos;applique à tous les imports (extension, JSON, manuel). Les offres masquées restent en base et peuvent être restaurées.
        </Text>
      </div>

      <div className="rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-5 shadow-lg backdrop-blur">
        <RulesEditor initialRules={rules} />
      </div>

      <div className="rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-5 shadow-lg backdrop-blur">
        <ReapplyPanel />
      </div>

      <div className="rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-4 shadow-lg backdrop-blur">
        <AuditList
          jobs={auditJobs}
          totalCount={totalCount}
          page={page}
          perPage={perPage}
          unseenOnly={unseenOnly}
        />
      </div>
    </div>
  );
}
