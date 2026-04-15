'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';
import {
  DEFAULT_PROMPTS,
  PROVIDERS,
  type Provider,
  type GenerationType,
} from '@/lib/generate/constants';
import { extractProfileSummary } from '@/lib/generate/profile';
import { fillPrompt } from '@/lib/generate/template';

type JobSummary = {
  title: string;
  company: string;
  location: string | null;
  details: { description?: string; skills?: string[] } | null;
};

type OfferExtract = {
  role?: string;
  seniority?: string;
  topSkills?: string[];
  fullStack?: string[];
  mainMission?: string;
  productContext?: string;
  companyFocus?: string;
  teamCulture?: string;
  candidateQualities?: string[];
};

interface Props {
  readonly jobId: string;
  readonly activeTab: GenerationType;
  readonly job: JobSummary | null;
  readonly profile: string;
  readonly onGenerated: () => void;
}

const OFFER_EXTRACT_PLACEHOLDER = '[extrait dynamiquement de l\'offre au moment de la génération]';
const OFFER_EXTRACT_KEYS = [
  'offerRole',
  'offerSeniority',
  'offerMission',
  'offerProductContext',
  'offerCompanyFocus',
  'offerTeamCulture',
  'offerTopSkills',
  'offerFullStack',
  'offerCandidateQualities',
] as const;
const OFFER_EXTRACT_PREVIEW_VARS = Object.fromEntries(
  OFFER_EXTRACT_KEYS.map(k => [k, OFFER_EXTRACT_PLACEHOLDER]),
);

export function PromptEditor({ jobId, activeTab, job, profile, onGenerated }: Props) {
  const { t } = useTranslation();
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [promptsLoaded, setPromptsLoaded] = useState<Set<string>>(new Set());
  const [provider, setProvider] = useState<Provider>('claude');
  const [generating, setGenerating] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offerExtract, setOfferExtract] = useState<OfferExtract | null>(null);
  const [resultCopied, setResultCopied] = useState(false);

  useEffect(() => {
    if (promptsLoaded.has(activeTab)) return;
    fetch(`/api/prompts?type=${activeTab}`)
      .then(r => r.json())
      .then(json => {
        setPrompts(prev => ({ ...prev, [activeTab]: json.content ?? DEFAULT_PROMPTS[activeTab] }));
        setPromptsLoaded(prev => new Set(prev).add(activeTab));
      });
  }, [activeTab, promptsLoaded]);

  useEffect(() => {
    setResult(null);
    setError(null);
    setOfferExtract(null);
  }, [activeTab]);

  const currentPrompt = prompts[activeTab] ?? '';

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);
    setOfferExtract(null);

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: activeTab, jobId, prompt: currentPrompt, provider }),
    });

    const json = await res.json();
    setGenerating(false);

    if (!res.ok || !json.ok) {
      setError(json.error ?? 'Erreur');
      return;
    }

    setResult(json.result);
    if (json.offerExtract) setOfferExtract(json.offerExtract);
    onGenerated();
  };

  const handleSavePrompt = async () => {
    await fetch('/api/prompts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: activeTab, content: currentPrompt }),
    });
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 2000);
  };

  const handleResetPrompt = () => {
    setPrompts(prev => ({ ...prev, [activeTab]: DEFAULT_PROMPTS[activeTab] }));
  };

  const handleCopyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setResultCopied(true);
    setTimeout(() => setResultCopied(false), 2000);
  };

  if (!promptsLoaded.has(activeTab)) return null;

  const profileSummary = extractProfileSummary(profile) || profile;
  const filledPromptPreview = fillPrompt(currentPrompt, {
    profile,
    profileSummary,
    jobTitle: job?.title ?? '',
    jobCompany: job?.company ?? '',
    jobLocation: job?.location ?? '',
    jobDescription: job?.details?.description ?? '',
    jobSkills: job?.details?.skills?.join(', ') ?? '',
    ...OFFER_EXTRACT_PREVIEW_VARS,
  });

  return (
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

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50/90 p-4">
          <Text variant="danger">{error}</Text>
        </div>
      )}

      {offerExtract && (offerExtract.role || offerExtract.mainMission) && (
        <details className="mt-4 rounded-md border border-blue-200 bg-blue-50/60" open>
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide text-blue-900">
            Points clés extraits de l'offre (étape 1 du pipeline)
          </summary>
          <div className="border-t border-blue-200 px-3 py-2 space-y-1">
            {[
              ['Rôle', offerExtract.role],
              ['Niveau', offerExtract.seniority],
              ['Mission', offerExtract.mainMission],
              ['Produit / contexte', offerExtract.productContext],
              ['Entreprise', offerExtract.companyFocus],
              ['Culture d\'équipe', offerExtract.teamCulture],
              ['Compétences clés', offerExtract.topSkills?.join(', ')],
              ['Stack complète', offerExtract.fullStack?.join(', ')],
              ['Qualités recherchées', offerExtract.candidateQualities?.join(', ')],
            ].map(([label, value]) => (
              <Text key={label} variant="xs">
                <span className="font-semibold">{label} :</span> {value || '—'}
              </Text>
            ))}
          </div>
        </details>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50/90 p-4">
          <div className="flex items-start justify-between gap-2">
            <Text variant="sm" className="whitespace-pre-wrap">{result}</Text>
            <button
              type="button"
              onClick={handleCopyResult}
              className="shrink-0 rounded-md border border-green-300 bg-white px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-50"
            >
              {resultCopied ? 'Copié !' : 'Copier'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
