'use client';

import type { Job } from '@/lib/domain';
import { useTranslation } from '@/lib/i18n';

interface Props {
  readonly job: Job;
  readonly isApplied: boolean;
  readonly onToggleApply: () => void;
  readonly onDismiss: () => void;
}

export function JobDetailPanel({ job, isApplied, onToggleApply, onDismiss }: Props) {
  const { t } = useTranslation();
  const d = job.details;

  const actionButtons = (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onToggleApply(); }}
        className={`rounded-md px-4 py-2 text-sm font-medium ${
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
        onClick={e => { e.stopPropagation(); onDismiss(); }}
        className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        {t('jobs.detail.dismiss', { defaultValue: 'Pas intéressé' })}
      </button>
      <a
        href={job.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
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
