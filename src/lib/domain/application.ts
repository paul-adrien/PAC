import type { UUID, ISODateTime } from './common';

export const APPLICATION_STATUSES = [
  'draft',
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'hired',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface Application {
  id: UUID;
  userId: UUID;

  company: string;
  title: string;
  location: string | null;
  jobUrl: string | null;
  notes: string | null;
  stars: number | null;

  status: ApplicationStatus;
  appliedAt: ISODateTime | null;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
