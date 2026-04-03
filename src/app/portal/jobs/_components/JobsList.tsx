'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DateTime } from 'luxon';
import type { Job } from '@/lib/domain';
import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';
import { DataTable, type Column } from '@/components/ui/data-table';
import { JobsFilters } from './JobsFilters';
import { JobDetailPanel } from './JobDetailPanel';

interface Props {
  readonly jobs: Job[];
  readonly companies: string[];
  readonly sources: string[];
  readonly totalCount: number;
  readonly page: number;
  readonly perPage: number;
  readonly sortKey: string;
  readonly sortDir: 'asc' | 'desc';
  readonly search: string;
  readonly filterCompany: string;
  readonly filterSource: string;
  readonly filterLocation: string;
  readonly unseenOnly: boolean;
  readonly appliedFilter: string;
}

export function JobsList({
  jobs,
  companies,
  sources,
  totalCount,
  page,
  perPage,
  sortKey,
  sortDir,
  search,
  filterCompany,
  filterSource,
  filterLocation,
  unseenOnly,
  appliedFilter,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshedJobs, setRefreshedJobs] = useState<Map<string, Job>>(new Map());

  const getJob = (job: Job) => refreshedJobs.get(job.id) ?? job;

  const refreshJob = useCallback(async (jobId: string) => {
    const res = await fetch(`/api/jobs/detail?jobId=${jobId}`);
    if (!res.ok) return;
    const { job } = await res.json();
    setRefreshedJobs(prev => new Map(prev).set(jobId, job));
  }, []);

  const formatDate = (iso: string) => DateTime.fromISO(iso).toRelative({ locale: 'fr' }) ?? iso;

  const isViewed = (job: Job) => job.viewedAt !== null || viewedIds.has(job.id);
  const isApplied = (job: Job) => (job.appliedAt !== null || appliedIds.has(job.id)) && !dismissedIds.has(job.id);

  const markAsViewed = useCallback((jobId: string) => {
    setViewedIds(prev => new Set(prev).add(jobId));
    fetch('/api/jobs/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
  }, []);

  const toggleApply = useCallback((job: Job) => {
    const willApply = !isApplied(job);
    if (willApply) {
      setAppliedIds(prev => new Set(prev).add(job.id));
    } else {
      setAppliedIds(prev => { const n = new Set(prev); n.delete(job.id); return n; });
    }
    fetch('/api/jobs/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl: job.sourceUrl }),
    });
  }, [jobs, appliedIds]);

  const dismissJob = useCallback((job: Job) => {
    setDismissedIds(prev => new Set(prev).add(job.id));
    setExpandedId(null);
    fetch('/api/jobs/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id }),
    }).then(() => router.refresh());
  }, [router]);

  const [dismissedCompanies, setDismissedCompanies] = useState<Set<string>>(new Set());

  const dismissCompany = useCallback((company: string) => {
    setDismissedCompanies(prev => new Set(prev).add(company));
    setExpandedId(null);
    fetch('/api/companies/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company }),
    }).then(() => router.refresh());
  }, [router]);

  const visibleJobs = jobs.filter(j => !dismissedIds.has(j.id) && !dismissedCompanies.has(j.company));

  const columns: Column<Job>[] = [
    {
      key: 'title',
      header: t('jobs.list.colTitle', { defaultValue: 'Titre' }),
      sortable: true,
      className: 'max-w-[280px]',
      render: job => (
        <span className="group/title relative flex items-center gap-2">
          {isApplied(job) && (
            <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
              Candidaté
            </span>
          )}
          {job.details && !isApplied(job) && (
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-500" title="Enrichie" />
          )}
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => {
              e.stopPropagation();
              if (!isViewed(job)) markAsViewed(job.id);
            }}
            className={`truncate hover:underline ${isViewed(job) ? 'text-gray-500' : 'font-semibold text-orange-800'}`}
          >
            {job.title}
          </a>
          <span className="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden max-w-xs rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg group-hover/title:block">
            {job.title}
          </span>
        </span>
      ),
    },
    {
      key: 'company',
      header: t('jobs.list.colCompany', { defaultValue: 'Entreprise' }),
      sortable: true,
      render: job => <span className="font-medium text-gray-900">{job.company}</span>,
    },
    {
      key: 'location',
      header: t('jobs.list.colLocation', { defaultValue: 'Lieu' }),
      sortable: true,
      className: 'max-w-[200px] truncate text-gray-500',
      render: job => job.location ?? '—',
    },
    {
      key: 'source',
      header: t('jobs.list.colSource', { defaultValue: 'Source' }),
      sortable: true,
      render: job => (
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
          {job.source}
        </span>
      ),
    },
    {
      key: 'viewedAt',
      header: t('jobs.list.colViewed', { defaultValue: 'Vu' }),
      sortable: true,
      className: 'text-gray-500',
      render: job => {
        if (job.viewedAt) return formatDate(job.viewedAt);
        if (viewedIds.has(job.id)) return "à l'instant";
        return '—';
      },
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('jobs.list.title', { defaultValue: 'Offres scrapées' })}
        </h2>
        <Text variant="muted">
          {totalCount} {t('jobs.list.results', { defaultValue: 'résultat(s)' })}
        </Text>
      </div>

      <div className="mt-3">
        <JobsFilters
          companies={companies}
          sources={sources}
          search={search}
          filterCompany={filterCompany}
          filterSource={filterSource}
          filterLocation={filterLocation}
          unseenOnly={unseenOnly}
          appliedFilter={appliedFilter}
        />
      </div>

      <div className="mt-4">
        <DataTable
          data={visibleJobs}
          columns={columns}
          rowKey={job => job.id}
          totalCount={totalCount - dismissedIds.size}
          page={page}
          perPage={perPage}
          sortKey={sortKey}
          sortDir={sortDir}
          emptyMessage={t('jobs.list.empty', { defaultValue: 'Aucune offre trouvée.' })}
          expandedKey={expandedId}
          onRowClick={job => setExpandedId(prev => (prev === job.id ? null : job.id))}
          renderExpanded={job => {
            const current = getJob(job);
            return (
            <JobDetailPanel
              job={current}
              isApplied={isApplied(current)}
              onToggleApply={() => toggleApply(current)}
              onDismiss={() => dismissJob(current)}
              onRefresh={() => refreshJob(job.id)}
              onDismissCompany={() => dismissCompany(current.company)}
            />
            );
          }}
        />
      </div>
    </div>
  );
}
