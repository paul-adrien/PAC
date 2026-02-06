'use client';

import { DateTime } from 'luxon';
import { useTranslation } from '@/lib/i18n';
import type { Application } from '@/lib/domain';
import { Text } from '@/components/ui/text';

type Props = {
  application: Application;
};

export function ApplicationCardContent({ application: a }: Props) {
  const { t } = useTranslation();

  return (
    <div className="min-w-0 flex-1">
      <Text variant="sm" className="truncate font-medium">
        {a.company} - {a.title}
      </Text>

      <dl className="mt-3 grid gap-2 text-sm">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="min-w-0">
            <span className="text-xs font-medium text-gray-500">{t('portal.new.status')}:</span>{' '}
            <span className="text-gray-900">{t(`portal.new.status.${a.status}`)}</span>
          </span>
          {a.location && (
            <>
              <span className="shrink-0 text-gray-400" aria-hidden>
                •
              </span>
              <span className="min-w-0">
                <span className="text-xs font-medium text-gray-500">
                  {t('portal.new.location')}:
                </span>{' '}
                <span className="text-gray-900">{a.location}</span>
              </span>
            </>
          )}
          {a.appliedAt ? (
            <>
              <span className="shrink-0 text-gray-400" aria-hidden>
                •
              </span>
              <span className="min-w-0">
                <span className="text-xs font-medium text-gray-500">
                  {t('portal.card.appliedAt')}:
                </span>{' '}
                <span className="text-gray-900">{DateTime.fromISO(a.appliedAt).toISODate()}</span>
              </span>
            </>
          ) : null}
          {a.stars != null && (
            <>
              <span className="shrink-0 text-gray-400" aria-hidden>
                •
              </span>
              <span className="flex shrink-0 items-center gap-0.5">
                <span className="text-xs font-medium text-gray-500">{t('portal.new.stars')}:</span>{' '}
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className={i <= a.stars! ? 'text-amber-500' : 'text-gray-300'}>
                    {i <= a.stars! ? '★' : '☆'}
                  </span>
                ))}
              </span>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="text-xs font-medium text-gray-500">{t('portal.new.notes')}:</span>{' '}
          <span className="min-w-0 text-gray-900">{a.notes?.trim() ?? '—'}</span>
        </div>
        {a.jobUrl && (
          <div className="text-sm">
            <span className="text-xs font-medium text-gray-500">{t('portal.new.jobUrl')}:</span>{' '}
            <a
              href={a.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline hover:text-orange-700"
            >
              {a.jobUrl}
            </a>
          </div>
        )}
      </dl>
    </div>
  );
}
