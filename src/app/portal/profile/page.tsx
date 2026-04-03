'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';

export default function ProfilePage() {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(json => {
        setContent(json.content ?? '');
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900">
        {t('profile.title', { defaultValue: 'Mon profil' })}
      </h1>

      <div className="mt-6 rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-5 shadow-lg backdrop-blur">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('profile.cvTitle', { defaultValue: 'CV / Parcours' })}
        </h2>
        <Text variant="muted" className="mt-1">
          {t('profile.cvDesc', {
            defaultValue:
              'Colle ici ton CV ou décris ton parcours. Ces informations seront utilisées pour générer des contenus personnalisés (en-tête CV, lettre de motivation, etc.).',
          })}
        </Text>

        {loading ? (
          <Text variant="muted" className="mt-4">
            {t('common.loading', { defaultValue: 'Chargement...' })}
          </Text>
        ) : (
          <>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={20}
              className="mt-4 w-full rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-gray-900 shadow-sm
                focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
              placeholder={t('profile.cvPlaceholder', {
                defaultValue: 'Ex: Développeur Full Stack avec 5 ans d\'expérience en React, Node.js, PostgreSQL...',
              })}
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-orange-900 px-6 py-2 text-sm font-medium text-white hover:bg-orange-800 disabled:opacity-50"
              >
                {saving
                  ? t('common.saving', { defaultValue: 'Enregistrement...' })
                  : t('common.save', { defaultValue: 'Enregistrer' })}
              </button>
              {saved && (
                <Text variant="sm" className="text-green-700">
                  {t('common.saved', { defaultValue: 'Enregistré' })}
                </Text>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
