'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/text';

type ReapplyResult = { scanned: number; dismissed: number; restored: number };

export function ReapplyPanel() {
  const router = useRouter();
  const [reapplying, setReapplying] = useState(false);
  const [result, setResult] = useState<ReapplyResult | null>(null);

  const handleReapply = async () => {
    setReapplying(true);
    setResult(null);
    const res = await fetch('/api/jobs/filters/reapply', { method: 'POST' });
    const json = await res.json();
    setReapplying(false);
    if (json.ok) {
      setResult({ scanned: json.scanned, dismissed: json.dismissed, restored: json.restored });
      router.refresh();
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Ré-appliquer aux offres existantes</h2>
      <Text variant="muted">
        Quand tu modifies les règles, elles ne s&apos;appliquent qu&apos;aux nouvelles offres importées.
        Lance ce bouton pour ré-évaluer toutes tes offres actuelles.
      </Text>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleReapply}
          disabled={reapplying}
          className="rounded-md bg-orange-100 px-4 py-2 text-sm font-medium text-orange-900 hover:bg-orange-200 disabled:opacity-50"
        >
          {reapplying ? 'Ré-application...' : 'Ré-appliquer maintenant'}
        </button>
        {result && (
          <Text variant="sm" className="text-gray-700">
            {result.scanned} offres scannées · {result.dismissed} masquées · {result.restored} restaurées
          </Text>
        )}
      </div>
    </div>
  );
}
