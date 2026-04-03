'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DateTime } from 'luxon';
import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';
import { DEFAULT_PROMPTS } from '@/lib/generate/constants';

type Generation = {
  id: string;
  type: string;
  result: string;
  created_at: string;
};

type JobSummary = {
  title: string;
  company: string;
  location: string | null;
};

export default function GeneratePage() {
  const { t } = useTranslation();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobSummary | null>(null);
  const [prompt, setPrompt] = useState('');
  const [promptLoaded, setPromptLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [promptSaved, setPromptSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/jobs/detail?jobId=${jobId}`)
      .then(r => r.json())
      .then(json => { if (json.job) setJob(json.job); });

    fetch(`/api/prompts?type=cv_header`)
      .then(r => r.json())
      .then(json => {
        setPrompt(json.content ?? DEFAULT_PROMPTS.cv_header);
        setPromptLoaded(true);
      });

    fetchGenerations();
  }, [jobId]);

  const fetchGenerations = () => {
    fetch(`/api/generations?jobId=${jobId}&type=cv_header`)
      .then(r => r.json())
      .then(json => { if (json.generations) setGenerations(json.generations); });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'cv_header', jobId, prompt }),
    });

    const json = await res.json();
    setGenerating(false);

    if (!res.ok || !json.ok) {
      setError(json.error ?? 'Erreur');
      return;
    }

    setResult(json.result);
    fetchGenerations();
  };

  const handleSavePrompt = async () => {
    await fetch('/api/prompts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'cv_header', content: prompt }),
    });
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 2000);
  };

  const handleResetPrompt = () => {
    setPrompt(DEFAULT_PROMPTS.cv_header);
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (iso: string) => DateTime.fromISO(iso).toRelative({ locale: 'fr' }) ?? iso;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/portal/jobs"
          className="text-sm text-orange-700 hover:text-orange-900 underline"
        >
          {t('common.back', { defaultValue: 'Retour' })}
        </Link>
        {job && (
          <h1 className="text-xl font-semibold text-gray-900">
            {job.title} — {job.company}
          </h1>
        )}
      </div>

      <div className="rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-5 shadow-lg backdrop-blur">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('generate.cvHeader', { defaultValue: 'En-tête de CV' })}
        </h2>
        <Text variant="muted" className="mt-1">
          {t('generate.cvHeaderDesc', {
            defaultValue: 'Génère un résumé professionnel personnalisé pour cette offre. Tu peux modifier le prompt ci-dessous.',
          })}
        </Text>

        {promptLoaded && (
          <>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={12}
              className="mt-4 w-full rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-xs font-mono text-gray-900 shadow-sm
                focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-md bg-orange-900 px-6 py-2 text-sm font-medium text-white hover:bg-orange-800 disabled:opacity-50"
              >
                {generating
                  ? t('generate.generating', { defaultValue: 'Génération...' })
                  : t('generate.generate', { defaultValue: 'Générer' })}
              </button>
              <button
                type="button"
                onClick={handleSavePrompt}
                className="rounded-md border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50"
              >
                {t('generate.savePrompt', { defaultValue: 'Sauvegarder le prompt' })}
              </button>
              <button
                type="button"
                onClick={handleResetPrompt}
                className="text-sm text-orange-700 underline hover:text-orange-900"
              >
                {t('generate.resetPrompt', { defaultValue: 'Réinitialiser' })}
              </button>
              {promptSaved && (
                <Text variant="sm" className="text-green-700">
                  {t('common.saved', { defaultValue: 'Enregistré' })}
                </Text>
              )}
            </div>
          </>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50/90 p-4">
            <Text variant="danger">{error}</Text>
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50/90 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="whitespace-pre-wrap text-sm text-gray-900">{result}</p>
              <button
                type="button"
                onClick={() => handleCopy(result, 'new')}
                className="shrink-0 rounded-md border border-green-300 bg-white px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-50"
              >
                {copied === 'new' ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>
        )}
      </div>

      {generations.length > 0 && (
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
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{gen.result}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
