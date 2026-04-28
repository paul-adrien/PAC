import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchFilterRules, upsertFilterRules } from '@/lib/jobs/filter-rules';
import { normalizeRules } from '@/lib/jobs/filter';

const PutBodySchema = z.object({
  include: z.array(z.string()),
  exclude: z.array(z.string()),
});

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rules = await fetchFilterRules(supabase as never, auth.user.id);
  return NextResponse.json({ ok: true, rules });
}

export async function PUT(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = PutBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const rules = normalizeRules(parsed.data);
  await upsertFilterRules(supabase as never, auth.user.id, rules);

  return NextResponse.json({ ok: true, rules });
}
