'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';

export default function NewJobPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const title = (form.get('title') as string).trim();
    const company = (form.get('company') as string).trim();
    const location = (form.get('location') as string).trim() || null;
    const sourceUrl = (form.get('sourceUrl') as string).trim();
    const source = (form.get('source') as string).trim() || 'manual';

    if (!title || !company || !sourceUrl) {
      setError('Titre, entreprise et URL sont requis.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, company, location, sourceUrl, source }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Erreur');
        return;
      }

      router.push('/portal/jobs');
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none';

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900">
        {t('jobs.new.title', { defaultValue: 'Nouvelle offre' })}
      </h1>
      <Text variant="muted" className="mt-1">
        {t('jobs.new.subtitle', { defaultValue: 'Ajouter une offre manuellement.' })}
      </Text>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="rounded-2xl border border-orange-200/60 bg-white/90 p-6 shadow-lg backdrop-blur space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              {t('jobs.new.jobTitle', { defaultValue: 'Intitulé du poste' })} *
            </label>
            <input id="title" name="title" type="text" required className={`mt-1 ${inputClass}`} />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
              {t('jobs.new.company', { defaultValue: 'Entreprise' })} *
            </label>
            <input id="company" name="company" type="text" required className={`mt-1 ${inputClass}`} />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              {t('jobs.new.location', { defaultValue: 'Lieu' })}
            </label>
            <input id="location" name="location" type="text" className={`mt-1 ${inputClass}`} />
          </div>

          <div>
            <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700">
              {t('jobs.new.sourceUrl', { defaultValue: "URL de l'offre" })} *
            </label>
            <input id="sourceUrl" name="sourceUrl" type="url" required className={`mt-1 ${inputClass}`} />
          </div>

          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700">
              {t('jobs.new.source', { defaultValue: 'Source' })}
            </label>
            <input id="source" name="source" type="text" placeholder="linkedin, wttj, manual..." className={`mt-1 ${inputClass}`} />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50/90 p-4">
            <Text variant="danger">{error}</Text>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-orange-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-800 disabled:opacity-50"
        >
          {loading
            ? t('common.loading', { defaultValue: 'Chargement...' })
            : t('jobs.new.submit', { defaultValue: 'Ajouter' })}
        </button>
      </form>
    </div>
  );
}
