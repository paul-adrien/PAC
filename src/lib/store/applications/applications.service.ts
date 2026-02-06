import { supabaseBrowser } from '@/lib/supabase/browser';
import { z } from 'zod';
import { APPLICATION_STATUSES } from '@/lib/domain/application';
import type { Application } from '@/lib/domain/application';
import type { UUID } from '@/lib/domain/common';

type NewApplication = Omit<Application, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateApplication = Partial<Omit<Application, 'id' | 'userId' | 'createdAt'>> & { id: UUID };

const applicationRowSchema = z
  .object({
    id: z.string(),
    user_id: z.string(),
    company: z.string(),
    title: z.string(),
    location: z.string().nullable(),
    job_url: z.string().nullable(),
    notes: z.string().nullable(),
    stars: z.number().nullable(),
    status: z.enum(APPLICATION_STATUSES),
    applied_at: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .transform(row => ({
    id: row.id as UUID,
    userId: row.user_id as UUID,
    company: row.company,
    title: row.title,
    location: row.location,
    jobUrl: row.job_url,
    notes: row.notes,
    stars: row.stars,
    status: row.status,
    appliedAt: row.applied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }) satisfies Application);

export const applicationsService = {
  async list(userId: UUID) {
    const supabase = supabaseBrowser();
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const parsed = applicationRowSchema.array().parse(data ?? []);
    return parsed;
  },

  async create(input: NewApplication) {
    const supabase = supabaseBrowser();
    const { data, error } = await supabase
      .from('applications')
      .insert({
        user_id: input.userId,
        company: input.company,
        title: input.title,
        location: input.location,
        job_url: input.jobUrl,
        status: input.status,
        applied_at: input.appliedAt,
        stars: input.stars,
        notes: input.notes,
      })
      .select('*')
      .single();
    if (error) throw error;
    const parsed = applicationRowSchema.parse(data);
    return parsed;
  },

  async update(input: UpdateApplication) {
    const supabase = supabaseBrowser();
    const { id, ...patch } = input;
    const { data, error } = await supabase
      .from('applications')
      .update({
        ...(patch.company !== undefined ? { company: patch.company } : {}),
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.location !== undefined ? { location: patch.location } : {}),
        ...(patch.jobUrl !== undefined ? { job_url: patch.jobUrl } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.appliedAt !== undefined ? { applied_at: patch.appliedAt } : {}),
        ...(patch.stars !== undefined ? { stars: patch.stars } : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    const parsed = applicationRowSchema.parse(data);
    return parsed;
  },

  async remove(id: UUID) {
    const supabase = supabaseBrowser();
    const { error } = await supabase.from('applications').delete().eq('id', id);
    if (error) throw error;
  },
};
