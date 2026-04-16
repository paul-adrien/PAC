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
  replacementCursor: number;

  setExpandedId: (id: string | null) => void;
  toggleExpandedId: (id: string) => void;
  markAsViewed: (jobId: string) => void;
  toggleApply: (job: Job) => void;
  dismissJob: (job: Job, params: FilterParams, initialJobs: Job[]) => void;
  dismissCompany: (company: string, allJobs: Job[], params: FilterParams, initialJobs: Job[]) => void;
  refreshJob: (jobId: string) => Promise<void>;
  getJob: (job: Job) => Job;
  isViewed: (job: Job) => boolean;
  isApplied: (job: Job) => boolean;
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
  replacementCursor: 0,
};

async function fetchReplacementJob(
  params: FilterParams,
  offset: number,
  initialJobs: Job[],
  existingExtra: Job[],
): Promise<Job | null> {
  const qs = new URLSearchParams({
    offset: String(offset),
    limit: '1',
    sortKey: params.sortKey,
    sortDir: params.sortDir,
    search: params.search,
    company: params.filterCompany,
    source: params.filterSource,
    unseen: params.unseenOnly ? '1' : '0',
    ...(params.appliedFilter ? { applied: params.appliedFilter } : {}),
  });
  const res = await fetch(`/api/jobs/list?${qs.toString()}`);
  if (!res.ok) return null;
  const { jobs: newJobs } = (await res.json()) as { jobs: Job[] };
  if (newJobs.length === 0) return null;
  const existingIds = new Set([...initialJobs, ...existingExtra].map(j => j.id));
  const deduped = newJobs.filter(j => !existingIds.has(j.id));
  return deduped[0] ?? null;
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
      replacementCursor: s.replacementCursor + 1,
    }));

    const offset = (params.page + 1) * params.perPage + get().replacementCursor - 1;

    fetch('/api/jobs/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id }),
    });

    fetchReplacementJob(params, offset, initialJobs, get().extraJobs).then(newJob => {
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
      replacementCursor: s.replacementCursor + toReplace,
    }));

    fetch('/api/companies/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company }),
    });

    const baseOffset = (params.page + 1) * params.perPage + get().replacementCursor - toReplace;
    for (let i = 0; i < toReplace; i++) {
      fetchReplacementJob(params, baseOffset + i, initialJobs, get().extraJobs).then(newJob => {
        set(s => ({
          loadingReplacements: Math.max(0, s.loadingReplacements - 1),
          ...(newJob ? { extraJobs: [...s.extraJobs, newJob] } : {}),
        }));
      });
    }
  },

  refreshJob: async (jobId) => {
    const res = await fetch(`/api/jobs/detail?jobId=${jobId}`);
    if (!res.ok) return;
    const { job } = await res.json();
    set(s => ({ refreshedJobs: new Map(s.refreshedJobs).set(jobId, job) }));
  },

  getJob: (job) => get().refreshedJobs.get(job.id) ?? job,

  isViewed: (job) => job.viewedAt !== null || get().viewedIds.has(job.id),

  isApplied: (job) => {
    const { appliedIds, dismissedIds } = get();
    return (job.appliedAt !== null || appliedIds.has(job.id)) && !dismissedIds.has(job.id);
  },

  visibleJobs: (initialJobs) => {
    const { extraJobs, dismissedIds, dismissedCompanies } = get();
    return [...initialJobs, ...extraJobs].filter(
      j => !dismissedIds.has(j.id) && !dismissedCompanies.has(j.company),
    );
  },

  reset: () => set(initialState),
}));
