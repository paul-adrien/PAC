'use client';

import { useEffect, useMemo } from 'react';
import type { Job } from '@/lib/domain';
import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';
import { DataTable, type Column } from '@/components/ui/data-table';
import { JobsFilters } from './JobsFilters';
import { JobDetailPanel } from './JobDetailPanel';
import { useJobsListStore } from '@/lib/store/jobs/jobs-list.store';

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
  unseenOnly,
  appliedFilter,
}: Props) {
  const { t } = useTranslation();
  const store = useJobsListStore();

  const filterParams = useMemo(() => ({
    page, perPage, sortKey, sortDir, search,
    filterCompany, filterSource, unseenOnly, appliedFilter,
  }), [page, perPage, sortKey, sortDir, search, filterCompany, filterSource, unseenOnly, appliedFilter]);

  useEffect(() => {
    store.reset();
  }, [page, sortKey, sortDir, search, filterCompany, filterSource, unseenOnly, appliedFilter]);

  const visibleJobs = store.visibleJobs(jobs);
  const allJobs = [...jobs, ...store.extraJobs];

  const columns: Column<Job>[] = [
    {
      key: 'title',
      header: t('jobs.list.colTitle', { defaultValue: 'Titre' }),
      sortable: true,
      className: 'max-w-[280px]',
      render: job => (
        <span className="group/title relative flex items-center gap-2">
          {store.isApplied(job) && (
            <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
              Candidaté
            </span>
          )}
          {job.details && !store.isApplied(job) && (
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-500" title="Enrichie" />
          )}
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => {
              e.stopPropagation();
              if (!store.isViewed(job)) store.markAsViewed(job.id);
            }}
            className={`truncate hover:underline ${store.isViewed(job) ? 'text-gray-500' : 'font-semibold text-orange-800'}`}
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
      key: 'actions',
      header: '',
      className: 'text-right',
      render: job => (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); store.dismissJob(job, filterParams, jobs); }}
          className="cursor-pointer rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          title={t('jobs.detail.dismiss', { defaultValue: 'Pas intéressé' })}
        >
          {t('jobs.detail.dismiss', { defaultValue: 'Pas intéressé' })}
        </button>
      ),
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
          unseenOnly={unseenOnly}
          appliedFilter={appliedFilter}
        />
      </div>

      <div className="mt-4">
        <DataTable
          data={visibleJobs}
          columns={columns}
          rowKey={job => job.id}
          totalCount={totalCount - store.dismissedIds.size}
          page={page}
          perPage={perPage}
          sortKey={sortKey}
          sortDir={sortDir}
          emptyMessage={t('jobs.list.empty', { defaultValue: 'Aucune offre trouvée.' })}
          expandedKey={store.expandedId}
          onRowClick={job => store.toggleExpandedId(job.id)}
          skeletonCount={store.loadingReplacements}
          renderExpanded={job => {
            const current = store.getJob(job);
            return (
            <JobDetailPanel
              job={current}
              isApplied={store.isApplied(current)}
              onToggleApply={() => store.toggleApply(current)}
              onRefresh={() => store.refreshJob(job.id)}
              onDismissCompany={() => store.dismissCompany(current.company, allJobs, filterParams, jobs)}
              onOpenLink={() => { if (!store.isViewed(current)) store.markAsViewed(current.id); }}
            />
            );
          }}
        />
      </div>
    </div>
  );
}
