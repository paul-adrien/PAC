'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import type { Application } from '@/lib/domain';
import { Text } from '@/components/ui/text';
import { DateTime } from 'luxon';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApplicationsStore } from '@/lib/store/applications/applications.store';
import { NewApplicationFormView } from '@/app/portal/new-application/NewApplicationFormView';
import { newApplicationSchema, todayIso } from '@/app/portal/new-application/schema';
import type { NewApplicationForm } from '@/app/portal/new-application/schema';

type Props = {
  application: Application;
  onRequestDelete?: (application: Application) => void;
};

export function ApplicationCard(props: Props) {
  const { application: a, onRequestDelete } = props;
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleDeleteClick = async () => {
    if (onRequestDelete) {
      onRequestDelete(a);
      return;
    }
  };

  return (
    <li>
      <div className="w-full rounded-2xl border border-orange-200/60 bg-white/90 p-4 shadow-lg backdrop-blur">
        {editing ? (
          <EditApplicationForm
            application={a}
            onCancel={() => setEditing(false)}
            onSaved={() => setEditing(false)}
          />
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Text variant="sm" className="truncate font-medium">
                {a.company} - {a.title}
              </Text>

              <dl className="mt-3 grid gap-2 text-sm">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                  <span className="min-w-0">
                    <span className="text-xs font-medium text-gray-500">
                      {t('portal.new.status')}:
                    </span>{' '}
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
                        <span className="text-gray-900">
                          {DateTime.fromISO(a.appliedAt).toISODate()}
                        </span>
                      </span>
                    </>
                  ) : null}
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
                  <span className="min-w-0 text-gray-900">{a.notes?.trim() ?? '—'}</span>
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

            <div className="flex shrink-0 items-end gap-2">
              <button
                type="button"
                onClick={handleEdit}
                className="rounded-md border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-orange-700 shadow-sm hover:border-orange-300 hover:bg-orange-50"
              >
                {t('common.edit', { defaultValue: 'Edit' })}
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700 shadow-sm hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('common.delete', { defaultValue: 'Delete' })}
              </button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

type EditApplicationFormProps = {
  application: Application;
  onCancel: () => void;
  onSaved: () => void;
};

function EditApplicationForm({ application, onCancel, onSaved }: EditApplicationFormProps) {
  const { t } = useTranslation();
  const updateApplication = useApplicationsStore(s => s.update);

  const {
    control,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm<NewApplicationForm>({
    resolver: zodResolver(newApplicationSchema),
    defaultValues: {
      company: application.company,
      title: application.title,
      status: application.status,
      location: application.location ?? '',
      jobUrl: application.jobUrl ?? '',
      notes: application.notes ?? '',
      stars: application.stars ?? 0,
      appliedAt: application.appliedAt
        ? (DateTime.fromISO(application.appliedAt).toISODate() ?? todayIso())
        : todayIso(),
    },
  });

  const onSubmit = async (data: NewApplicationForm) => {
    await updateApplication(application.id as any, data);
    onSaved();
  };

  return (
    <div>
      <Text as="p" variant="sm" className="mb-4 font-medium">
        {t('portal.card.editTitle', { defaultValue: 'Edit application' })}
      </Text>
      <NewApplicationFormView
        control={control}
        errors={errors}
        isValid={isValid}
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
      />
      <button
        type="button"
        onClick={onCancel}
        className="mt-3 rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        {t('common.cancel', { defaultValue: 'Cancel' })}
      </button>
    </div>
  );
}
