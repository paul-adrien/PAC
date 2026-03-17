import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { importJobsJSON } from '@/lib/jobs/import';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file (field: file)' }, { status: 400 });
  }

  const jsonText = await file.text();

  try {
    const result = await importJobsJSON({
      supabase,
      userId: auth.user.id,
      jsonText,
    });

    return NextResponse.json({ ok: true, result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Import failed';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
