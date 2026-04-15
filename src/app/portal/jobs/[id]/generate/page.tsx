'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';
import { type GenerationType } from '@/lib/generate/constants';
import { SentContextPanels } from './_components/SentContextPanels';
import { PromptEditor } from './_components/PromptEditor';
import { GenerationHistory } from './_components/GenerationHistory';

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
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

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

  const tab = TABS.find(t => t.key === activeTab) ?? TABS[0];

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
            onClick={() => setActiveTab(t.key)}
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

        <SentContextPanels job={job} profile={profile} />

        <PromptEditor
          jobId={jobId}
          activeTab={activeTab}
          job={job}
          profile={profile}
          onGenerated={() => setHistoryRefreshKey(k => k + 1)}
        />
      </div>

      <GenerationHistory
        jobId={jobId}
        activeTab={activeTab}
        refreshKey={historyRefreshKey}
      />
    </div>
  );
}
