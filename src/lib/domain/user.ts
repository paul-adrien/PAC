import type { UUID, ISODateTime, AccountRole } from './common';

export interface User {
  id: UUID;
  role: AccountRole;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
