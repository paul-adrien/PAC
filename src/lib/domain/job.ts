import type { UUID, ISODateTime } from './common';

export interface JobDetails {
  description?: string | null;
  employmentType?: string | null;
  seniorityLevel?: string | null;
  industry?: string | null;
  skills?: string[] | null;
  salary?: string | null;
  applicants?: string | null;
  postedAt?: string | null;
}

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
  appliedAt: ISODateTime | null;
  dismissedAt: ISODateTime | null;
  autoDismissedAt: ISODateTime | null;
  autoDismissedReason: string | null;

  details: JobDetails | null;
  raw: unknown;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
