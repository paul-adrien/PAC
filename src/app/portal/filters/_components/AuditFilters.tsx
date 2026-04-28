'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuditListStore } from '@/lib/store/jobs/audit-list.store';

interface Props {
  readonly unseenOnly: boolean;
  readonly auditTotal: number;
}

function updateParams(
  current: URLSearchParams,
  updates: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams(current);
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined || v === '') params.delete(k);
    else params.set(k, v);
  }
  return params.toString();
}

export function AuditFilters({ unseenOnly, auditTotal }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const restoreAll = useAuditListStore(s => s.restoreAll);
  const reset = useAuditListStore(s => s.reset);

  const navigate = (updates: Record<string, string | undefined>) => {
    const qs = updateParams(searchParams, { ...updates, page: '0' });
    router.replace(`${pathname}?${qs}`, { scroll: false });
  };

  const handleRestoreAll = async () => {
    if (!confirm(`Restaurer ${auditTotal} offre(s) auto-masquée(s) ?`)) return;
    const ok = await restoreAll();
    if (ok) {
      reset();
      router.refresh();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={unseenOnly}
          onChange={e => navigate({ unseen: e.target.checked ? '1' : undefined })}
          className="rounded border-orange-300 text-orange-800 focus:ring-orange-400"
        />
        <span>Non vues uniquement</span>
      </label>

      {auditTotal > 0 && (
        <button
          type="button"
          onClick={handleRestoreAll}
          className="rounded-md bg-white border border-orange-200 px-3 py-1.5 text-sm text-orange-900 hover:bg-orange-50"
        >
          Tout restaurer
        </button>
      )}
    </div>
  );
}
