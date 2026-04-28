'use client';

import { useState } from 'react';
import { Text } from '@/components/ui/text';

type Rules = { include: string[]; exclude: string[] };

interface Props {
  readonly initialRules: Rules;
}

const inputClass =
  'flex-1 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none';

function KeywordChips({
  kind,
  list,
  onRemove,
}: {
  readonly kind: 'include' | 'exclude';
  readonly list: string[];
  readonly onRemove: (kw: string) => void;
}) {
  if (list.length === 0) return <Text variant="caption">Aucun mot-clé</Text>;

  return (
    <div className="flex flex-wrap gap-2">
      {list.map(k => (
        <span
          key={k}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            kind === 'include'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {k}
          <button
            type="button"
            onClick={() => onRemove(k)}
            className="text-current hover:opacity-70"
            aria-label={`Retirer ${k}`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

export function RulesEditor({ initialRules }: Props) {
  const [rules, setRules] = useState<Rules>(initialRules);
  const [includeDraft, setIncludeDraft] = useState('');
  const [excludeDraft, setExcludeDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const addKeyword = (kind: 'include' | 'exclude', value: string) => {
    const parts = value
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter(p => p.length > 0);
    if (parts.length === 0) return;
    setRules(prev => {
      const set = new Set(prev[kind]);
      for (const p of parts) set.add(p);
      return { ...prev, [kind]: Array.from(set) };
    });
    if (kind === 'include') setIncludeDraft('');
    else setExcludeDraft('');
  };

  const removeKeyword = (kind: 'include' | 'exclude', kw: string) => {
    setRules(prev => ({ ...prev, [kind]: prev[kind].filter(k => k !== kw) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedAt(null);
    const res = await fetch('/api/jobs/filters', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rules),
    });
    const json = await res.json();
    setSaving(false);
    if (json.ok) {
      setRules(json.rules);
      setSavedAt(new Date().toISOString());
      setTimeout(() => setSavedAt(null), 2500);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Règles</h2>
        <Text variant="caption" className="mt-1">
          Match insensible à la casse, en mot entier (word-boundary). <strong>Exclude</strong> prime : si un mot exclu apparaît dans le titre, l&apos;offre est masquée.
          Si <strong>Include</strong> est non vide, au moins un mot doit apparaître pour que l&apos;offre passe.
        </Text>
      </div>

      <div className="space-y-3">
        <label htmlFor="includeInput" className="block text-sm font-medium text-gray-700">
          Mots-clés à inclure
        </label>
        <div className="flex gap-2">
          <input
            id="includeInput"
            type="text"
            value={includeDraft}
            onChange={e => setIncludeDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword('include', includeDraft);
              }
            }}
            placeholder="ex: full stack, software engineer, senior"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => addKeyword('include', includeDraft)}
            className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
          >
            Ajouter
          </button>
        </div>
        <KeywordChips kind="include" list={rules.include} onRemove={kw => removeKeyword('include', kw)} />
      </div>

      <div className="space-y-3">
        <label htmlFor="excludeInput" className="block text-sm font-medium text-gray-700">
          Mots-clés à exclure
        </label>
        <div className="flex gap-2">
          <input
            id="excludeInput"
            type="text"
            value={excludeDraft}
            onChange={e => setExcludeDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword('exclude', excludeDraft);
              }
            }}
            placeholder="ex: lead, data scientist, devops, manager"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => addKeyword('exclude', excludeDraft)}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Ajouter
          </button>
        </div>
        <KeywordChips kind="exclude" list={rules.exclude} onRemove={kw => removeKeyword('exclude', kw)} />
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-orange-100">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-orange-900 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les règles'}
        </button>
        {savedAt && <Text variant="sm" className="text-green-700">Enregistré ✓</Text>}
      </div>
    </div>
  );
}
