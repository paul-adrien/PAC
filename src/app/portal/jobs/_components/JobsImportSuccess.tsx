'use client';

import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';
import { useJobsImportStore, type ImportResult } from '@/lib/store/jobs/jobs-import.store';

interface Props {
  readonly result: ImportResult;
}

export function JobsImportSuccess({ result }: Props) {
  const { t } = useTranslation();
  const reset = useJobsImportStore(s => s.reset);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-green-200 bg-green-50/90 p-4">
        <Text variant="sm" className="font-semibold text-green-800">
          {t('jobs.import.success', { defaultValue: 'Import terminé' })}
        </Text>
        <ul className="mt-2 space-y-1 text-sm text-green-700">
          <li>
            {t('jobs.import.inserted', { defaultValue: 'Nouvelles offres insérées' })} :{' '}
            {result.inserted}
          </li>
          <li>
            {t('jobs.import.updatedLastSeen', {
              defaultValue: 'Déjà existantes (last_seen mis à jour)',
            })}{' '}
            : {result.updated_last_seen}
          </li>
        </ul>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {t('jobs.import.importAnother', { defaultValue: 'Importer un autre fichier' })}
      </button>
    </div>
  );
}
