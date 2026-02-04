'use client';

import { useTranslation } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

const labels: Record<Locale, string> = {
  fr: 'FR',
  en: 'EN',
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex rounded-md border border-orange-200 bg-white/80 p-0.5">
      {(['fr', 'en'] as const).map(l => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={`rounded px-2 py-1 text-xs font-medium transition cursor-pointer ${
            locale === l
              ? 'bg-orange-100 text-orange-900'
              : 'text-gray-600 hover:bg-orange-50 hover:text-orange-800'
          }`}
          aria-label={l === 'fr' ? 'Français' : 'English'}
        >
          {labels[l]}
        </button>
      ))}
    </div>
  );
}
