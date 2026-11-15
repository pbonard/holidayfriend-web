import ChatRoomList from '@/components/chat/ChatRoomList';
import ChatFrame from '@/components/chat/ChatFrame';

// /chats and a chat: the list of chats beside the open one on a desktop. a phone shows one at a time, the list until
// a chat is opened (ChatList hides itself beside an open chat). the window's height (ChatsScreen), so the list and
// the messages each scroll on their own and the input stays at the bottom
export default function ChatsLayout({ children }: LayoutProps<'/chats'>) {
  return (
    <ChatFrame>
      <ChatRoomList />
      {children}
    </ChatFrame>
  );
}
