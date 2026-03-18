import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildNormalized } from '@/lib/jobs/buildNormalized';

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, company, location, sourceUrl, source } = body;

  if (!title || !company || !sourceUrl) {
    return NextResponse.json({ error: 'title, company and sourceUrl are required' }, { status: 400 });
  }

  const normalized = buildNormalized({
    title,
    company,
    location: location ?? null,
    sourceUrl,
    source: source || 'manual',
    dateText: null,
    scrapedAt: new Date().toISOString(),
  });

  const { data: existing } = await supabase
    .from('jobs')
    .select('id')
    .eq('user_id', auth.user.id)
    .eq('fingerprint', normalized.fingerprint)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Cette offre existe déjà' }, { status: 409 });
  }

  const { error: insErr } = await supabase.from('jobs').insert({
    user_id: auth.user.id,
    fingerprint: normalized.fingerprint,
    title: normalized.title,
    company: normalized.company,
    location: normalized.location,
    source: normalized.source,
    source_url: normalized.source_url,
    scraped_at: normalized.scraped_at,
    raw: normalized.raw ?? null,
  });

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
