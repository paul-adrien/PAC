'use client';

import { useCallback, useState } from 'react';
import { DateTime } from 'luxon';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Job } from '@/lib/domain';
import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';
import { DataTable, type Column } from '@/components/ui/data-table';

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
}

function updateParams(
  current: URLSearchParams,
  updates: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams(current);
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined || v === '') params.delete(k);
    else params.set(k, v);
  }
  return params.toString();
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
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = (updates: Record<string, string | undefined>) => {
    const qs = updateParams(searchParams, { ...updates, page: updates.page ?? '0' });
    router.push(`${pathname}?${qs}`);
  };

  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());

  const formatDate = (iso: string) => DateTime.fromISO(iso).toRelative({ locale: 'fr' }) ?? iso;

  const isViewed = (job: Job) => job.viewedAt !== null || viewedIds.has(job.id);

  const markAsViewed = useCallback((jobId: string) => {
    setViewedIds(prev => new Set(prev).add(jobId));
    fetch('/api/jobs/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
  }, []);

  const columns: Column<Job>[] = [
    {
      key: 'title',
      header: t('jobs.list.colTitle', { defaultValue: 'Titre' }),
      sortable: true,
      className: 'max-w-[280px] truncate',
      render: job => (
        <a
          href={job.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => !isViewed(job) && markAsViewed(job.id)}
          className={`hover:underline ${isViewed(job) ? 'text-gray-500' : 'font-semibold text-orange-800'}`}
        >
          {job.title}
        </a>
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
      className: 'max-w-[200px] truncate text-gray-500',
      render: job => job.location ?? '—',
    },
    {
      key: 'source',
      header: t('jobs.list.colSource', { defaultValue: 'Source' }),
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

      <div className="mt-3 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder={t('jobs.list.search', { defaultValue: 'Rechercher...' })}
          defaultValue={search}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              navigate({ search: e.currentTarget.value || undefined });
            }
          }}
          className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-gray-900 shadow-sm
            focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
        />

        <select
          value={filterCompany}
          onChange={e => navigate({ company: e.target.value || undefined })}
          className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-gray-900 shadow-sm
            focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
        >
          <option value="">
            {t('jobs.list.allCompanies', { defaultValue: 'Toutes les entreprises' })}
          </option>
          {companies.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filterSource}
          onChange={e => navigate({ source: e.target.value || undefined })}
          className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-gray-900 shadow-sm
            focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
        >
          <option value="">
            {t('jobs.list.allSources', { defaultValue: 'Toutes les sources' })}
          </option>
          {sources.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {(filterCompany || filterSource || search) && (
          <button
            type="button"
            onClick={() => navigate({ company: undefined, source: undefined, search: undefined })}
            className="text-sm text-orange-700 underline hover:text-orange-900"
          >
            {t('jobs.list.clearFilters', { defaultValue: 'Réinitialiser' })}
          </button>
        )}
      </div>

      <div className="mt-4">
        <DataTable
          data={jobs}
          columns={columns}
          rowKey={job => job.id}
          totalCount={totalCount}
          page={page}
          perPage={perPage}
          sortKey={sortKey}
          sortDir={sortDir}
          emptyMessage={t('jobs.list.empty', { defaultValue: 'Aucune offre trouvée.' })}
        />
      </div>
    </div>
  );
}
