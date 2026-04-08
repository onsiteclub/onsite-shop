import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatStoreState, ChatLanguage } from '../types';

function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      language: 'en' as ChatLanguage,
      hasUnread: false,
      sessionId: generateSessionId(),

      toggleOpen: () => {
        const wasOpen = get().isOpen;
        set({ isOpen: !wasOpen });
        if (!wasOpen) set({ hasUnread: false });
      },

      setOpen: (open) => {
        set({ isOpen: open });
        if (open) set({ hasUnread: false });
      },

      setLanguage: (lang) => set({ language: lang }),

      setHasUnread: (unread) => set({ hasUnread: unread }),

      resetSession: () => set({ sessionId: generateSessionId() }),
    }),
    {
      name: 'onsite-chat-prefs',
      partialize: (state) => ({ language: state.language }),
    }
  )
);
