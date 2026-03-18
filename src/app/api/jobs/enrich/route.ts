import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveUserIdFromToken } from '@/lib/auth/api-token';
import { JobEnrichRequestSchema } from '@/lib/jobs/schema';
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

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: Request) {
  const userId = await resolveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = JobEnrichRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { sourceUrl, details } = parsed.data;
  const normalizedUrl = normalizeUrl(sourceUrl);

  const supabase = createServiceClient();

  const { data: job, error: findErr } = await supabase
    .from('jobs')
    .select('id')
    .eq('user_id', userId)
    .eq('source_url', normalizedUrl)
    .maybeSingle();

  if (findErr) {
    return NextResponse.json({ error: findErr.message }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json({ error: 'Job not found for this URL' }, { status: 404 });
  }

  const { error: updateErr } = await supabase
    .from('jobs')
    .update({ details, viewed_at: new Date().toISOString() })
    .eq('id', job.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, jobId: job.id });
}
