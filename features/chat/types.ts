export type ChatLanguage = 'en' | 'fr' | 'pt';

export interface QuickReply {
  label: Record<ChatLanguage, string>;
  message: Record<ChatLanguage, string>;
}

export interface ChatStoreState {
  isOpen: boolean;
  language: ChatLanguage;
  hasUnread: boolean;
  sessionId: string;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  setLanguage: (lang: ChatLanguage) => void;
  setHasUnread: (unread: boolean) => void;
  resetSession: () => void;
}
