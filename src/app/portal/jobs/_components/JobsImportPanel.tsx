'use client';

import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';
import { useJobsImportStore } from '@/lib/store/jobs/jobs-import.store';
import { JobsImportFileInput } from './JobsImportFileInput';
import { JobsImportPreview } from './JobsImportPreview';
import { JobsImportSuccess } from './JobsImportSuccess';
import { JobsImportError } from './JobsImportError';

export function JobsImportPanel() {
  const { t } = useTranslation();
  const open = useJobsImportStore(s => s.open);
  const state = useJobsImportStore(s => s.state);
  const toggleOpen = useJobsImportStore(s => s.toggleOpen);

  return (
    <div>
      <button
        type="button"
        onClick={toggleOpen}
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

          <JobsImportFileInput />

          {state.step === 'previewed' && <JobsImportPreview preview={state.preview} />}

          {state.step === 'importing' && (
            <Text variant="muted">{t('common.loading', { defaultValue: 'Chargement...' })}</Text>
          )}

          {state.step === 'done' && <JobsImportSuccess result={state.result} />}

          {state.step === 'error' && <JobsImportError message={state.message} />}
        </div>
      )}
    </div>
  );
}
