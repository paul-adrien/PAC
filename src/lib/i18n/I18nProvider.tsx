'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Locale } from './types';
import { DEFAULT_LOCALE, FALLBACK_LOCALE, LOCALE_COOKIE } from './types';
import { getMessages } from './messages';

type TParams = Record<string, string | number> & { defaultValue?: string };

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TParams) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match?.[1];
  if (value === 'fr' || value === 'en') return value;
  return DEFAULT_LOCALE;
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000`;
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    text,
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(getLocaleFromCookie());
  }, []);

  const messages = useMemo(() => getMessages(locale), [locale]);
  const fallbackMessages = useMemo(() => getMessages(FALLBACK_LOCALE), []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocaleCookie(newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: TParams) => {
      const fallback = params?.defaultValue;
      const text = messages[key] ?? fallbackMessages[key] ?? fallback ?? key;
      const { defaultValue: _, ...interpolationParams } = params ?? {};
      return interpolate(
        text,
        Object.keys(interpolationParams ?? {}).length ? interpolationParams : undefined,
      );
    },
    [messages, fallbackMessages],
  );

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
