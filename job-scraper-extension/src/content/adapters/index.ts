import type { SiteAdapter } from './types';
import { linkedinAdapter } from './linkedin';
import { wttjAdapter } from './wttj';

export const adapters: SiteAdapter[] = [linkedinAdapter, wttjAdapter];
