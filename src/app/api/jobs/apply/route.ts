import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveUserIdFromToken } from '@/lib/auth/api-token';
import { normalizeUrl } from '@/lib/jobs/normalize';

async function resolveUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (bearerToken) {
    return resolveUserIdFromToken(bearerToken);
  }

  const supabase = createSupabaseServerClient();
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth?.user) return null;
  return auth.user.id;
}

export async function POST(req: Request) {
  const userId = await resolveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const sourceUrl = body.sourceUrl;

  if (!sourceUrl || typeof sourceUrl !== 'string') {
    return NextResponse.json({ error: 'Missing sourceUrl' }, { status: 400 });
  }

  const normalizedUrl = normalizeUrl(sourceUrl);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: job, error: findErr } = await supabase
    .from('jobs')
    .select('id, applied_at')
    .eq('user_id', userId)
    .eq('source_url', normalizedUrl)
    .maybeSingle();

  if (findErr) {
    return NextResponse.json({ error: findErr.message }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json({ error: 'Job not found for this URL' }, { status: 404 });
  }

  const appliedAt = job.applied_at ? null : new Date().toISOString();

  const { error: updateErr } = await supabase
    .from('jobs')
    .update({ applied_at: appliedAt })
    .eq('id', job.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, jobId: job.id, applied: appliedAt !== null });
}
