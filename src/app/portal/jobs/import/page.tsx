'use client';

import { useRef, useState } from 'react';
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

export default function JobsImportPage() {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
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
    } catch {
      setState({ step: 'error', message: 'Network error' });
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900">
        {t('jobs.import.title', { defaultValue: 'Importer des offres' })}
      </h1>
      <Text variant="muted" className="mt-1">
        {t('jobs.import.subtitle', {
          defaultValue: "Upload un fichier JSON exporté depuis l'extension Chrome.",
        })}
      </Text>

      {/* File picker */}
      <div className="mt-6 rounded-2xl border border-orange-200/60 bg-white/90 p-6 shadow-lg backdrop-blur">
        <label htmlFor="json-file" className="block text-sm font-medium text-gray-700">
          {t('jobs.import.fileLabel', { defaultValue: 'Fichier JSON' })}
        </label>

        <input
          ref={inputRef}
          id="json-file"
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          disabled={state.step === 'previewing' || state.step === 'importing'}
          className="mt-2 block w-full text-sm text-gray-500
            file:mr-4 file:rounded-md file:border-0
            file:bg-orange-100 file:px-4 file:py-2
            file:text-sm file:font-medium file:text-orange-900
            file:cursor-pointer hover:file:bg-orange-200
            disabled:opacity-50"
        />

        {state.step === 'previewing' && (
          <Text variant="muted" className="mt-3">
            {t('common.loading', { defaultValue: 'Chargement...' })}
          </Text>
        )}
      </div>

      {/* Preview */}
      {state.step === 'previewed' && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/90 p-6 shadow-lg backdrop-blur">
            <Text variant="sm" className="font-semibold text-blue-800">
              {t('jobs.import.previewTitle', { defaultValue: 'Aperçu du fichier' })}
              {fileName && <span className="ml-2 font-normal text-blue-600">({fileName})</span>}
            </Text>
            <ul className="mt-2 space-y-1 text-sm text-blue-700">
              <li>{t('jobs.import.totalInFile', { defaultValue: 'Total dans le fichier' })} : {state.preview.total_in_file}</li>
              <li>{t('jobs.import.validOffers', { defaultValue: 'Offres valides' })} : {state.preview.valid}</li>
              {state.preview.skipped > 0 && (
                <li className="text-amber-600">
                  {t('jobs.import.skipped', { defaultValue: 'Ignorées (title/company manquant)' })} : {state.preview.skipped}
                </li>
              )}
              <li>{t('jobs.import.uniqueInFile', { defaultValue: 'Uniques (après dédup)' })} : {state.preview.unique_in_file}</li>
            </ul>

            {state.preview.samples.length > 0 && (
              <div className="mt-4">
                <Text variant="sm" className="font-medium text-blue-800">
                  {t('jobs.import.sampleTitle', { defaultValue: 'Exemples (10 premières)' })}
                </Text>
                <div className="mt-2 max-h-64 overflow-y-auto">
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
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleImport}
              className="rounded-md bg-orange-900 px-6 py-2.5 text-sm font-medium text-white
                hover:bg-orange-800"
            >
              {t('jobs.import.confirmImport', { defaultValue: 'Importer en base' })}
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium
                text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel', { defaultValue: 'Annuler' })}
            </button>
          </div>
        </div>
      )}

      {/* Importing */}
      {state.step === 'importing' && (
        <div className="mt-6 rounded-2xl border border-orange-200/60 bg-white/90 p-6 shadow-lg backdrop-blur">
          <Text variant="muted">{t('common.loading', { defaultValue: 'Chargement...' })}</Text>
        </div>
      )}

      {/* Done */}
      {state.step === 'done' && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-green-200 bg-green-50/90 p-6 shadow-lg backdrop-blur">
            <Text variant="sm" className="font-semibold text-green-800">
              {t('jobs.import.success', { defaultValue: 'Import terminé' })}
            </Text>
            <ul className="mt-2 space-y-1 text-sm text-green-700">
              <li>{t('jobs.import.totalInFile', { defaultValue: 'Total dans le fichier' })} : {state.result.total_in_file}</li>
              <li>{t('jobs.import.validOffers', { defaultValue: 'Offres valides' })} : {state.result.valid}</li>
              {state.result.skipped > 0 && (
                <li className="text-amber-600">
                  {t('jobs.import.skipped', { defaultValue: 'Ignorées (title/company manquant)' })} : {state.result.skipped}
                </li>
              )}
              <li>{t('jobs.import.uniqueInFile', { defaultValue: 'Uniques (après dédup)' })} : {state.result.unique_in_file}</li>
              <li>{t('jobs.import.inserted', { defaultValue: 'Nouvelles offres insérées' })} : {state.result.inserted}</li>
              <li>{t('jobs.import.updatedLastSeen', { defaultValue: 'Déjà existantes (last_seen mis à jour)' })} : {state.result.updated_last_seen}</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={resetAll}
            className="rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium
              text-gray-700 hover:bg-gray-50"
          >
            {t('jobs.import.importAnother', { defaultValue: 'Importer un autre fichier' })}
          </button>
        </div>
      )}

      {/* Error */}
      {state.step === 'error' && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50/90 p-6 shadow-lg backdrop-blur">
            <Text variant="danger">{state.message}</Text>
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium
              text-gray-700 hover:bg-gray-50"
          >
            {t('jobs.import.retry', { defaultValue: 'Réessayer' })}
          </button>
        </div>
      )}
    </div>
  );
}
