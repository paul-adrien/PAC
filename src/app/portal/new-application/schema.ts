import { APPLICATION_STATUSES } from '@/lib/domain';
import { z } from 'zod';

export const todayIso = () => new Date().toISOString().split('T')[0];

export const newApplicationSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  location: z.string().optional(),
  jobUrl: z.string().optional(),
  notes: z.string().nullish(),
  status: z.enum(APPLICATION_STATUSES),
  appliedAt: z
    .string()
    .optional()
    .refine(val => !val || val <= todayIso(), {
      message: 'portal.new.appliedAtFuture',
    }),
  stars: z.number().min(0).max(5).optional(),
});

export type NewApplicationForm = z.infer<typeof newApplicationSchema>;
