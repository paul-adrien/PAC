import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId') ?? '';
  const type = searchParams.get('type') ?? '';

  if (!jobId) return NextResponse.json({ error: 'jobId is required' }, { status: 400 });

  let query = supabase
    .from('generations')
    .select('id, type, result, created_at')
    .eq('user_id', auth.user.id)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (type) query = query.eq('type', type);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ generations: data ?? [] });
}
