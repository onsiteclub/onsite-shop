'use client';

import { useState, type FormEvent } from 'react';
import { useChatStore } from '../store/chat-store';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

const PLACEHOLDERS = {
  en: 'Ask a question...',
  fr: 'Posez une question...',
  pt: 'Faca uma pergunta...',
} as const;

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const { language } = useChatStore();
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    onSend(text);
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-warm-200 bg-white/50">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={PLACEHOLDERS[language]}
        disabled={isLoading}
        className="flex-1 px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-sm font-body text-text-primary placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber transition-colors disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="w-10 h-10 rounded-full bg-amber hover:bg-amber-dark text-charcoal-deep flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>
    </form>
  );
}
