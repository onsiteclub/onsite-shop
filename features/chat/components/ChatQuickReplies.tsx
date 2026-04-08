'use client';

import { QUICK_REPLIES } from '../config/quick-replies';
import { useChatStore } from '../store/chat-store';

interface ChatQuickRepliesProps {
  onSend: (message: string) => void;
}

const WELCOME = {
  en: 'Hi! How can we help you today?',
  fr: 'Bonjour! Comment pouvons-nous vous aider?',
  pt: 'Oi! Como podemos te ajudar hoje?',
} as const;

export function ChatQuickReplies({ onSend }: ChatQuickRepliesProps) {
  const { language } = useChatStore();

  return (
    <div className="px-4 py-6 flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-charcoal flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p className="text-sm font-body text-text-secondary text-center">
        {WELCOME[language]}
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {QUICK_REPLIES.map((qr, i) => (
          <button
            key={i}
            onClick={() => onSend(qr.message[language])}
            className="px-4 py-2 bg-white border border-warm-200 rounded-full text-xs font-display font-semibold tracking-wide text-text-primary hover:bg-amber-light hover:border-amber transition-colors"
          >
            {qr.label[language]}
          </button>
        ))}
      </div>
    </div>
  );
}
