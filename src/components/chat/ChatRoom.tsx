'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as stylex from '@stylexjs/stylex';
import { PROFILE_NOT_FOUND } from '@/api/profile';
import { usePendingMessages, useRoomMessages } from '@/hooks/useChat';
import { useGetProfile } from '@/hooks/useProfile';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import ChatRoomHeader from '@/components/chat/ChatRoomHeader';
import MessageInput from '@/components/chat/MessageInput';
import MessageList from '@/components/chat/MessageList';
import MessageSelectionBar from '@/components/chat/MessageSelectionBar';
import ChevronLeftIcon from '@/components/icons/ChevronLeftIcon';
import { profilePath } from '@/utils';

export default function ChatRoom({ roomId }: { roomId: string }) {
  const { myId, messages, hasEarlier, loadEarlier, exists } =
    useRoomMessages(roomId);
  const pending = usePendingMessages(roomId);
  const profile = useGetProfile(roomId);
  const gone = profile.isError && profile.error.message === PROFILE_NOT_FOUND;
  const name = profile.data?.name || (profile.isPending ? '' : 'Someone');
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  // the messages chosen to delete, null when not choosing
  const [selected, setSelected] = useState<ReadonlySet<string> | null>(null);
  // deleting goes to the other person too: only in a chat there is, with them still there
  const canSelect = exists && !gone && (messages?.length ?? 0) > 0;
  const selecting = selected !== null && canSelect;
  // those still here: one deleted meanwhile, from another tab or device, is no longer chosen
  const selectedIds =
    messages?.filter(({ id }) => selected?.has(id)).map(({ id }) => id) ?? [];

  const toggle = (id: string) => {
    setSelected((chosen) => {
      const next = new Set(chosen);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  };

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
        <ChatRoomHeader
          roomId={roomId}
          name={name}
          onSelectMessages={
            canSelect ? () => setSelected(new Set()) : undefined
          }
        />
      </header>

      <MessageList
        messages={messages}
        hasEarlier={hasEarlier}
        onLoadEarlier={loadEarlier}
        pending={pending}
        myId={myId}
        name={name}
        selection={selecting ? { ids: selected, onToggle: toggle } : undefined}
      />

      {/* only in a chat there is: messages go to someone who accepted an invite, and not to a profile that's gone */}
      {selecting && (
        <MessageSelectionBar
          roomId={roomId}
          name={name}
          ids={selectedIds}
          onDone={() => setSelected(null)}
        />
      )}
      {/* hidden while choosing, not gone: what was being written is still there after */}
      {exists && !gone && (
        <div hidden={selecting} {...stylex.props(styles.input)}>
          <MessageInput roomId={roomId} name={name} />
        </div>
      )}
    </>
  );
}

const styles = stylex.create({
  input: {
    flexShrink: 0,
  },
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
