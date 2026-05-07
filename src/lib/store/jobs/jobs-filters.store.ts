import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type JobsFilters = {
  search: string;
  company: string;
  source: string;
  unseen: boolean;
  applied: string;
};

type State = JobsFilters & {
  set: (updates: Partial<JobsFilters>) => void;
  reset: () => void;
};

const defaults: JobsFilters = {
  search: '',
  company: '',
  source: '',
  unseen: false,
  applied: '',
};

export const useJobsFiltersStore = create<State>()(
  persist(
    set => ({
      ...defaults,
      set: updates => set(updates),
      reset: () => set(defaults),
    }),
    { name: 'pac-jobs-filters', version: 1 },
  ),
);

export function hasNonDefaultFilters(f: JobsFilters): boolean {
  return Boolean(f.search || f.company || f.source || f.unseen || f.applied);
}

export function buildFiltersQuery(f: JobsFilters): URLSearchParams {
  const qs = new URLSearchParams();
  if (f.search) qs.set('search', f.search);
  if (f.company) qs.set('company', f.company);
  if (f.source) qs.set('source', f.source);
  if (f.unseen) qs.set('unseen', '1');
  if (f.applied) qs.set('applied', f.applied);
  return qs;
}
