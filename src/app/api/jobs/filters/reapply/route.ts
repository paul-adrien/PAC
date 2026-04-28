import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { applyFilter } from '@/lib/jobs/filter';
import { fetchFilterRules } from '@/lib/jobs/filter-rules';

const BATCH_SIZE = 500;

type Row = {
  id: string;
  title: string;
  auto_dismissed_at: string | null;
  auto_dismissed_reason: string | null;
};

export async function POST() {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = auth.user.id;
  const rules = await fetchFilterRules(supabase as never, userId);

  const now = new Date().toISOString();
  let dismissed = 0;
  let restored = 0;
  let scanned = 0;
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, auto_dismissed_at, auto_dismissed_reason')
      .eq('user_id', userId)
      .is('dismissed_at', null)
      .order('id', { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []) as Row[];
    if (rows.length === 0) break;

    const toDismiss: Array<{ id: string; reason: string }> = [];
    const toRestore: string[] = [];

    for (const r of rows) {
      scanned += 1;
      const decision = applyFilter(rules, r.title);
      const wasDismissed = r.auto_dismissed_at != null;

      if (decision.dismissed && !wasDismissed) {
        toDismiss.push({ id: r.id, reason: decision.reason });
      } else if (!decision.dismissed && wasDismissed) {
        toRestore.push(r.id);
      } else if (decision.dismissed && wasDismissed && r.auto_dismissed_reason !== decision.reason) {
        toDismiss.push({ id: r.id, reason: decision.reason });
      }
    }

    for (const item of toDismiss) {
      const { error: upErr } = await supabase
        .from('jobs')
        .update({ auto_dismissed_at: now, auto_dismissed_reason: item.reason })
        .eq('id', item.id)
        .eq('user_id', userId);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      dismissed += 1;
    }

    if (toRestore.length > 0) {
      const { error: rstErr } = await supabase
        .from('jobs')
        .update({ auto_dismissed_at: null, auto_dismissed_reason: null })
        .in('id', toRestore)
        .eq('user_id', userId);
      if (rstErr) return NextResponse.json({ error: rstErr.message }, { status: 500 });
      restored += toRestore.length;
    }

    if (rows.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  return NextResponse.json({ ok: true, scanned, dismissed, restored });
}
