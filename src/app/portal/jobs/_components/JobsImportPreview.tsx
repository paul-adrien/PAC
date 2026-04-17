'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';
import { useJobsImportStore, type PreviewResult } from '@/lib/store/jobs/jobs-import.store';

interface Props {
  readonly preview: PreviewResult;
}

export function JobsImportPreview({ preview }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const file = useJobsImportStore(s => s.file);
  const importFile = useJobsImportStore(s => s.importFile);
  const reset = useJobsImportStore(s => s.reset);

  const handleImport = async () => {
    const ok = await importFile();
    if (ok) router.refresh();
  };

  return (
    <>
      <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-4">
        <Text variant="sm" className="font-semibold text-blue-800">
          {t('jobs.import.previewTitle', { defaultValue: 'Aperçu du fichier' })}
          {file && <span className="ml-2 font-normal text-blue-600">({file.name})</span>}
        </Text>
        <ul className="mt-2 space-y-1 text-sm text-blue-700">
          <li>
            {t('jobs.import.totalInFile', { defaultValue: 'Total dans le fichier' })} :{' '}
            {preview.total_in_file}
          </li>
          <li>
            {t('jobs.import.validOffers', { defaultValue: 'Offres valides' })} : {preview.valid}
          </li>
          {preview.skipped > 0 && (
            <li className="text-amber-600">
              {t('jobs.import.skipped', { defaultValue: 'Ignorées (title/company manquant)' })} :{' '}
              {preview.skipped}
            </li>
          )}
          <li>
            {t('jobs.import.uniqueInFile', { defaultValue: 'Uniques (après dédup)' })} :{' '}
            {preview.unique_in_file}
          </li>
        </ul>

        {preview.samples.length > 0 && (
          <div className="mt-3 max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-blue-200 text-blue-600">
                  <th className="py-1 pr-2 font-medium">Titre</th>
                  <th className="py-1 pr-2 font-medium">Entreprise</th>
                  <th className="py-1 font-medium">Lieu</th>
                </tr>
              </thead>
              <tbody>
                {preview.samples.map((s, i) => (
                  <tr key={i} className="border-b border-blue-100 text-blue-900">
                    <td className="max-w-[200px] truncate py-1 pr-2">{s.title}</td>
                    <td className="py-1 pr-2">{s.company}</td>
                    <td className="max-w-[150px] truncate py-1">{s.location ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleImport}
          className="rounded-md bg-orange-900 px-6 py-2 text-sm font-medium text-white hover:bg-orange-800"
        >
          {t('jobs.import.confirmImport', { defaultValue: 'Importer en base' })}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {t('common.cancel', { defaultValue: 'Annuler' })}
        </button>
      </div>
    </>
  );
}
