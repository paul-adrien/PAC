import type { JobOffer, ScanOptions, Source } from '../../shared/types';

export type ScanContext = {
  url: string;
  scrapedAt: string; // ISO
  options?: ScanOptions;
};

export type SiteAdapter = {
  source: Source;
  matches: (ctx: ScanContext) => boolean;
  scanVisibleCards: (ctx: ScanContext) => JobOffer[];
};
