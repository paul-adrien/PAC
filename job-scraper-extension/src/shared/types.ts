export type Source = 'linkedin' | 'wttj' | 'indeed' | 'unknown';

export type JobOffer = {
  title: string | null;
  company: string | null;
  location: string | null;
  sourceUrl: string;
  dateText: string | null;
  source: Source;
  scrapedAt: string;
};

export type ScanOptions = {
  maxCards?: number;
};

export type ScanRequest = {
  type: 'SCAN_PAGE';
  options?: ScanOptions;
};

export type AutoScrollScanRequest = {
  type: 'AUTO_SCROLL_SCAN';
  iterations: number;
  delayMs: number;
  pages?: number;
  pageDelayMs?: number;
  options?: ScanOptions;
};

export type ClientRequest = ScanRequest | AutoScrollScanRequest;

export type ScanResponse = { ok: true; offers: JobOffer[] } | { ok: false; error: string };
