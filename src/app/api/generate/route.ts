import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';
import { DAILY_GENERATION_LIMIT, GENERATION_TYPES, DEFAULT_PROMPTS, PROVIDERS, type GenerationType, type Provider } from '@/lib/generate/constants';
import { callClaude, callOllama } from '@/lib/generate/llm';
import { apiError } from '@/lib/errors/api-errors';

export const runtime = 'nodejs';

function fillPrompt(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value || '—');
  }
  return result;
}

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = auth.user.id;
  const body = await req.json();
  const type = body.type as string;
  const jobId = body.jobId as string;
  const provider = PROVIDERS.includes(body.provider) ? (body.provider as Provider) : 'claude';
  const promptOverride = typeof body.prompt === 'string' ? body.prompt : null;

  if (!GENERATION_TYPES.includes(type as GenerationType)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count, error: countErr } = await supabase
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString());

  if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 });

  if ((count ?? 0) >= DAILY_GENERATION_LIMIT) {
    return NextResponse.json(
      { error: `Limite quotidienne atteinte (${DAILY_GENERATION_LIMIT} générations/jour)` },
      { status: 429 },
    );
  }

  let apiKey = '';
  if (provider === 'claude') {
    const { data: keyRow, error: keyErr } = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', userId)
      .eq('provider', 'claude')
      .maybeSingle();

    if (keyErr) return NextResponse.json({ error: keyErr.message }, { status: 500 });
    if (!keyRow) {
      return NextResponse.json({ error: 'Clé API Claude non configurée. Va dans Paramètres.' }, { status: 400 });
    }
    apiKey = decrypt(keyRow.encrypted_key);
  }

  const [{ data: job, error: jobErr }, { data: profileRow }] = await Promise.all([
    supabase.from('jobs').select('title, company, location, details').eq('id', jobId).eq('user_id', userId).maybeSingle(),
    supabase.from('user_profiles').select('content').eq('user_id', userId).maybeSingle(),
  ]);

  if (jobErr) return NextResponse.json({ error: jobErr.message }, { status: 500 });
  if (!job) return NextResponse.json({ error: 'Offre introuvable' }, { status: 404 });

  const profile = profileRow?.content || '';

  let promptTemplate: string;
  if (promptOverride) {
    promptTemplate = promptOverride;
  } else {
    const { data: promptRow } = await supabase
      .from('prompts')
      .select('content')
      .eq('user_id', userId)
      .eq('type', type)
      .maybeSingle();
    promptTemplate = promptRow?.content || DEFAULT_PROMPTS[type as GenerationType];
  }

  const details = (job.details ?? {}) as Record<string, unknown>;
  const filledPrompt = fillPrompt(promptTemplate, {
    profile,
    jobTitle: job.title,
    jobCompany: job.company,
    jobLocation: job.location ?? '',
    jobDescription: (details.description as string) ?? '',
    jobSkills: Array.isArray(details.skills) ? details.skills.join(', ') : '',
  });

  try {
    const result = provider === 'ollama'
      ? await callOllama(filledPrompt)
      : await callClaude(apiKey, filledPrompt);

    const { error: insertErr } = await supabase.from('generations').insert({
      user_id: userId,
      job_id: jobId,
      type,
      prompt: filledPrompt,
      result,
    });

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, result });
  } catch (e: unknown) {
    return apiError(e, 500, { provider, resource: 'generate' });
  }
}
