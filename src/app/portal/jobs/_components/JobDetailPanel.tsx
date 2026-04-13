'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import type { Job } from '@/lib/domain';
import { useTranslation } from '@/lib/i18n';

interface Props {
  readonly job: Job;
  readonly isApplied: boolean;
  readonly onToggleApply: () => void;
  readonly onRefresh: () => Promise<void>;
  readonly onDismissCompany: () => void;
  readonly onOpenLink: () => void;
}

export function JobDetailPanel({ job, isApplied, onToggleApply, onRefresh, onDismissCompany, onOpenLink }: Props) {
  const { t } = useTranslation();
  const d = job.details;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const actionButtons = (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        title={t('jobs.detail.refresh', { defaultValue: 'Rafraîchir' })}
      >
        <span className={refreshing ? 'inline-block animate-spin' : ''}>↻</span>
      </button>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onToggleApply(); }}
        className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium ${
          isApplied
            ? 'border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        {isApplied
          ? t('jobs.detail.applied', { defaultValue: 'Candidaté' })
          : t('jobs.detail.markApplied', { defaultValue: "J'ai candidaté" })}
      </button>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onDismissCompany(); }}
        className="cursor-pointer rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium leading-tight text-red-600 hover:bg-red-50 whitespace-pre-line"
      >
        {`Pas intéressé\npar ${job.company}`}
      </button>
      <Link
        href={`/portal/jobs/${job.id}/generate`}
        onClick={e => e.stopPropagation()}
        className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-800 hover:bg-orange-100"
      >
        {t('jobs.detail.generate', { defaultValue: 'Générer' })}
      </Link>
      <a
        href={job.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => { e.stopPropagation(); onOpenLink(); }}
        className="rounded-md bg-orange-900 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800"
      >
        {t('jobs.detail.openLink', { defaultValue: 'Ouvrir sur LinkedIn' })}
      </a>
    </div>
  );

  if (!d) {
    return (
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          {t('jobs.detail.notEnriched', {
            defaultValue: "Cette offre n'a pas encore été enrichie. Utilise l'extension Chrome sur la page de l'offre.",
          })}
        </p>
        {actionButtons}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {d.employmentType && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {d.employmentType}
            </span>
          )}
          {d.seniorityLevel && (
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
              {d.seniorityLevel}
            </span>
          )}
          {d.industry && (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              {d.industry}
            </span>
          )}
          {d.salary && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              {d.salary}
            </span>
          )}
          {d.applicants && (
            <span className="text-xs text-gray-500">{d.applicants}</span>
          )}
          {d.postedAt && (
            <span className="text-xs text-gray-500">{d.postedAt}</span>
          )}
        </div>
        {actionButtons}
      </div>

      {d.skills && d.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {d.skills.map(skill => (
            <span
              key={skill}
              className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs text-orange-800"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {d.description && (
        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 whitespace-pre-line">
          {d.description.replaceAll(/\n{3,}/g, '\n\n')}
        </div>
      )}
    </div>
  );
}
