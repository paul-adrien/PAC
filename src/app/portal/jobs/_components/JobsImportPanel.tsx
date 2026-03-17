'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';

type PreviewSample = {
  title: string;
  company: string;
  location: string | null;
  source: string;
};

type PreviewResult = {
  total_in_file: number;
  valid: number;
  skipped: number;
  unique_in_file: number;
  samples: PreviewSample[];
};

type ImportResult = {
  total_in_file: number;
  valid: number;
  skipped: number;
  unique_in_file: number;
  inserted: number;
  updated_last_seen: number;
};

type State =
  | { step: 'pick' }
  | { step: 'previewing' }
  | { step: 'previewed'; preview: PreviewResult }
  | { step: 'importing' }
  | { step: 'done'; result: ImportResult }
  | { step: 'error'; message: string };

export function JobsImportPanel() {
  const { t } = useTranslation();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ step: 'pick' });
  const [fileName, setFileName] = useState<string | null>(null);

  const resetAll = () => {
    setState({ step: 'pick' });
    setFileName(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setState({ step: 'previewing' });

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/jobs/preview', { method: 'POST', body: form });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setState({ step: 'error', message: json.error ?? 'Preview failed' });
        return;
      }

      setState({ step: 'previewed', preview: json.result });
    } catch {
      setState({ step: 'error', message: 'Network error' });
    }
  };

  const handleImport = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setState({ step: 'importing' });

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/jobs/import', { method: 'POST', body: form });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setState({ step: 'error', message: json.error ?? 'Import failed' });
        return;
      }

      setState({ step: 'done', result: json.result });
      router.refresh();
    } catch {
      setState({ step: 'error', message: 'Network error' });
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-gray-900">
          {t('jobs.import.title', { defaultValue: 'Importer des offres' })}
        </span>
        <span
          className="text-gray-400 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : '' }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <Text variant="muted">
            {t('jobs.import.subtitle', {
              defaultValue: "Upload un fichier JSON exporté depuis l'extension Chrome.",
            })}
          </Text>

          <div>
            <input
              ref={inputRef}
              id="json-file"
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              disabled={state.step === 'previewing' || state.step === 'importing'}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:rounded-md file:border-0
                file:bg-orange-100 file:px-4 file:py-2
                file:text-sm file:font-medium file:text-orange-900
                file:cursor-pointer hover:file:bg-orange-200
                disabled:opacity-50"
            />

            {state.step === 'previewing' && (
              <Text variant="muted" className="mt-2">
                {t('common.loading', { defaultValue: 'Chargement...' })}
              </Text>
            )}
          </div>

          {state.step === 'previewed' && (
            <>
              <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-4">
                <Text variant="sm" className="font-semibold text-blue-800">
                  {t('jobs.import.previewTitle', { defaultValue: 'Aperçu du fichier' })}
                  {fileName && <span className="ml-2 font-normal text-blue-600">({fileName})</span>}
                </Text>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li>
                    {t('jobs.import.totalInFile', { defaultValue: 'Total dans le fichier' })} :{' '}
                    {state.preview.total_in_file}
                  </li>
                  <li>
                    {t('jobs.import.validOffers', { defaultValue: 'Offres valides' })} :{' '}
                    {state.preview.valid}
                  </li>
                  {state.preview.skipped > 0 && (
                    <li className="text-amber-600">
                      {t('jobs.import.skipped', {
                        defaultValue: 'Ignorées (title/company manquant)',
                      })}{' '}
                      : {state.preview.skipped}
                    </li>
                  )}
                  <li>
                    {t('jobs.import.uniqueInFile', { defaultValue: 'Uniques (après dédup)' })} :{' '}
                    {state.preview.unique_in_file}
                  </li>
                </ul>

                {state.preview.samples.length > 0 && (
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
                        {state.preview.samples.map((s, i) => (
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
                  onClick={resetAll}
                  className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t('common.cancel', { defaultValue: 'Annuler' })}
                </button>
              </div>
            </>
          )}

          {state.step === 'importing' && (
            <Text variant="muted">{t('common.loading', { defaultValue: 'Chargement...' })}</Text>
          )}

          {state.step === 'done' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-green-200 bg-green-50/90 p-4">
                <Text variant="sm" className="font-semibold text-green-800">
                  {t('jobs.import.success', { defaultValue: 'Import terminé' })}
                </Text>
                <ul className="mt-2 space-y-1 text-sm text-green-700">
                  <li>
                    {t('jobs.import.inserted', { defaultValue: 'Nouvelles offres insérées' })} :{' '}
                    {state.result.inserted}
                  </li>
                  <li>
                    {t('jobs.import.updatedLastSeen', {
                      defaultValue: 'Déjà existantes (last_seen mis à jour)',
                    })}{' '}
                    : {state.result.updated_last_seen}
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={resetAll}
                className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('jobs.import.importAnother', { defaultValue: 'Importer un autre fichier' })}
              </button>
            </div>
          )}

          {state.step === 'error' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-red-200 bg-red-50/90 p-4">
                <Text variant="danger">{state.message}</Text>
              </div>
              <button
                type="button"
                onClick={resetAll}
                className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('jobs.import.retry', { defaultValue: 'Réessayer' })}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
