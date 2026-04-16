import { create } from 'zustand';
import type { Job } from '@/lib/domain';

type FilterParams = {
  page: number;
  perPage: number;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  search: string;
  filterCompany: string;
  filterSource: string;
  unseenOnly: boolean;
  appliedFilter: string;
};

type JobsListState = {
  viewedIds: Set<string>;
  appliedIds: Set<string>;
  dismissedIds: Set<string>;
  dismissedCompanies: Set<string>;
  expandedId: string | null;
  refreshedJobs: Map<string, Job>;
  extraJobs: Job[];
  loadingReplacements: number;

  setExpandedId: (id: string | null) => void;
  toggleExpandedId: (id: string) => void;
  markAsViewed: (jobId: string) => void;
  toggleApply: (job: Job) => void;
  dismissJob: (job: Job, params: FilterParams, initialJobs: Job[]) => void;
  dismissCompany: (company: string, allJobs: Job[], params: FilterParams, initialJobs: Job[]) => void;
  refreshJob: (jobId: string) => Promise<void>;
  getJob: (job: Job) => Job;
  visibleJobs: (initialJobs: Job[]) => Job[];
  reset: () => void;
};

const initialState = {
  viewedIds: new Set<string>(),
  appliedIds: new Set<string>(),
  dismissedIds: new Set<string>(),
  dismissedCompanies: new Set<string>(),
  expandedId: null as string | null,
  refreshedJobs: new Map<string, Job>(),
  extraJobs: [] as Job[],
  loadingReplacements: 0,
};

let queue = Promise.resolve();

function buildQuery(params: FilterParams) {
  return new URLSearchParams({
    sortKey: params.sortKey,
    sortDir: params.sortDir,
    search: params.search,
    company: params.filterCompany,
    source: params.filterSource,
    unseen: params.unseenOnly ? '1' : '0',
    ...(params.appliedFilter ? { applied: params.appliedFilter } : {}),
  });
}

function computeVisibleCount(state: JobsListState, initialJobs: Job[]) {
  const { extraJobs, dismissedIds, dismissedCompanies } = state;
  return [...initialJobs, ...extraJobs].filter(
    j => !dismissedIds.has(j.id) && !dismissedCompanies.has(j.company),
  ).length;
}

async function fetchReplacementAt(
  params: FilterParams,
  offset: number,
  knownIds: Set<string>,
): Promise<Job | null> {
  const qs = buildQuery(params);
  qs.set('offset', String(offset));
  qs.set('limit', '1');
  const res = await fetch(`/api/jobs/list?${qs.toString()}`);
  if (!res.ok) return null;
  const { jobs } = (await res.json()) as { jobs: Job[] };
  if (jobs.length === 0) return null;
  const fresh = jobs.filter(j => !knownIds.has(j.id));
  return fresh[0] ?? null;
}

function allKnownIds(state: JobsListState, initialJobs: Job[]) {
  return new Set([...initialJobs, ...state.extraJobs].map(j => j.id));
}

export const useJobsListStore = create<JobsListState>((set, get) => ({
  ...initialState,

  setExpandedId: (id) => set({ expandedId: id }),

  toggleExpandedId: (id) => set(s => ({ expandedId: s.expandedId === id ? null : id })),

  markAsViewed: (jobId) => {
    set(s => ({ viewedIds: new Set(s.viewedIds).add(jobId) }));
    fetch('/api/jobs/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
  },

  toggleApply: (job) => {
    const { appliedIds, dismissedIds } = get();
    const isCurrentlyApplied = (job.appliedAt !== null || appliedIds.has(job.id)) && !dismissedIds.has(job.id);
    if (isCurrentlyApplied) {
      set(s => {
        const next = new Set(s.appliedIds);
        next.delete(job.id);
        return { appliedIds: next };
      });
    } else {
      set(s => ({ appliedIds: new Set(s.appliedIds).add(job.id) }));
    }
    fetch('/api/jobs/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl: job.sourceUrl }),
    });
  },

  dismissJob: (job, params, initialJobs) => {
    set(s => ({
      dismissedIds: new Set(s.dismissedIds).add(job.id),
      expandedId: null,
      loadingReplacements: s.loadingReplacements + 1,
    }));

    queue = queue.then(async () => {
      await fetch('/api/jobs/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });

      const state = get();
      const offset = params.page * params.perPage + computeVisibleCount(state, initialJobs);
      const newJob = await fetchReplacementAt(params, offset, allKnownIds(state, initialJobs));

      set(s => ({
        loadingReplacements: Math.max(0, s.loadingReplacements - 1),
        ...(newJob ? { extraJobs: [...s.extraJobs, newJob] } : {}),
      }));
    });
  },

  dismissCompany: (company, allJobs, params, initialJobs) => {
    const { dismissedIds } = get();
    const toReplace = allJobs.filter(j => j.company === company && !dismissedIds.has(j.id)).length;

    set(s => ({
      dismissedCompanies: new Set(s.dismissedCompanies).add(company),
      expandedId: null,
      loadingReplacements: s.loadingReplacements + toReplace,
    }));

    queue = queue.then(async () => {
      await fetch('/api/companies/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company }),
      });

      for (let i = 0; i < toReplace; i++) {
        const state = get();
        const offset = params.page * params.perPage + computeVisibleCount(state, initialJobs);
        const newJob = await fetchReplacementAt(params, offset, allKnownIds(state, initialJobs));

        set(s => ({
          loadingReplacements: Math.max(0, s.loadingReplacements - 1),
          ...(newJob ? { extraJobs: [...s.extraJobs, newJob] } : {}),
        }));
      }
    });
  },

  refreshJob: async (jobId) => {
    const res = await fetch(`/api/jobs/detail?jobId=${jobId}`);
    if (!res.ok) return;
    const { job } = await res.json();
    set(s => ({ refreshedJobs: new Map(s.refreshedJobs).set(jobId, job) }));
  },

  getJob: (job) => get().refreshedJobs.get(job.id) ?? job,

  visibleJobs: (initialJobs) => {
    const { extraJobs, dismissedIds, dismissedCompanies } = get();
    return [...initialJobs, ...extraJobs].filter(
      j => !dismissedIds.has(j.id) && !dismissedCompanies.has(j.company),
    );
  },

  reset: () => {
    queue = Promise.resolve();
    set(initialState);
  },
}));
