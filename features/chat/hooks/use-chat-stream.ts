'use client';

import { useChat } from '@ai-sdk/react';
import { useChatStore } from '../store/chat-store';
import { useCallback, useMemo } from 'react';

export function useChatStream() {
  const { language, sessionId, isOpen, setHasUnread } = useChatStore();

  const chatOptions = useMemo(
    () => ({
      id: sessionId,
      body: { language },
      onFinish: () => {
        if (!isOpen) {
          setHasUnread(true);
        }
      },
    }),
    [sessionId, language, isOpen, setHasUnread]
  );

  const chat = useChat(chatOptions);

  const sendQuickReply = useCallback(
    (message: string) => {
      chat.sendMessage({ text: message });
    },
    [chat]
  );

  const isLoading = chat.status === 'submitted' || chat.status === 'streaming';

  return {
    messages: chat.messages,
    status: chat.status,
    isLoading,
    error: chat.error,
    sendMessage: chat.sendMessage,
    sendQuickReply,
    regenerate: chat.regenerate,
    stop: chat.stop,
  };
}
