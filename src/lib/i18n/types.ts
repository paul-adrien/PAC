export type Locale = 'fr' | 'en';

export type Messages = Record<string, string>;

export const LOCALE_COOKIE = 'locale';

export const DEFAULT_LOCALE: Locale = 'fr';

/** Si une clé manque dans la locale actuelle, on prend la valeur de cette locale. */
export const FALLBACK_LOCALE: Locale = 'en';

export const LOCALES: Locale[] = ['fr', 'en'];
