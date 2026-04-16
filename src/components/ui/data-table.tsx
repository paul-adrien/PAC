'use client';

import type { ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export type Column<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (row: T) => ReactNode;
};

interface Props<T> {
  readonly data: T[];
  readonly columns: Column<T>[];
  readonly rowKey: (row: T) => string;
  readonly totalCount: number;
  readonly page: number;
  readonly perPage: number;
  readonly sortKey: string;
  readonly sortDir: 'asc' | 'desc';
  readonly perPageOptions?: number[];
  readonly emptyMessage?: string;
  readonly expandedKey?: string | null;
  readonly onRowClick?: (row: T) => void;
  readonly renderExpanded?: (row: T) => ReactNode;
  readonly skeletonCount?: number;
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

export function DataTable<T>({
  data,
  columns,
  rowKey,
  totalCount,
  page,
  perPage,
  sortKey,
  sortDir,
  perPageOptions = [10, 25, 50],
  emptyMessage = 'Aucun résultat.',
  expandedKey,
  onRowClick,
  renderExpanded,
  skeletonCount = 0,
}: Props<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  const navigate = (updates: Record<string, string | undefined>) => {
    const qs = updateParams(searchParams, updates);
    router.push(`${pathname}?${qs}`);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      navigate({ sortDir: sortDir === 'asc' ? 'desc' : 'asc', page: '0' });
    } else {
      navigate({ sortKey: key, sortDir: 'asc', page: '0' });
    }
  };

  const sortIcon = (key: string) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  if (totalCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-orange-300 bg-white/80 px-6 py-10 text-center">
        <p className="text-sm font-medium text-gray-700">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-orange-100 text-gray-600">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium ${col.sortable ? 'cursor-pointer hover:text-orange-800' : ''} ${col.className ?? ''}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  {col.header}
                  {col.sortable && sortIcon(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(row => {
              const key = rowKey(row);
              const isExpanded = expandedKey === key;
              return (
                <>
                  <tr
                    key={key}
                    className={`border-b border-orange-50 ${onRowClick ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-orange-50' : 'hover:bg-orange-50/50'}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map(col => (
                      <td key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && renderExpanded && (
                    <tr key={`${key}-expanded`} className="bg-orange-50/50">
                      <td colSpan={columns.length} className="px-4 py-4">
                        {renderExpanded(row)}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {Array.from({ length: skeletonCount }, (_, i) => (
              <tr key={`skeleton-${i}`} className="border-b border-orange-50 animate-pulse">
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                    <div className="h-4 w-3/4 rounded bg-gray-200/70" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-end gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>{totalCount} éléments</span>
          <select
            value={perPage}
            onChange={e => navigate({ perPage: e.target.value, page: '0' })}
            className="rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-sm text-gray-900
              focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
          >
            {perPageOptions.map(n => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => navigate({ page: String(page - 1) })}
            className="rounded-md px-2 py-1 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ←
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => navigate({ page: String(page + 1) })}
            className="rounded-md px-2 py-1 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
