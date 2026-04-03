const collapseSpaces = (s: string) => s.replaceAll(/\s+/g, ' ').trim();

export function normalizeText(s: string): string {
  return collapseSpaces(s);
}

export function normalizeCompany(s: string): string {
  return normalizeText(s);
}

export function normalizeTitle(s: string): string {
  const text = normalizeText(s);
  const len = text.length;
  if (len % 2 === 0) {
    const half = len / 2;
    if (text.slice(0, half) === text.slice(half)) {
      return text.slice(0, half);
    }
  }
  return text;
}

export function normalizeLocation(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = normalizeText(s);
  return t.length ? t : null;
}

export function normalizeSource(s: string): string {
  return normalizeText(s).toLowerCase();
}

export function normalizeUrl(u: string): string {
  const url = new URL(u.trim());
  url.hash = '';

  const drop = new Set([
    'trk',
    'trackingId',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
  ]);

  for (const k of Array.from(url.searchParams.keys())) {
    if (drop.has(k)) url.searchParams.delete(k);
  }

  const params = Array.from(url.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));
  url.search = '';
  for (const [k, v] of params) url.searchParams.append(k, v);

  return url.toString();
}
