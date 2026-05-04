import type { JobOffer } from '../../shared/types';
import { scrapeLinkedInJobDetail } from './linkedin-detail';
import type { ScanContext, SiteAdapter } from './types';

function getScrollContainer(): HTMLElement | null {
  const card = document.querySelector('li[data-occludable-job-id]') as HTMLElement | null;
  if (!card) return null;

  let el: HTMLElement | null = card;
  while (el) {
    const style = getComputedStyle(el);
    const overflowY = style.overflowY;
    const canScrollY =
      (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight;

    if (canScrollY) return el;
    el = el.parentElement;
  }

  return (document.scrollingElement as HTMLElement | null) ?? null;
}

function getListSignature(): string {
  const ids = Array.from(document.querySelectorAll('li[data-occludable-job-id]'))
    .slice(0, 5)
    .map(el => (el as HTMLElement).getAttribute('data-occludable-job-id') || '')
    .join('|');

  return ids || 'empty';
}

function countCards(): number {
  return document.querySelectorAll('li[data-occludable-job-id]').length;
}

function clickNextPage(): boolean {
  const btn = document.querySelector(
    'button.jobs-search-pagination__button--next',
  ) as HTMLButtonElement | null;

  if (!btn) return false;
  if (btn.disabled) return false;
  if (btn.getAttribute('aria-disabled') === 'true') return false;

  btn.click();
  return true;
}

function cleanText(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.replace(/\s+/g, ' ').trim();
  if (!t) return null;

  return t.replace(/\s+with verification$/i, '').trim();
}

function text(el: Element | null | undefined): string | null {
  return cleanText(el?.textContent ?? null);
}

function canonicalDetailUrl(href: string): string | null {
  try {
    const u = new URL(href);
    const m = u.pathname.match(/\/jobs\/view\/(\d+)/);
    if (m?.[1]) return `https://www.linkedin.com/jobs/view/${m[1]}/`;
    return null;
  } catch {
    return null;
  }
}

function matchesListing(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.endsWith('linkedin.com') && u.pathname.startsWith('/jobs');
  } catch {
    return false;
  }
}

function matchesDetailUrl(url: string): boolean {
  return canonicalDetailUrl(url) !== null;
}

export const linkedinAdapter: SiteAdapter = {
  source: 'linkedin',

  matches: (ctx: ScanContext) => matchesListing(ctx.url),

  scanVisibleCards: (ctx: ScanContext): JobOffer[] => {
    const { url, scrapedAt, options } = ctx;
    const max = options?.maxCards ?? 50;

    const cards = Array.from(
      document.querySelectorAll('li[data-occludable-job-id].scaffold-layout__list-item'),
    ).slice(0, max);

    const uniqueCards: Element[] = [];
    const seen = new Set<Element>();
    for (const c of cards) {
      if (seen.has(c)) continue;
      seen.add(c);
      uniqueCards.push(c);
      if (uniqueCards.length >= max) break;
    }

    return uniqueCards.map((card): JobOffer => {
      const titleLink = card.querySelector(
        'a.job-card-container__link[href*="/jobs/view/"]',
      ) as HTMLAnchorElement | null;

      const titleRaw = text(titleLink) ?? text(card.querySelector('.artdeco-entity-lockup__title'));
      const title = titleRaw ? cleanText(titleRaw.split(' with verification')[0]) : null;

      const company =
        text(card.querySelector('.job-card-container__primary-description')) ??
        text(card.querySelector('.artdeco-entity-lockup__subtitle')) ??
        null;

      const locationBySelectors = (() => {
        const candidates = [
          '[data-test-job-card-location]',
          'span[class*="job-card-container__metadata"]',
          'span[class*="job-card-container__metadata-item"]',
          'span[class*="metadata-item"]',
          'span[class*="job-card-container__metadata-wrapper"]',
        ];

        for (const sel of candidates) {
          const t = text(card.querySelector(sel));
          if (t) return t;
        }
        return null;
      })();

      const locationByHeuristic = (() => {
        const shortTexts = Array.from(card.querySelectorAll('*'))
          .map(el => cleanText(el.textContent ?? null))
          .filter((t): t is string => Boolean(t))
          .filter(t => t.length > 3 && t.length < 90);

        const noise = [
          'Consulté',
          'Promu(e)',
          'Soyez l’un des premiers candidats',
          "Soyez l'un des premiers candidats",
          'with verification',
        ];

        const filtered = shortTexts.filter(t => !noise.some(n => t.includes(n)));

        const looksLikeLocation = (t: string) =>
          /\((Sur site|Hybride|À distance|Remote|On-site|Hybrid)\)/i.test(t) || /,/.test(t);

        const pick = filtered.find(looksLikeLocation);
        return pick ?? null;
      })();
      const location = locationBySelectors ?? locationByHeuristic;

      const dateText = text(card.querySelector('.job-card-container__footer-item')) ?? null;

      const href = titleLink?.getAttribute('href') ?? url;
      const sourceUrl = canonicalDetailUrl(href) ?? new URL(href, url).toString();

      return {
        title,
        company,
        location,
        sourceUrl,
        dateText,
        source: 'linkedin',
        scrapedAt,
      };
    });
  },

  paginationMode: 'infinite-scroll',
  getScrollContainer,
  getListSignature,
  countCards,
  clickNextPage,

  matchesDetailUrl,
  canonicalDetailUrl,
  scrapeDetail: scrapeLinkedInJobDetail,
};
