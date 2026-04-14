import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveUserIdFromToken } from '@/lib/auth/api-token';
import { importJobsJSON } from '@/lib/jobs/import';

export const runtime = 'nodejs';

type Auth = { userId: string; supabase: SupabaseClient };

async function resolveAuth(req: Request): Promise<Auth | null> {
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (bearerToken) {
    const userId = await resolveUserIdFromToken(bearerToken);
    if (!userId) return null;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    return { userId, supabase };
  }

  const supabase = createSupabaseServerClient();
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth?.user) return null;
  return { userId: auth.user.id, supabase: supabase as unknown as SupabaseClient };
}

async function extractJsonText(req: Request): Promise<string | null> {
  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = await req.text();
    return body.length > 0 ? body : null;
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return null;
  return file.text();
}

export async function POST(req: Request) {
  const auth = await resolveAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jsonText = await extractJsonText(req);
  if (jsonText == null) {
    return NextResponse.json({ error: 'Missing payload (JSON body or file field)' }, { status: 400 });
  }

  try {
    const result = await importJobsJSON({
      supabase: auth.supabase,
      userId: auth.userId,
      jsonText,
    });

    return NextResponse.json({ ok: true, result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Import failed';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
