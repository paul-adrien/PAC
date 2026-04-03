import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId') ?? '';

  if (!jobId) return NextResponse.json({ error: 'jobId is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    job: {
      id: data.id,
      userId: data.user_id,
      fingerprint: data.fingerprint,
      title: data.title,
      company: data.company,
      location: data.location,
      source: data.source,
      sourceUrl: data.source_url,
      firstSeenAt: data.first_seen_at,
      lastSeenAt: data.last_seen_at,
      scrapedAt: data.scraped_at,
      viewedAt: data.viewed_at,
      appliedAt: data.applied_at,
      dismissedAt: data.dismissed_at,
      details: data.details ?? null,
      raw: data.raw,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
}
