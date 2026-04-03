import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const company = typeof body.company === 'string' ? body.company.trim() : '';
  if (!company) return NextResponse.json({ error: 'company is required' }, { status: 400 });

  const { error } = await supabase
    .from('dismissed_companies')
    .upsert({ user_id: auth.user.id, company }, { onConflict: 'user_id,company' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const company = typeof body.company === 'string' ? body.company.trim() : '';
  if (!company) return NextResponse.json({ error: 'company is required' }, { status: 400 });

  const { error } = await supabase
    .from('dismissed_companies')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('company', company);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('dismissed_companies')
    .select('company')
    .eq('user_id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ companies: (data ?? []).map(r => r.company) });
}
