'use client';

import { useEffect } from 'react';
import { DateTime } from 'luxon';
import type { Job } from '@/lib/domain';
import { Text } from '@/components/ui/text';
import { DataTable, type Column } from '@/components/ui/data-table';
import { AuditFilters } from './AuditFilters';
import { useAuditListStore } from '@/lib/store/jobs/audit-list.store';

interface Props {
  readonly jobs: Job[];
  readonly totalCount: number;
  readonly page: number;
  readonly perPage: number;
  readonly unseenOnly: boolean;
}

function reasonLabel(reason: string | null): string {
  if (!reason) return '—';
  if (reason.startsWith('exclude:')) return `Exclu : « ${reason.slice('exclude:'.length)} »`;
  if (reason === 'no_include_match') return 'Aucun mot inclus ne matche';
  return reason;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return DateTime.fromISO(iso).toRelative({ locale: 'fr' }) ?? iso;
}

export function AuditList({ jobs, totalCount, page, perPage, unseenOnly }: Props) {
  const viewedIds = useAuditListStore(s => s.viewedIds);
  const restoredIds = useAuditListStore(s => s.restoredIds);
  const markAsViewed = useAuditListStore(s => s.markAsViewed);
  const restoreJob = useAuditListStore(s => s.restoreJob);
  const visibleJobs = useAuditListStore(s => s.visibleJobs);
  const reset = useAuditListStore(s => s.reset);

  useEffect(() => {
    reset();
  }, [page, perPage, unseenOnly, reset]);

  const isViewed = (job: Job) => job.viewedAt !== null || viewedIds.has(job.id);

  const data = visibleJobs(jobs);
  const visibleTotal = totalCount - restoredIds.size;

  const columns: Column<Job>[] = [
    {
      key: 'title',
      header: 'Titre',
      className: 'max-w-[280px]',
      render: job => (
        <span className="group/title relative flex items-center gap-2">
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => { if (!isViewed(job)) markAsViewed(job.id); }}
            className={`block max-w-[260px] truncate hover:underline ${
              isViewed(job) ? 'text-gray-500' : 'font-semibold text-orange-800'
            }`}
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
      header: 'Entreprise',
      render: job => <span className="font-medium text-gray-900">{job.company}</span>,
    },
    {
      key: 'source',
      header: 'Source',
      render: job => (
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
          {job.source}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Raison',
      render: job => <span className="text-gray-600">{reasonLabel(job.autoDismissedReason)}</span>,
    },
    {
      key: 'auto_dismissed_at',
      header: 'Masquée',
      render: job => <span className="text-gray-500">{formatDate(job.autoDismissedAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: job => (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); restoreJob(job.id); }}
          className="cursor-pointer rounded-md border border-orange-200 bg-white px-2 py-1 text-xs font-medium text-orange-900 hover:bg-orange-50"
        >
          Restaurer
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Audit — offres auto-masquées</h2>
        <Text variant="muted">
          {visibleTotal} {visibleTotal === 1 ? 'résultat' : 'résultats'}
        </Text>
      </div>

      <div className="mt-3">
        <AuditFilters unseenOnly={unseenOnly} auditTotal={visibleTotal} />
      </div>

      <div className="mt-4">
        <DataTable
          data={data}
          columns={columns}
          rowKey={job => job.id}
          totalCount={visibleTotal}
          page={page}
          perPage={perPage}
          sortKey=""
          sortDir="desc"
          emptyMessage="Aucune offre auto-masquée pour l'instant."
        />
      </div>
    </div>
  );
}
