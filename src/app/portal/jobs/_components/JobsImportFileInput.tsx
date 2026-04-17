'use client';

import { useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';
import { useJobsImportStore } from '@/lib/store/jobs/jobs-import.store';

export function JobsImportFileInput() {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const state = useJobsImportStore(s => s.state);
  const file = useJobsImportStore(s => s.file);
  const preview = useJobsImportStore(s => s.preview);

  useEffect(() => {
    if (!file && inputRef.current) inputRef.current.value = '';
  }, [file]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    await preview(picked);
  };

  const disabled = state.step === 'previewing' || state.step === 'importing';

  return (
    <div>
      <input
        ref={inputRef}
        id="json-file"
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        disabled={disabled}
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
  );
}
