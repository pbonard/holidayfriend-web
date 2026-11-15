import type { Metadata } from 'next';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import ChatIcon from '@/components/icons/ChatIcon';

export const metadata: Metadata = {
  title: 'Chats · Holidayfriend',
};

// /chats: the list alone on a phone. a desktop shows the list (the layout's) with this beside it until one is opened
export default function ChatsPage() {
  return (
    <section {...stylex.props(styles.pane)}>
      <ChatIcon size={32} />
      <p {...stylex.props(styles.text)}>Select a chat to start messaging.</p>
    </section>
  );
}

const styles = stylex.create({
  pane: {
    display: { default: 'none', [breakpoints.desktop]: 'flex' },
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    flexGrow: 1,
    color: auth.muted,
  },
  text: {
    fontSize: '16px',
  },
});
