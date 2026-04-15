'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DateTime } from 'luxon';
import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';
import {
  DEFAULT_PROMPTS,
  PROVIDERS,
  type Provider,
  type GenerationType,
} from '@/lib/generate/constants';

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
  details: { description?: string; skills?: string[] } | null;
};

const TABS: { key: GenerationType; label: string; desc: string }[] = [
  {
    key: 'cv_header',
    label: 'En-tête de CV',
    desc: 'Génère un résumé professionnel personnalisé pour cette offre.',
  },
  {
    key: 'cover_letter',
    label: 'Lettre de motivation',
    desc: 'Génère une lettre de motivation personnalisée pour cette offre.',
  },
];

export default function GeneratePage() {
  const { t } = useTranslation();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobSummary | null>(null);
  const [profile, setProfile] = useState<string>('');
  const [activeTab, setActiveTab] = useState<GenerationType>('cv_header');
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [promptsLoaded, setPromptsLoaded] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generations, setGenerations] = useState<Record<string, Generation[]>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [promptSaved, setPromptSaved] = useState(false);
  const [provider, setProvider] = useState<Provider>('claude');

  useEffect(() => {
    fetch(`/api/jobs/detail?jobId=${jobId}`)
      .then(r => r.json())
      .then(json => {
        if (json.job) setJob(json.job);
      });
    fetch('/api/profile')
      .then(r => r.json())
      .then(json => {
        if (typeof json.content === 'string') setProfile(json.content);
      });
  }, [jobId]);

  const loadTab = useCallback(
    (type: GenerationType) => {
      if (!promptsLoaded.has(type)) {
        fetch(`/api/prompts?type=${type}`)
          .then(r => r.json())
          .then(json => {
            setPrompts(prev => ({ ...prev, [type]: json.content ?? DEFAULT_PROMPTS[type] }));
            setPromptsLoaded(prev => new Set(prev).add(type));
          });
      }
      fetch(`/api/generations?jobId=${jobId}&type=${type}`)
        .then(r => r.json())
        .then(json => {
          if (json.generations) setGenerations(prev => ({ ...prev, [type]: json.generations }));
        });
    },
    [jobId, promptsLoaded],
  );

  useEffect(() => {
    loadTab(activeTab);
  }, [activeTab, loadTab]);

  const handleTabChange = (type: GenerationType) => {
    setActiveTab(type);
    setResult(null);
    setError(null);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: activeTab, jobId, prompt: prompts[activeTab], provider }),
    });

    const json = await res.json();
    setGenerating(false);

    if (!res.ok || !json.ok) {
      setError(json.error ?? 'Erreur');
      return;
    }

    setResult(json.result);
    loadTab(activeTab);
  };

  const handleSavePrompt = async () => {
    await fetch('/api/prompts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: activeTab, content: prompts[activeTab] }),
    });
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 2000);
  };

  const handleResetPrompt = () => {
    setPrompts(prev => ({ ...prev, [activeTab]: DEFAULT_PROMPTS[activeTab] }));
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (iso: string) => DateTime.fromISO(iso).toRelative({ locale: 'fr' }) ?? iso;

  const currentPrompt = prompts[activeTab] ?? '';
  const currentGenerations = generations[activeTab] ?? [];
  const tab = TABS.find(t => t.key === activeTab) ?? TABS[0];

  const filledPromptPreview = currentPrompt
    .replaceAll('{{profile}}', profile || '—')
    .replaceAll('{{jobTitle}}', job?.title || '—')
    .replaceAll('{{jobCompany}}', job?.company || '—')
    .replaceAll('{{jobLocation}}', job?.location || '—')
    .replaceAll('{{jobDescription}}', job?.details?.description || '—')
    .replaceAll('{{jobSkills}}', job?.details?.skills?.join(', ') || '—');

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

      <div className="flex gap-1 border-b border-orange-200">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabChange(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'border-b-2 border-orange-900 text-orange-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-5 shadow-lg backdrop-blur">
        <h2 className="text-lg font-semibold text-gray-900">{tab.label}</h2>
        <Text variant="muted" className="mt-1">
          {tab.desc}
        </Text>

        <div className="mt-4 space-y-3">
          <details className="rounded-md border border-orange-200 bg-orange-50/60">
            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide text-orange-900">
              Profil envoyé
            </summary>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap border-t border-orange-200 px-3 py-2 text-xs text-gray-700">
              {profile || '— (aucun profil renseigné)'}
            </pre>
          </details>
          <details className="rounded-md border border-orange-200 bg-orange-50/60">
            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide text-orange-900">
              Offre envoyée
            </summary>
            <div className="max-h-64 overflow-auto border-t border-orange-200 px-3 py-2 text-xs text-gray-700">
              <p><span className="font-semibold">Titre :</span> {job?.title ?? '—'}</p>
              <p><span className="font-semibold">Entreprise :</span> {job?.company ?? '—'}</p>
              <p><span className="font-semibold">Lieu :</span> {job?.location ?? '—'}</p>
              <p className="mt-2 font-semibold">Description :</p>
              <pre className="whitespace-pre-wrap">{job?.details?.description ?? '—'}</pre>
              <p className="mt-2 font-semibold">Compétences :</p>
              <p>{job?.details?.skills?.join(', ') || '—'}</p>
            </div>
          </details>
        </div>

        {promptsLoaded.has(activeTab) && (
          <>
            <textarea
              value={currentPrompt}
              onChange={e => setPrompts(prev => ({ ...prev, [activeTab]: e.target.value }))}
              rows={12}
              className="mt-4 w-full rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-xs font-mono text-gray-900 shadow-sm
                focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={provider}
                onChange={e => setProvider(e.target.value as Provider)}
                className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-gray-900
                  focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
              >
                {PROVIDERS.map(p => (
                  <option key={p} value={p}>
                    {p === 'claude' ? 'Claude (API)' : 'Ollama (local)'}
                  </option>
                ))}
              </select>
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

            <details className="mt-3 rounded-md border border-orange-200 bg-orange-50/60">
              <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide text-orange-900">
                Prompt final (ce qui sera envoyé au LLM)
              </summary>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap border-t border-orange-200 px-3 py-2 text-xs text-gray-700">
                {filledPromptPreview}
              </pre>
            </details>
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

      {currentGenerations.length > 0 && (
        <div className="rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-5 shadow-lg backdrop-blur">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('generate.history', { defaultValue: 'Historique' })}
          </h2>
          <div className="mt-3 space-y-3">
            {currentGenerations.map(gen => (
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
