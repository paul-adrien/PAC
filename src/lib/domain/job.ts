import type { UUID, ISODateTime } from './common';

export interface Job {
  id: UUID;
  userId: UUID;

  fingerprint: string;

  title: string;
  company: string;
  location: string | null;

  source: string;
  sourceUrl: string;

  firstSeenAt: ISODateTime;
  lastSeenAt: ISODateTime;
  scrapedAt: ISODateTime | null;
  viewedAt: ISODateTime | null;

  raw: unknown;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
