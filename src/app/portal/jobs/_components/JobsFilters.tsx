'use client';

import { useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';

interface Props {
  readonly companies: string[];
  readonly sources: string[];
  readonly search: string;
  readonly filterCompany: string;
  readonly filterSource: string;
  readonly filterLocation: string;
  readonly unseenOnly: boolean;
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

export function JobsFilters({
  companies,
  sources,
  search,
  filterCompany,
  filterSource,
  filterLocation,
  unseenOnly,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const [searchDirty, setSearchDirty] = useState(false);
  const [locationDirty, setLocationDirty] = useState(false);

  const navigate = (updates: Record<string, string | undefined>) => {
    const qs = updateParams(searchParams, { ...updates, page: '0' });
    router.push(`${pathname}?${qs}`);
  };

  const submitSearch = () => {
    const value = searchRef.current?.value ?? '';
    navigate({ search: value || undefined });
    setSearchDirty(false);
  };

  const submitLocation = () => {
    const value = locationRef.current?.value ?? '';
    navigate({ location: value || undefined });
    setLocationDirty(false);
  };

  const hasFilters = filterCompany || filterSource || filterLocation || search || unseenOnly;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <input
          ref={searchRef}
          type="text"
          placeholder={t('jobs.list.search', { defaultValue: 'Rechercher...' })}
          defaultValue={search}
          onChange={e => setSearchDirty(e.target.value !== search)}
          onKeyDown={e => e.key === 'Enter' && submitSearch()}
          className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-gray-900 shadow-sm
            focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
        />
        {searchDirty && (
          <button
            type="button"
            onClick={submitSearch}
            className="rounded-md bg-orange-900 px-3 py-2 text-sm font-medium text-white hover:bg-orange-800"
          >
            OK
          </button>
        )}
      </div>

      <select
        value={filterCompany}
        onChange={e => navigate({ company: e.target.value || undefined })}
        className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-gray-900 shadow-sm
          focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
      >
        <option value="">
          {t('jobs.list.allCompanies', { defaultValue: 'Toutes les entreprises' })}
        </option>
        {companies.map(c => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <input
          ref={locationRef}
          type="text"
          placeholder={t('jobs.list.location', { defaultValue: 'Lieu...' })}
          defaultValue={filterLocation}
          onChange={e => setLocationDirty(e.target.value !== filterLocation)}
          onKeyDown={e => e.key === 'Enter' && submitLocation()}
          className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-gray-900 shadow-sm
            focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
        />
        {locationDirty && (
          <button
            type="button"
            onClick={submitLocation}
            className="rounded-md bg-orange-900 px-3 py-2 text-sm font-medium text-white hover:bg-orange-800"
          >
            OK
          </button>
        )}
      </div>

      <select
        value={filterSource}
        onChange={e => navigate({ source: e.target.value || undefined })}
        className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-gray-900 shadow-sm
          focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
      >
        <option value="">
          {t('jobs.list.allSources', { defaultValue: 'Toutes les sources' })}
        </option>
        {sources.map(s => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={unseenOnly}
          onChange={e => navigate({ unseen: e.target.checked ? '1' : undefined })}
          className="rounded border-orange-300 text-orange-800 focus:ring-orange-400"
        />
        {t('jobs.list.unseenOnly', { defaultValue: 'Non vues uniquement' })}
      </label>

      {hasFilters && (
        <button
          type="button"
          onClick={() =>
            navigate({
              company: undefined,
              source: undefined,
              search: undefined,
              location: undefined,
              unseen: undefined,
            })
          }
          className="text-sm text-orange-700 underline hover:text-orange-900"
        >
          {t('jobs.list.clearFilters', { defaultValue: 'Réinitialiser' })}
        </button>
      )}
    </div>
  );
}
