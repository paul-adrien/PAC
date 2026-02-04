'use client';

import { APPLICATION_STATUSES } from '@/lib/domain';
import { useTranslation } from '@/lib/i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApplicationsStore } from '@/lib/store/applications/applications.store';
import { useAuthStore } from '@/lib/store/auth/auth.store';
import { newApplicationSchema, todayIso } from './schema';
import type { NewApplicationForm } from './schema';
import { NewApplicationFormView } from './NewApplicationFormView';

export type { NewApplicationForm } from './schema';

export default function NewApplicationPage() {
  const { t } = useTranslation();
  const create = useApplicationsStore(s => s.create);
  const userId = useAuthStore(s => s.user?.id);

  const {
    control,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm<NewApplicationForm>({
    resolver: zodResolver(newApplicationSchema),
    defaultValues: {
      status: APPLICATION_STATUSES[0],
      appliedAt: todayIso(),
      stars: 0,
    },
  });

  const onSubmit = (data: NewApplicationForm) => {
    if (userId) {
      create(data, userId).then(() => {
        console.log('created');
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <section className="rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-8 shadow-lg backdrop-blur">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          {t('portal.new.title')}
        </h1>
        <NewApplicationFormView
          control={control}
          errors={errors}
          isValid={isValid}
          onSubmit={onSubmit}
          handleSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}
