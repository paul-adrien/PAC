import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/crypto';

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('user_api_keys')
    .select('id, provider, created_at, updated_at')
    .eq('user_id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const keys = (data ?? []).map(k => ({
    id: k.id,
    provider: k.provider,
    hasKey: true,
    createdAt: k.created_at,
    updatedAt: k.updated_at,
  }));

  return NextResponse.json({ keys });
}

export async function PUT(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const provider = typeof body.provider === 'string' ? body.provider : 'claude';
  const key = typeof body.key === 'string' ? body.key.trim() : '';

  if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });

  const { error } = await supabase
    .from('user_api_keys')
    .upsert(
      {
        user_id: auth.user.id,
        provider,
        encrypted_key: encrypt(key),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const provider = typeof body.provider === 'string' ? body.provider : 'claude';

  const { error } = await supabase
    .from('user_api_keys')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('provider', provider);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
