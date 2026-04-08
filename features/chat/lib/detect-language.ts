import type { ChatLanguage } from '../types';

export function detectBrowserLanguage(): ChatLanguage {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language?.toLowerCase() || '';
  if (lang.startsWith('fr')) return 'fr';
  if (lang.startsWith('pt')) return 'pt';
  return 'en';
}
