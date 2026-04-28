import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50));
  const unseenOnly = searchParams.get('unseen') === '1';

  let query = supabase
    .from('jobs')
    .select('id, title, company, location, source, source_url, auto_dismissed_at, auto_dismissed_reason, viewed_at', {
      count: 'exact',
    })
    .eq('user_id', auth.user.id)
    .not('auto_dismissed_at', 'is', null);

  if (unseenOnly) query = query.is('viewed_at', null);

  const { data: rows, count, error } = await query
    .order('auto_dismissed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, jobs: rows ?? [], totalCount: count ?? 0 });
}
