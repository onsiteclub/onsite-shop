'use client';

import { useEffect } from 'react';
import { useChatStore } from '../store/chat-store';
import { detectBrowserLanguage } from '../lib/detect-language';
import { ChatBubble } from './ChatBubble';
import { ChatPanel } from './ChatPanel';

export function ChatWidget() {
  const { isOpen, setLanguage } = useChatStore();

  useEffect(() => {
    const detected = detectBrowserLanguage();
    if (detected !== 'en') {
      setLanguage(detected);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <ChatBubble />
      {isOpen && <ChatPanel />}
    </>
  );
}
