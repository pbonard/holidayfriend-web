'use client';

import Link from 'next/link';
import * as stylex from '@stylexjs/stylex';
import { PROFILE_NOT_FOUND } from '@/api/profile';
import { useRoomMessages } from '@/hooks/useChat';
import { useGetProfile } from '@/hooks/useProfile';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import ChatRoomHeader from '@/components/chat/ChatRoomHeader';
import MessageInput from '@/components/chat/MessageInput';
import MessageList from '@/components/chat/MessageList';
import ChevronLeftIcon from '@/components/icons/ChevronLeftIcon';
import { profilePath } from '@/utils';

// the chat with one person, as the mobile app's chat screen: who, the messages from this browser's IndexedDB,
// and the input. the other person's messages arrive on the socket (ChatConnection) and show here as they're kept
export default function ChatRoom({ roomId }: { roomId: string }) {
  const { myId, messages, hasEarlier, loadEarlier, exists } = useRoomMessages(roomId);
  const profile = useGetProfile(roomId);
  const gone = profile.isError && profile.error.message === PROFILE_NOT_FOUND;
  const name = profile.data?.name || (profile.isPending ? '' : 'Someone');
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <>
      <header {...stylex.props(styles.header)}>
        {/* only a phone's: a desktop has the list beside it */}
        <Link
          href="/chats"
          aria-label="Back to chats"
          {...stylex.props(styles.back)}
        >
          <ChevronLeftIcon size={20} />
        </Link>
        <Link href={profilePath(roomId)} {...stylex.props(styles.person)}>
          <span aria-hidden="true" {...stylex.props(styles.avatar)}>
            {initial}
          </span>
          <span {...stylex.props(styles.name)}>{name}</span>
        </Link>
        <ChatRoomHeader roomId={roomId} name={name} />
      </header>

      <MessageList
        messages={messages}
        hasEarlier={hasEarlier}
        onLoadEarlier={loadEarlier}
        myId={myId}
        name={name}
      />

      {/* only in a chat there is: messages go to someone who accepted an invite, and not to a profile that's gone */}
      {exists && !gone && (
        <MessageInput roomId={roomId} name={name} />
      )}
    </>
  );
}

const styles = stylex.create({
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
    height: { default: '64px', [breakpoints.desktop]: '76px' },
    paddingInline: { default: '8px', [breakpoints.desktop]: '24px' },
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: auth.cardBorder,
  },
  back: {
    display: { default: 'flex', [breakpoints.desktop]: 'none' },
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    color: auth.text,
    backgroundColor: { default: 'transparent', ':hover': auth.control },
  },
  person: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexGrow: 1,
    minWidth: 0,
    color: auth.text,
    textDecoration: 'none',
    borderRadius: '10px',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
  },
  avatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: auth.control,
    fontSize: '17px',
    fontWeight: 700,
  },
  name: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '18px',
    fontWeight: 700,
  },
});
