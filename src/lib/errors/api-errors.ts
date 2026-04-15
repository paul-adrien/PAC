import { NextResponse } from 'next/server';

export type ErrorContext = {
  provider?: 'claude' | 'ollama';
  resource?: string;
};

type ErrorRule = {
  match: (raw: string, ctx: ErrorContext) => boolean;
  message: string | ((raw: string, ctx: ErrorContext) => string);
};

const RULES: ErrorRule[] = [
  {
    match: r => /credit balance is too low/i.test(r),
    message: 'Crédit Claude insuffisant. Recharge sur console.anthropic.com ou bascule sur Ollama.',
  },
  {
    match: r => /invalid[_ ]api[_ ]key|authentication[_ ]error/i.test(r),
    message: 'Clé API Claude invalide. Vérifie-la dans Paramètres.',
  },
  {
    match: r => /rate[_ ]limit/i.test(r),
    message: 'Limite de requêtes atteinte. Réessaie dans quelques instants.',
  },
  {
    match: (r, c) => c.provider === 'ollama' && /ECONNREFUSED|fetch failed/i.test(r),
    message: 'Ollama injoignable. Vérifie que le serveur local tourne (ollama serve).',
  },
  {
    match: r => /jwt/i.test(r) && /expired|invalid/i.test(r),
    message: 'Session expirée. Reconnecte-toi.',
  },
  {
    match: r => /permission denied|row-level security/i.test(r),
    message: "Action non autorisée.",
  },
  {
    match: r => /ENOTFOUND|ETIMEDOUT|network/i.test(r),
    message: 'Problème réseau. Réessaie.',
  },
  {
    match: r => /not found|PGRST116/i.test(r),
    message: 'Ressource introuvable.',
  },
];

const GENERIC_FALLBACK = 'Une erreur est survenue. Réessaie.';

export function toUserMessage(raw: unknown, ctx: ErrorContext = {}): string {
  const msg =
    raw instanceof Error ? raw.message : typeof raw === 'string' ? raw : GENERIC_FALLBACK;
  for (const rule of RULES) {
    if (rule.match(msg, ctx)) {
      return typeof rule.message === 'function' ? rule.message(msg, ctx) : rule.message;
    }
  }
  return GENERIC_FALLBACK;
}

export function apiError(raw: unknown, status = 500, ctx: ErrorContext = {}) {
  const rawMessage = raw instanceof Error ? raw.message : String(raw);
  console.error('[api-error]', ctx.resource ?? '', rawMessage);
  return NextResponse.json(
    { ok: false, error: toUserMessage(raw, ctx) },
    { status },
  );
}
