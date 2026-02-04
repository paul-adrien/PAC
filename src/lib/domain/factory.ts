import type { ISODateTime, UUID } from '@/lib/domain/common';

export const nowIso = (): ISODateTime => new Date().toISOString();

export const uuid = (): UUID =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`) as UUID;
