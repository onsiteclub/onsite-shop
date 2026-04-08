'use client';

import { useChatStore } from '../store/chat-store';

export function ChatBubble() {
  const { toggleOpen, hasUnread, isOpen } = useChatStore();

  return (
    <button
      onClick={toggleOpen}
      className="fixed bottom-5 right-4 z-[150] w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-full bg-amber hover:bg-amber-dark text-charcoal-deep shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:scale-110">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )}

      {hasUnread && !isOpen && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-off-white animate-pulse" />
      )}
    </button>
  );
}
