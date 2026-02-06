'use client';

import { DateTime } from 'luxon';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@/lib/i18n';
import type { Application } from '@/lib/domain';
import { Text } from '@/components/ui/text';
import { useApplicationsStore } from '@/lib/store/applications/applications.store';
import { NewApplicationFormView } from '@/app/portal/new-application/NewApplicationFormView';
import { newApplicationSchema, todayIso } from '@/app/portal/new-application/schema';
import type { NewApplicationForm } from '@/app/portal/new-application/schema';

type EditApplicationFormProps = {
  application: Application;
  onCancel: () => void;
  onSaved: () => void;
};

export function EditApplicationForm({ application, onCancel, onSaved }: EditApplicationFormProps) {
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
