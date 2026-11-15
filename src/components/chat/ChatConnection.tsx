'use client';

import { useChatConnection } from '@/hooks/useChat';

// the chat's socket while a page with the sidebar is open, whichever: messages arrive and the badge counts them
// on any of them, not only on the chats screen
export default function ChatConnection() {
  useChatConnection();
  return null;
}
