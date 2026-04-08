'use client';

import { useChatStore } from '../store/chat-store';
import type { ChatLanguage } from '../types';

const LANGUAGES: { code: ChatLanguage; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'pt', label: 'PT' },
];

const TITLE = {
  en: 'OnSite Support',
  fr: 'Support OnSite',
  pt: 'Suporte OnSite',
} as const;

export function ChatHeader() {
  const { language, setLanguage, setOpen } = useChatStore();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-charcoal rounded-t-2xl sm:rounded-t-2xl">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-amber flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <span className="text-white font-display font-bold text-sm">
          {TITLE[language]}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex bg-charcoal-light rounded-full p-0.5 gap-0.5">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-display font-bold tracking-wider transition-colors ${
                language === lang.code
                  ? 'bg-amber text-charcoal-deep'
                  : 'text-warm-400 hover:text-white'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setOpen(false)}
          className="w-7 h-7 flex items-center justify-center text-warm-400 hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
