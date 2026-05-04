import type { JobDetailData, JobOffer, ScanOptions, Source } from '../../shared/types';

export type ScanContext = {
  url: string;
  scrapedAt: string; // ISO
  options?: ScanOptions;
};

export type PaginationMode = 'infinite-scroll' | 'paginated';

export type SiteAdapter = {
  source: Source;

  matches: (ctx: ScanContext) => boolean;
  scanVisibleCards: (ctx: ScanContext) => JobOffer[];

  paginationMode: PaginationMode;
  getScrollContainer: () => HTMLElement | null;
  getListSignature: () => string;
  countCards: () => number;
  clickNextPage: () => boolean;

  matchesDetailUrl: (url: string) => boolean;
  canonicalDetailUrl: (url: string) => string | null;
  scrapeDetail: () => JobDetailData;
};
