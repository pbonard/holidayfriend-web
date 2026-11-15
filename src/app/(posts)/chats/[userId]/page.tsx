import { Suspense } from 'react';
import type { Metadata } from 'next';
import ChatRoomPane from '@/components/chat/ChatRoomPane';
import ChatRoom from '@/components/chat/ChatRoom';

type Params = Promise<{ userId: string }>;

export const metadata: Metadata = {
  title: 'Chat · Holidayfriend',
};

// /chats/{userId}: the chat with that person, a personal chat's room being the other person. the pane is there
// before the id is read, so a phone hides the list beside it from the first paint
export default function ChatRoomPage({ params }: { params: Params }) {
  return (
    <ChatRoomPane>
      <Suspense>
        <Room params={params} />
      </Suspense>
    </ChatRoomPane>
  );
}

async function Room({ params }: { params: Params }) {
  const { userId } = await params;
  // a key, so going from one chat to another starts the next one's input and scrolling over
  return <ChatRoom key={userId} roomId={userId} />;
}
