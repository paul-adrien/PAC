import { create } from 'zustand';
import type { Job } from '@/lib/domain';

type AuditListState = {
  viewedIds: Set<string>;
  restoredIds: Set<string>;

  markAsViewed: (jobId: string) => void;
  restoreJob: (jobId: string) => Promise<boolean>;
  restoreAll: () => Promise<boolean>;
  visibleJobs: (initialJobs: Job[]) => Job[];
  reset: () => void;
};

const initialState = {
  viewedIds: new Set<string>(),
  restoredIds: new Set<string>(),
};

export const useAuditListStore = create<AuditListState>((set, get) => ({
  ...initialState,

  markAsViewed: (jobId) => {
    set(s => ({ viewedIds: new Set(s.viewedIds).add(jobId) }));
    fetch('/api/jobs/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
  },

  restoreJob: async (jobId) => {
    set(s => ({ restoredIds: new Set(s.restoredIds).add(jobId) }));
    const res = await fetch('/api/jobs/filters/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    return res.ok;
  },

  restoreAll: async () => {
    const res = await fetch('/api/jobs/filters/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    return res.ok;
  },

  visibleJobs: (initialJobs) => {
    const { restoredIds } = get();
    return initialJobs.filter(j => !restoredIds.has(j.id));
  },

  reset: () => set(initialState),
}));
