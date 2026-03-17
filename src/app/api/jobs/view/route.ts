import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = await req.json();
  if (!jobId || typeof jobId !== 'string') {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  const { error } = await supabase
    .from('jobs')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('user_id', auth.user.id)
    .is('viewed_at', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
