'use client';

import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { useTranslation } from '@/lib/i18n';
import { Text } from '@/components/ui/text';

type Token = {
  id: string;
  label: string;
  created_at: string;
  last_used_at: string | null;
};

export default function SettingsPage() {
  const { t } = useTranslation();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchTokens = async () => {
    const res = await fetch('/api/tokens');
    const json = await res.json();
    if (json.tokens) setTokens(json.tokens);
    setLoading(false);
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleGenerate = async () => {
    const res = await fetch('/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'Extension Chrome' }),
    });
    const json = await res.json();
    if (json.token) {
      setNewToken(json.token);
      fetchTokens();
    }
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/tokens', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setTokens(prev => prev.filter(t => t.id !== id));
  };

  const handleCopy = async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (iso: string) => DateTime.fromISO(iso).toRelative({ locale: 'fr' }) ?? iso;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900">
        {t('settings.title', { defaultValue: 'Paramètres' })}
      </h1>

      <div className="mt-6 rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-5 shadow-lg backdrop-blur">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('settings.apiTokens', { defaultValue: 'Tokens API' })}
        </h2>
        <Text variant="muted" className="mt-1">
          {t('settings.apiTokensDesc', {
            defaultValue: "Génère un token pour connecter l'extension Chrome à ton compte.",
          })}
        </Text>

        {newToken && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50/90 p-4">
            <Text variant="sm" className="font-semibold text-green-800">
              {t('settings.tokenCreated', { defaultValue: 'Token créé — copie-le maintenant, il ne sera plus affiché.' })}
            </Text>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-white px-3 py-2 text-xs text-gray-900 border border-green-200">
                {newToken}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-600"
              >
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4">
          <button
            type="button"
            onClick={handleGenerate}
            className="rounded-md bg-orange-900 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800"
          >
            {t('settings.generateToken', { defaultValue: 'Générer un token' })}
          </button>
        </div>

        {loading ? (
          <Text variant="muted" className="mt-4">
            {t('common.loading', { defaultValue: 'Chargement...' })}
          </Text>
        ) : tokens.length === 0 ? (
          <Text variant="muted" className="mt-4">
            {t('settings.noTokens', { defaultValue: 'Aucun token.' })}
          </Text>
        ) : (
          <div className="mt-4 space-y-2">
            {tokens.map(tk => (
              <div
                key={tk.id}
                className="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50/50 px-4 py-3"
              >
                <div>
                  <Text variant="sm" className="font-medium text-gray-900">{tk.label}</Text>
                  <Text variant="caption">
                    {t('settings.tokenCreatedAt', { defaultValue: 'Créé' })} {formatDate(tk.created_at)}
                    {tk.last_used_at && (
                      <> · {t('settings.tokenLastUsed', { defaultValue: 'Utilisé' })} {formatDate(tk.last_used_at)}</>
                    )}
                  </Text>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(tk.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  {t('common.delete', { defaultValue: 'Supprimer' })}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
