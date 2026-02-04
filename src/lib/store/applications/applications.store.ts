'use client';

import { create } from 'zustand';
import type { Application, ApplicationStatus } from '@/lib/domain/application';
import type { UUID } from '@/lib/domain/common';
import { applicationsService } from '@/lib/store/applications/applications.service';
import type { NewApplicationForm } from '@/app/portal/new-application/page';

type ApplicationsState = {
  applications: Application[];
  loading: boolean;
  error: string | null;

  fetchAll: (userId: UUID) => Promise<void>;
  create: (input: NewApplicationForm, userId: string) => Promise<void>;
  setStatus: (id: UUID, status: ApplicationStatus) => Promise<void>;
  remove: (id: UUID) => Promise<void>;
};

export const useApplicationsStore = create<ApplicationsState>((set, get) => ({
  applications: [],
  loading: false,
  error: null,

  fetchAll: async userId => {
    set({ loading: true, error: null });
    try {
      const apps = await applicationsService.list(userId);
      console.log('applications', apps);
      set({ applications: apps, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'fetch failed' });
    }
  },

  create: async (input, userId) => {
    set({ loading: true, error: null });
    try {
      const created = await applicationsService.create({
        userId: userId,
        company: input.company,
        title: input.title,
        location: input.location ?? null,
        jobUrl: input.jobUrl ?? null,
        status: input.status,
        notes: input.notes ?? null,
        stars: input.stars ?? null,
        appliedAt: input.appliedAt ?? null,
      });
      set({ applications: [created, ...get().applications], loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'create failed' });
    }
  },

  setStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const updated = await applicationsService.update({ id, status });
      set({
        applications: get().applications.map(a => (a.id === id ? updated : a)),
        loading: false,
      });
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'update failed' });
    }
  },

  remove: async id => {
    set({ loading: true, error: null });
    try {
      await applicationsService.remove(id);
      set({ applications: get().applications.filter(a => a.id !== id), loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'delete failed' });
    }
  },
}));
