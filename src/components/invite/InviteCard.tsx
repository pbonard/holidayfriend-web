'use client';

import * as stylex from '@stylexjs/stylex';
import { useAcceptInvite, useDeclineInvite } from '@/hooks/useInvite';
import { auth } from '@/styles/tokens.stylex';
import type { InviteListItem } from '@/types/invite';
import Button from '@/components/Button';
import PersonHeader from '@/components/PersonHeader';
import MoreIcon from '@/components/icons/MoreIcon';
import { timeAgo, timeOfId } from '@/utils';
import { basedInLabel } from '@/utils/citySearch';

// the server's 404 body for one already answered (in another tab) or sent again since with a new id
const INVITE_NOT_FOUND = 'Invite not found';

// an invite: who said hi, when, and their message, with accept and decline. its own mutations, so one card's
// answer on its way doesn't hold up the others. answered, it leaves the list (useInvite)
export default function InviteCard({ invite }: { invite: InviteListItem }) {
  const acceptInviteMutation = useAcceptInvite();
  const declineInviteMutation = useDeclineInvite();
  const answering =
    acceptInviteMutation.isPending || declineInviteMutation.isPending;
  // the one that failed last. one that's gone already isn't an error: it leaves the list, as answered
  const error = [acceptInviteMutation.error, declineInviteMutation.error].find(
    (failed) => failed && failed.message !== INVITE_NOT_FOUND,
  );

  const name = invite.fromName || 'Someone';
  const sent = timeOfId(invite.id);

  return (
    <article {...stylex.props(styles.card)}>
      <header {...stylex.props(styles.header)}>
        <PersonHeader
          userId={invite.fromUserId}
          name={name}
          xstyle={styles.who}
        >
          {invite.fromBasedIn && basedInLabel(invite.fromBasedIn)}
        </PersonHeader>
        <time dateTime={sent.toISOString()} {...stylex.props(styles.time)}>
          {timeAgo(sent)}
        </time>
      </header>

      <p {...stylex.props(styles.message)}>{invite.message}</p>

      <div {...stylex.props(styles.actions)}>
        <Button
          disabled={answering}
          onClick={() => acceptInviteMutation.mutate(invite.id)}
          xstyle={styles.answer}
        >
          Accept
        </Button>
        <Button
          variant="secondary"
          disabled={answering}
          onClick={() => declineInviteMutation.mutate(invite.id)}
          xstyle={[styles.answer, styles.decline]}
        >
          Decline
        </Button>
        {/* nothing behind it yet */}
        <Button
          variant="secondary"
          disabled
          aria-label="More options"
          xstyle={styles.more}
        >
          <MoreIcon size={20} />
        </Button>
      </div>
      {error && (
        <p role="alert" {...stylex.props(styles.error)}>
          {error.message}
        </p>
      )}
    </article>
  );
}

const styles = stylex.create({
  card: {
    paddingBlock: '20px',
    paddingInline: '22px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.cardBorder,
    borderRadius: '14px',
    backgroundColor: auth.card,
    overflowWrap: 'anywhere',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  // the rest of the row, before the time
  who: {
    flexGrow: 1,
  },
  time: {
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginTop: '4px',
    fontSize: '13px',
    color: auth.muted,
  },
  // with the line breaks it was written with
  message: {
    marginTop: '14px',
    whiteSpace: 'pre-wrap',
    fontSize: '16px',
    lineHeight: 1.55,
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '16px',
  },
  // Button's looks, as wide as its words
  answer: {
    width: 'auto',
    height: '44px',
    paddingInline: '22px',
    fontSize: '15px',
  },
  decline: {
    backgroundColor: 'transparent',
  },
  // Button's secondary look, round
  more: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '44px',
    height: '44px',
    padding: 0,
    borderRadius: '50%',
    backgroundColor: 'transparent',
  },
  error: {
    marginTop: '12px',
    fontSize: '14px',
    color: auth.danger,
  },
});
