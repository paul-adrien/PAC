import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  jobId: z.string().uuid().optional(),
  all: z.boolean().optional(),
});

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const { jobId, all } = parsed.data;
  if (!jobId && !all) {
    return NextResponse.json({ error: 'Provide jobId or all=true' }, { status: 400 });
  }

  let query = supabase
    .from('jobs')
    .update({ auto_dismissed_at: null, auto_dismissed_reason: null })
    .eq('user_id', auth.user.id)
    .not('auto_dismissed_at', 'is', null);

  if (jobId) query = query.eq('id', jobId);

  const { data, error } = await query.select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, restored: data?.length ?? 0 });
}
