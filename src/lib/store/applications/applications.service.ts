import { supabaseBrowser } from '@/lib/supabase/browser';
import type { Application } from '@/lib/domain/application';
import type { UUID } from '@/lib/domain/common';

type NewApplication = Omit<Application, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateApplication = Partial<Omit<Application, 'id' | 'userId' | 'createdAt'>> & { id: UUID };

export const applicationsService = {
  async list(userId: UUID) {
    const supabase = supabaseBrowser();
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Application[];
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
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as Application;
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
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as Application;
  },

  async remove(id: UUID) {
    const supabase = supabaseBrowser();
    const { error } = await supabase.from('applications').delete().eq('id', id);
    if (error) throw error;
  },
};
