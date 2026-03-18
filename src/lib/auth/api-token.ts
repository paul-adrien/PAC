import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export function generateApiToken(): string {
  return `pac_${crypto.randomBytes(32).toString('hex')}`;
}

export async function resolveUserIdFromToken(token: string): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from('api_tokens')
    .select('user_id')
    .eq('token', token)
    .maybeSingle();

  if (error || !data) return null;

  await supabase
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('token', token);

  return data.user_id;
}
