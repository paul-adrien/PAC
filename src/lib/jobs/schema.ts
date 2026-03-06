import { z } from 'zod';

export const JobInputSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().optional().nullable(),
  sourceUrl: z.string().url(),
  dateText: z.string().optional().nullable(),
  source: z.string(),
  scrapedAt: z.string().datetime().optional().nullable(),
});

export const JobInputArraySchema = z.array(JobInputSchema);

// Ce qu'on stocke réellement en DB (normalisé)
export const JobNormalizedSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().nullable(),

  source: z.string().min(1),
  source_url: z.string().url(),

  scraped_at: z.string().datetime().nullable(),

  // fingerprint computed
  fingerprint: z.string().min(1),

  // raw optional
  raw: z.unknown().optional(),
});

export type JobInput = z.infer<typeof JobInputSchema>;
export type JobNormalized = z.infer<typeof JobNormalizedSchema>;
