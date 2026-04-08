'use client';

import type { UIMessage } from 'ai';

interface ChatMessageProps {
  message: UIMessage;
}

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const text = getTextContent(message);

  if (!text) return null;

  return (
    <div className={`flex items-start gap-2 px-4 py-1.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-charcoal flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-2.5 text-sm font-body leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-amber text-charcoal-deep rounded-2xl rounded-br-md'
            : 'bg-white text-text-primary rounded-2xl rounded-bl-md shadow-sm'
        }`}
      >
        {text}
        {!isUser && text.includes('contact@onsiteclub.ca') && (
          <a
            href="mailto:contact@onsiteclub.ca"
            className="block mt-2 text-xs font-display font-semibold text-amber-dark hover:underline"
          >
            contact@onsiteclub.ca
          </a>
        )}
      </div>
    </div>
  );
}
