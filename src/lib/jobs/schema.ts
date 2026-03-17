import { z } from 'zod';

export const JobInputSchema = z.object({
  title: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().optional().nullable(),
  sourceUrl: z.string().url(),
  dateText: z.string().optional().nullable(),
  source: z.string(),
  scrapedAt: z.string().datetime().optional().nullable(),
});

export const JobInputArraySchema = z.array(JobInputSchema);

/** Format wrapper de l'extension Chrome : { exportedAt, count, offers: [...] } */
export const JobExportFileSchema = z.object({
  exportedAt: z.string().datetime(),
  count: z.number(),
  offers: JobInputArraySchema,
});

/** Accepte les deux formats : tableau direct ou objet { offers } */
export function parseJobExportJSON(jsonText: string): z.infer<typeof JobInputSchema>[] {
  const parsed = JSON.parse(jsonText);

  if (Array.isArray(parsed)) {
    return JobInputArraySchema.parse(parsed);
  }

  const file = JobExportFileSchema.parse(parsed);
  return file.offers;
}

// Ce qu'on stocke réellement en DB (normalisé)
export const JobNormalizedSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().nullable(),

  source: z.string().min(1),
  source_url: z.url(),

  scraped_at: z.iso.datetime().nullable(),

  // fingerprint computed
  fingerprint: z.string().min(1),

  // raw optional
  raw: z.unknown().optional(),
});

export type JobInput = z.infer<typeof JobInputSchema>;
export type JobNormalized = z.infer<typeof JobNormalizedSchema>;
