'use client';

import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';
import { useJobsImportStore } from '@/lib/store/jobs/jobs-import.store';

interface Props {
  readonly message: string;
}

export function JobsImportError({ message }: Props) {
  const { t } = useTranslation();
  const reset = useJobsImportStore(s => s.reset);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-red-200 bg-red-50/90 p-4">
        <Text variant="danger">{message}</Text>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {t('jobs.import.retry', { defaultValue: 'Réessayer' })}
      </button>
    </div>
  );
}
