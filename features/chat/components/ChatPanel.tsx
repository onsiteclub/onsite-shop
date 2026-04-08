'use client';

import { useRef, useEffect } from 'react';
import { useChatStore } from '../store/chat-store';
import { useChatStream } from '../hooks/use-chat-stream';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatQuickReplies } from './ChatQuickReplies';
import { ChatTypingIndicator } from './ChatTypingIndicator';

export function ChatPanel() {
  const { setOpen } = useChatStore();
  const { messages, isLoading, sendMessage, sendQuickReply, error, status } = useChatStream();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setOpen]);

  const handleSend = (text: string) => {
    sendMessage({ text });
  };

  const showTyping = status === 'submitted' || status === 'streaming';

  return (
    <div className="fixed bottom-20 right-4 z-[150] w-[calc(100vw-2rem)] sm:w-[380px] h-[70vh] sm:h-[520px] max-h-[600px] flex flex-col bg-off-white rounded-2xl shadow-2xl border border-warm-200 overflow-hidden animate-in">
      <ChatHeader />

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-3">
        {messages.length === 0 && !isLoading ? (
          <ChatQuickReplies onSend={sendQuickReply} />
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {showTyping && <ChatTypingIndicator />}
          </>
        )}

        {error && (
          <div className="px-4 py-2">
            <p className="text-xs text-red-500 font-body text-center">
              Something went wrong. Please try again.
            </p>
          </div>
        )}
      </div>

      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}
