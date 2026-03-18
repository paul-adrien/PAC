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

export type JobDetailData = {
  sourceUrl: string;
  description: string | null;
  employmentType: string | null;
  seniorityLevel: string | null;
  industry: string | null;
  skills: string[];
  salary: string | null;
  applicants: string | null;
  postedAt: string | null;
};

export type EnrichRequest = {
  type: 'ENRICH_JOB';
};

export type EnrichResponse =
  | { ok: true; details: JobDetailData }
  | { ok: false; error: string };

export type ClientRequest = ScanRequest | AutoScrollScanRequest | EnrichRequest;

export type ScanResponse = { ok: true; offers: JobOffer[] } | { ok: false; error: string };
