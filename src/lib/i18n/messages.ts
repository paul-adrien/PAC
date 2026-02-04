import type { Locale, Messages } from './types';
import fr from '@/locales/fr.json';
import en from '@/locales/en.json';

const messages: Record<Locale, Messages> = {
  fr: fr as Messages,
  en: en as Messages,
};

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages.fr;
}
