'use client';

import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';
import { type GenerationType } from '@/lib/generate/constants';

type Generation = {
  id: string;
  type: string;
  result: string;
  created_at: string;
};

interface Props {
  readonly jobId: string;
  readonly activeTab: GenerationType;
  readonly refreshKey: number;
}

export function GenerationHistory({ jobId, activeTab, refreshKey }: Props) {
  const { t } = useTranslation();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/generations?jobId=${jobId}&type=${activeTab}`)
      .then(r => r.json())
      .then(json => {
        setGenerations(json.generations ?? []);
      });
  }, [jobId, activeTab, refreshKey]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (iso: string) => DateTime.fromISO(iso).toRelative({ locale: 'fr' }) ?? iso;

  if (generations.length === 0) return null;

  return (
    <div className="rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-5 shadow-lg backdrop-blur">
      <h2 className="text-lg font-semibold text-gray-900">
        {t('generate.history', { defaultValue: 'Historique' })}
      </h2>
      <div className="mt-3 space-y-3">
        {generations.map(gen => (
          <div
            key={gen.id}
            className="rounded-lg border border-orange-100 bg-orange-50/50 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <Text variant="caption">{formatDate(gen.created_at)}</Text>
              <button
                type="button"
                onClick={() => handleCopy(gen.result, gen.id)}
                className="rounded-md border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-orange-800 hover:bg-orange-50"
              >
                {copied === gen.id ? 'Copié !' : 'Copier'}
              </button>
            </div>
            <Text variant="sm" className="mt-1 whitespace-pre-wrap">{gen.result}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}
