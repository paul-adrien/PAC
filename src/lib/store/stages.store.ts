'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Stage } from '@/lib/domain/stage';
import type { UUID } from '@/lib/domain/common';

type StagesState = {
  stages: Stage[];
  byApplicationId: (applicationId: UUID) => Stage[];
  add: (stage: Stage) => void;
  update: (id: UUID, patch: Partial<Stage>) => void;
  remove: (id: UUID) => void;
  removeByApplicationId: (applicationId: UUID) => void;
  reset: () => void;
};

export const useStagesStore = create<StagesState>()(
  persist(
    (set, get) => ({
      stages: [],
      byApplicationId: (applicationId) =>
        get()
          .stages
          .filter((s) => s.applicationId === applicationId)
          .sort((a, b) => (a.occurredAt ?? '').localeCompare(b.occurredAt ?? '')),
      add: (stage) => set((state) => ({ stages: [stage, ...state.stages] })),
      update: (id, patch) =>
        set((state) => ({
          stages: state.stages.map((s) =>
            s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s
          ),
        })),
      remove: (id) => set((state) => ({ stages: state.stages.filter((s) => s.id !== id) })),
      removeByApplicationId: (applicationId) =>
        set((state) => ({ stages: state.stages.filter((s) => s.applicationId !== applicationId) })),
      reset: () => set({ stages: [] }),
    }),
    { name: 'gc:stages', version: 1 }
  )
);
