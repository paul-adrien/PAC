import type { JobOffer } from '../../shared/types';
import { canonicalWttjDetailUrl, scrapeWttjJobDetail } from './wttj-detail';
import type { ScanContext, SiteAdapter } from './types';

const CARD_SELECTOR = 'a[href^="/fr/companies/"][href*="/jobs/"]';

function cleanText(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.replaceAll(/ /g, ' ').replaceAll(/\s+/g, ' ').trim();
  return t.length > 0 ? t : null;
}

function text(el: Element | null | undefined): string | null {
  return cleanText(el?.textContent ?? null);
}

function chipText(card: Element, iconName: string): string | null {
  const svg = card.querySelector(`svg.name-${iconName}`);
  if (!svg) return null;
  const span = svg.parentElement?.querySelector('span');
  return text(span);
}

function pickTitle(card: Element): string | null {
  const sel = 'p[class*="heading-md-strong"], p[class*="heading-sm-strong"]';
  return text(card.querySelector(sel));
}

function pickCompany(card: Element): string | null {
  const sel = 'p[class*="body-lg-strong"], p[class*="body-md-strong"]';
  return text(card.querySelector(sel));
}

function pickDate(card: Element): string | null {
  const svg = card.querySelector('svg.name-calendar');
  if (!svg) return null;
  return text(svg.parentElement);
}

function buildLocation(card: Element): string | null {
  const city = chipText(card, 'map-marker-alt');
  const remote = chipText(card, 'house-user');
  if (city && remote) return `${city} (${remote})`;
  return city ?? remote;
}

function listingCards(): HTMLAnchorElement[] {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>(CARD_SELECTOR));
}

function clickNextPage(): boolean {
  const btn = document.querySelector(
    'button[data-testid="job-list-pagination-arrow-next"]',
  ) as HTMLButtonElement | null;
  if (!btn) return false;
  if (btn.disabled) return false;
  if (btn.getAttribute('aria-disabled') === 'true') return false;
  btn.click();
  return true;
}

function matchesListing(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.hostname !== 'www.welcometothejungle.com') return false;
    return /^\/fr\/jobs(?:-matches)?\b/.test(u.pathname);
  } catch {
    return false;
  }
}

export const wttjAdapter: SiteAdapter = {
  source: 'wttj',

  matches: (ctx: ScanContext) => matchesListing(ctx.url),

  scanVisibleCards: (ctx: ScanContext): JobOffer[] => {
    const { url, scrapedAt, options } = ctx;
    const max = options?.maxCards ?? 50;

    const seen = new Set<string>();
    const offers: JobOffer[] = [];

    for (const card of listingCards()) {
      if (offers.length >= max) break;
      const href = card.getAttribute('href');
      if (!href) continue;

      const sourceUrl = canonicalWttjDetailUrl(new URL(href, url).toString());
      if (!sourceUrl) continue;
      if (seen.has(sourceUrl)) continue;
      seen.add(sourceUrl);

      offers.push({
        title: pickTitle(card),
        company: pickCompany(card),
        location: buildLocation(card),
        sourceUrl,
        dateText: pickDate(card),
        source: 'wttj',
        scrapedAt,
      });
    }

    return offers;
  },

  paginationMode: 'paginated',
  getScrollContainer: () => null,
  getListSignature: () => {
    const hrefs = listingCards()
      .slice(0, 5)
      .map(a => a.getAttribute('href') ?? '')
      .join('|');
    return hrefs || 'empty';
  },
  countCards: () => listingCards().length,
  clickNextPage,

  matchesDetailUrl: (url: string) => canonicalWttjDetailUrl(url) !== null,
  canonicalDetailUrl: canonicalWttjDetailUrl,
  scrapeDetail: scrapeWttjJobDetail,
};
