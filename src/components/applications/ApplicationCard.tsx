'use client';

import { useRef, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import type { Application } from '@/lib/domain';

type Props = {
  application: Application;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function ApplicationCard({ application: a }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <li ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full rounded-2xl border border-orange-200/60 bg-white/90 p-4 text-left shadow-lg backdrop-blur transition hover:border-orange-300 hover:bg-white"
        aria-expanded={open}
        aria-controls={`application-details-${a.id}`}
        id={`application-trigger-${a.id}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {a.company} - {a.title}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {t(`portal.new.status.${a.status}`)}
              {a.location ? ` • ${a.location}` : ''}
            </p>
          </div>
          <span className="shrink-0 text-sm font-medium text-orange-800">
            {t(open ? 'portal.card.details' : 'common.see')}
          </span>
        </div>
      </button>
      {open && (
        <div
          id={`application-details-${a.id}`}
          role="region"
          aria-labelledby={`application-trigger-${a.id}`}
          className="mt-2 rounded-xl border border-orange-200/60 bg-white/95 p-4 shadow-md backdrop-blur"
        >
          <dl className="grid gap-2 text-sm">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
              <span className="min-w-0">
                <span className="text-xs font-medium text-gray-500">
                  {t('portal.new.company')}:
                </span>{' '}
                <span className="text-gray-900">{a.company}</span>
              </span>
              <span className="shrink-0 text-gray-400" aria-hidden>
                •
              </span>
              <span className="min-w-0">
                <span className="text-xs font-medium text-gray-500">
                  {t('portal.new.titleInput')}:
                </span>{' '}
                <span className="text-gray-900">{a.title}</span>
              </span>
              <span className="shrink-0 text-gray-400" aria-hidden>
                •
              </span>
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
              <span className="shrink-0 text-gray-400" aria-hidden>
                •
              </span>
              <span className="min-w-0">
                <span className="text-xs font-medium text-gray-500">
                  {t('portal.card.appliedAt')}:
                </span>{' '}
                <span className="text-gray-900">{formatDate(a.appliedAt)}</span>
              </span>
              {a.stars != null && (
                <>
                  <span className="shrink-0 text-gray-400" aria-hidden>
                    •
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5">
                    <span className="text-xs font-medium text-gray-500">
                      {t('portal.new.stars')}:
                    </span>{' '}
                    {[1, 2, 3, 4, 5].map(i => (
                      <span
                        key={i}
                        className={i <= a.stars! ? 'text-amber-500' : 'text-gray-300'}
                      >
                        {i <= a.stars! ? '★' : '☆'}
                      </span>
                    ))}
                  </span>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
              <span className="text-xs font-medium text-gray-500">
                {t('portal.new.notes')}:
              </span>{' '}
              <span className="min-w-0 text-gray-900">
                {a.notes?.trim() ?? '—'}
              </span>
            </div>
            {a.jobUrl && (
              <div className="text-sm">
                <span className="text-xs font-medium text-gray-500">
                  {t('portal.new.jobUrl')}:
                </span>{' '}
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
      )}
    </li>
  );
}
