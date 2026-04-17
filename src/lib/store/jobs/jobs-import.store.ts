import { create } from 'zustand';

type PreviewSample = {
  title: string;
  company: string;
  location: string | null;
  source: string;
};

export type PreviewResult = {
  total_in_file: number;
  valid: number;
  skipped: number;
  unique_in_file: number;
  samples: PreviewSample[];
};

export type ImportResult = {
  total_in_file: number;
  valid: number;
  skipped: number;
  unique_in_file: number;
  inserted: number;
  updated_last_seen: number;
};

export type ImportStep =
  | { step: 'pick' }
  | { step: 'previewing' }
  | { step: 'previewed'; preview: PreviewResult }
  | { step: 'importing' }
  | { step: 'done'; result: ImportResult }
  | { step: 'error'; message: string };

type JobsImportState = {
  open: boolean;
  file: File | null;
  state: ImportStep;

  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  preview: (file: File) => Promise<void>;
  importFile: () => Promise<boolean>;
  reset: () => void;
};

const initialState = {
  open: false,
  file: null as File | null,
  state: { step: 'pick' as const },
};

export const useJobsImportStore = create<JobsImportState>((set, get) => ({
  ...initialState,

  setOpen: (open) => set({ open }),

  toggleOpen: () => set(s => ({ open: !s.open })),

  preview: async (file) => {
    set({ file, state: { step: 'previewing' } });

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/jobs/preview', { method: 'POST', body: form });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        set({ state: { step: 'error', message: json.error ?? 'Preview failed' } });
        return;
      }

      set({ state: { step: 'previewed', preview: json.result } });
    } catch {
      set({ state: { step: 'error', message: 'Network error' } });
    }
  },

  importFile: async () => {
    const file = get().file;
    if (!file) return false;

    set({ state: { step: 'importing' } });

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/jobs/import', { method: 'POST', body: form });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        set({ state: { step: 'error', message: json.error ?? 'Import failed' } });
        return false;
      }

      set({ state: { step: 'done', result: json.result } });
      return true;
    } catch {
      set({ state: { step: 'error', message: 'Network error' } });
      return false;
    }
  },

  reset: () => set({ file: null, state: { step: 'pick' } }),
}));
