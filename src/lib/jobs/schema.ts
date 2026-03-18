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

export const JobExportFileSchema = z.object({
  exportedAt: z.string().datetime(),
  count: z.number(),
  offers: JobInputArraySchema,
});

export function parseJobExportJSON(jsonText: string): z.infer<typeof JobInputSchema>[] {
  const parsed = JSON.parse(jsonText);

  if (Array.isArray(parsed)) {
    return JobInputArraySchema.parse(parsed);
  }

  const file = JobExportFileSchema.parse(parsed);
  return file.offers;
}

export const JobNormalizedSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().nullable(),
  source: z.string().min(1),
  source_url: z.url(),
  scraped_at: z.iso.datetime().nullable(),
  fingerprint: z.string().min(1),
  raw: z.unknown().optional(),
});

export const JobDetailsSchema = z.object({
  description: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
  seniorityLevel: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  skills: z.array(z.string()).optional().nullable(),
  salary: z.string().optional().nullable(),
  applicants: z.string().optional().nullable(),
  postedAt: z.string().optional().nullable(),
});

export const JobEnrichRequestSchema = z.object({
  sourceUrl: z.string().url(),
  details: JobDetailsSchema,
});

export type JobInput = z.infer<typeof JobInputSchema>;
export type JobNormalized = z.infer<typeof JobNormalizedSchema>;
export type JobDetails = z.infer<typeof JobDetailsSchema>;
export type JobEnrichRequest = z.infer<typeof JobEnrichRequestSchema>;
