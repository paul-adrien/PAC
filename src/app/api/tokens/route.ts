import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateApiToken } from '@/lib/auth/api-token';

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: tokens, error } = await supabase
    .from('api_tokens')
    .select('id, label, created_at, last_used_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tokens });
}

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim() : 'Extension Chrome';

  const token = generateApiToken();

  const { error } = await supabase
    .from('api_tokens')
    .insert({ user_id: auth.user.id, token, label });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ token });
}

export async function DELETE(req: Request) {
  const supabase = createSupabaseServerClient();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('api_tokens')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
