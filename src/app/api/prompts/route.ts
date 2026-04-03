import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GENERATION_TYPES, type GenerationType } from '@/lib/generate/constants';

export async function GET(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? '';

  if (!GENERATION_TYPES.includes(type as GenerationType)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('prompts')
    .select('content')
    .eq('user_id', auth.user.id)
    .eq('type', type)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ content: data?.content ?? null });
}

export async function PUT(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const type = typeof body.type === 'string' ? body.type : '';
  const content = typeof body.content === 'string' ? body.content : '';

  if (!GENERATION_TYPES.includes(type as GenerationType)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const { error } = await supabase
    .from('prompts')
    .upsert(
      { user_id: auth.user.id, type, content, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,type' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
