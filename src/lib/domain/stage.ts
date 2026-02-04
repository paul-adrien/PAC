import { ApplicationStatus } from './application';
import type { UUID, ISODateTime } from './common';

export interface Stage {
  id: UUID;
  applicationId: UUID;
  userId: UUID;

  type: ApplicationStatus;
  label: string | null;
  occurredAt: ISODateTime | null;

  notes: string | null;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
