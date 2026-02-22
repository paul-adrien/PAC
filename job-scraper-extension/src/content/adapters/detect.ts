import type { Source } from '../../shared/types';

export function detectSourceFromUrl(urlStr: string): Source {
  try {
    const u = new URL(urlStr);
    const h = u.hostname;

    if (h.endsWith('linkedin.com')) return 'linkedin';
    if (h === 'www.welcometothejungle.com') return 'wttj';
    if (h === 'www.indeed.com' || h === 'fr.indeed.com' || h.endsWith('.indeed.com'))
      return 'indeed';

    return 'unknown';
  } catch {
    return 'unknown';
  }
}
