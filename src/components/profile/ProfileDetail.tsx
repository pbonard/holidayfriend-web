'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { NotLoggedInError } from '@/api/axios';
import { PROFILE_NOT_FOUND } from '@/api/profile';
import { PROMPTS } from '@/constants/prompts';
import { useGetProfile, useMyProfileBrief } from '@/hooks/useProfile';
import { useScrolled } from '@/hooks/useScrolled';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import BackLink from '@/components/BackLink';
import Button from '@/components/Button';
import ErrorText from '@/components/ErrorText';
import Modal from '@/components/Modal';
import StatusText from '@/components/StatusText';
import ChatIcon from '@/components/icons/ChatIcon';
import MapPinIcon from '@/components/icons/MapPinIcon';
import MoreIcon from '@/components/icons/MoreIcon';
import SayHiForm from '@/components/post/SayHiForm';
import UserPosts from '@/components/profile/UserPosts';
import { basedInLabel } from '@/utils/citySearch';

// a person's profile: who they are with "Say hi", what they wrote about themselves, then their posts
export default function ProfileDetail({ userId }: { userId: string }) {
  const router = useRouter();
  const profile = useGetProfile(userId);
  // the desktop's back link sticks from the very top, so from the first pixel scrolled the about me and the posts
  // go under it and it shows a line under itself
  const scrolled = useScrolled();
  // the viewer: their own profile has nobody to say hi to
  const myProfile = useMyProfileBrief();
  // "Say hi" opens the message in a sheet over the page, as on a post
  const [sayingHi, setSayingHi] = useState(false);

  const notLoggedIn =
    profile.error instanceof NotLoggedInError ||
    myProfile.error instanceof NotLoggedInError;
  useEffect(() => {
    if (notLoggedIn) {
      router.replace('/login');
    }
  }, [notLoggedIn, router]);
  if (notLoggedIn) {
    return null;
  }

  // the browser's back: a profile is opened from a post, a card's author, or a chat, and goes back there. there
  // while it loads or fails too
  const back = <BackLink xstyle={styles.back} />;

  if (profile.isPending) {
    return (
      <>
        {back}
        <StatusText>Loading the profile…</StatusText>
      </>
    );
  }
  if (profile.isError) {
    return (
      <>
        {back}
        {profile.error.message === PROFILE_NOT_FOUND ? (
          <StatusText>This person isn&apos;t here anymore.</StatusText>
        ) : (
          <ErrorText
            message={profile.error.message}
            isRetrying={profile.isFetching}
            onRetry={() => profile.refetch()}
          />
        )}
      </>
    );
  }

  const { name, basedIn, aboutMe } = profile.data;
  // the first letter of the name in place of a photo, as on a post
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  // only what they answered, an empty prompt says nothing
  const answered = PROMPTS.filter(
    (prompt) => profile.data[prompt.name].trim() !== '',
  );
  // waits for the viewer, so it never shows on their own profile for a moment
  const canSayHi = myProfile.data !== undefined && myProfile.data.id !== userId;

  return (
    <div {...stylex.props(styles.layout)}>
      {/* who they are: first in the page's order (its h1), on the right on a desktop where it stays as the about me
          and the posts scroll, as the explore screen's side column. under the back link on a phone */}
      <aside {...stylex.props(styles.aside)}>
        <section {...stylex.props(styles.card, styles.header)}>
          <span aria-hidden="true" {...stylex.props(styles.avatar)}>
            {initial}
          </span>
          <div {...stylex.props(styles.who)}>
            <h1 {...stylex.props(styles.name)}>{name}</h1>
            {basedIn && (
              <p {...stylex.props(styles.basedIn)}>
                <MapPinIcon size={16} />
                {basedInLabel(basedIn)}
              </p>
            )}
          </div>
          <div {...stylex.props(styles.actions)}>
            {canSayHi && (
              <Button
                aria-haspopup="dialog"
                onClick={() => setSayingHi(true)}
                xstyle={styles.sayHi}
              >
                <ChatIcon size={18} />
                Say hi
              </Button>
            )}
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
        </section>
      </aside>

      {/* a desktop's left column: the back link staying at its top, the about me and the posts scrolling under it.
          on a phone it steps aside (display: contents) and its pieces line up around the profile by order */}
      <div {...stylex.props(styles.content)}>
        <div
          {...stylex.props(styles.backCell, scrolled && styles.backCellScrolled)}
        >
          {back}
        </div>

        {/* nothing to show when they wrote nothing about themselves */}
        {(aboutMe.trim() !== '' || answered.length > 0) && (
          <section
            {...stylex.props(
              styles.card,
              styles.wideCard,
              answered.length > 0 && styles.endsWithPrompts,
              styles.about,
            )}
          >
            <h2 {...stylex.props(styles.heading)}>About me</h2>
            {aboutMe.trim() !== '' && (
              <p {...stylex.props(styles.aboutMe)}>{aboutMe}</p>
            )}
            {answered.length > 0 && (
              <ul {...stylex.props(styles.prompts)}>
                {answered.map(({ name: promptName, label, Icon }) => (
                  <li key={promptName} {...stylex.props(styles.prompt)}>
                    <span {...stylex.props(styles.promptIcon)}>
                      <Icon />
                    </span>
                    <p {...stylex.props(styles.promptText)}>
                      {label}:{' '}
                      <strong {...stylex.props(styles.answer)}>
                        {profile.data[promptName]}
                      </strong>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <div {...stylex.props(styles.posts)}>
          <UserPosts userId={userId} />
        </div>
      </div>

      <Modal
        open={sayingHi}
        onClose={() => setSayingHi(false)}
        title={`Say hi to ${name || 'them'}`}
      >
        <SayHiForm
          authorId={userId}
          authorName={name}
          onClose={() => setSayingHi(false)}
        />
      </Modal>
    </div>
  );
}

const styles = stylex.create({
  // the about me and the posts with the profile beside them on a desktop, as the explore screen's posts and create
  // card. one column on a phone, the profile first
  layout: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      // the explore screen's side column, where its create card is: 360px on a big screen, narrower with the window
      // down to 300px, so the posts keep their room on a small one
      [breakpoints.desktop]: 'minmax(0, 1fr) clamp(300px, 26vw, 360px)',
    },
    alignItems: 'start',
    gap: '24px',
  },
  // the right column on a desktop from the very top, sticking where it already is, as the explore screen's side
  // column: it never moves. second on a phone, under the back link
  aside: {
    order: 1,
    gridColumnStart: { default: 'auto', [breakpoints.desktop]: 2 },
    gridRowStart: { default: 'auto', [breakpoints.desktop]: 1 },
    position: { default: 'static', [breakpoints.desktop]: 'sticky' },
    top: '36px',
  },
  // a desktop's left column: the back link, the about me, then the posts
  content: {
    display: { default: 'contents', [breakpoints.desktop]: 'flex' },
    gridColumnStart: 1,
    gridRowStart: 1,
    flexDirection: 'column',
    gap: '24px',
    minWidth: 0,
  },
  // a desktop's: sticks to the top of the window over its column, as the explore screen's search. it takes in
  // main's top padding (the negative margin, given back as padding), so stuck it sits where it does unscrolled,
  // level with the profile, and its background covers what scrolls under it. above the post cards' links. its line
  // is always there and unseen until the page scrolls, so nothing moves when it shows. a phone's: the first thing
  backCell: {
    order: 0,
    position: { default: 'static', [breakpoints.desktop]: 'sticky' },
    top: 0,
    zIndex: 2,
    marginTop: { default: 0, [breakpoints.desktop]: '-36px' },
    paddingTop: { default: 0, [breakpoints.desktop]: '36px' },
    paddingBottom: { default: 0, [breakpoints.desktop]: '12px' },
    borderBottomWidth: { default: 0, [breakpoints.desktop]: '1px' },
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    backgroundColor: auth.page,
    transition: 'border-color 120ms ease',
  },
  // the about me and the posts are going under it
  backCellScrolled: {
    borderBottomColor: auth.cardBorder,
  },
  // the cell's padding and the column's gap are the room under it
  back: {
    marginBottom: 0,
  },
  // a phone's third and fourth, after the profile
  about: {
    order: 2,
  },
  posts: {
    order: 3,
    minWidth: 0,
  },
  card: {
    padding: { default: '22px', [breakpoints.desktop]: '24px' },
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.cardBorder,
    borderRadius: '18px',
    backgroundColor: auth.card,
    overflowWrap: 'anywhere',
  },
  // the main column's, as roomy as the posts' card under it
  wideCard: {
    padding: { default: '22px', [breakpoints.desktop]: '32px' },
  },
  // the last row has ~19px of its own under its text, so the card's bottom padding is that much less: from the text
  // to the card's edge is the card's padding, as above the heading
  endsWithPrompts: {
    paddingBottom: { default: '3px', [breakpoints.desktop]: '13px' },
  },
  // the avatar, the name and the buttons stacked: the narrow column on a desktop, the whole width on a phone
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
  },
  avatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '92px',
    height: '92px',
    borderRadius: '50%',
    backgroundColor: '#3d2a24',
    color: auth.link,
    fontSize: '36px',
    fontWeight: 700,
  },
  who: {
    minWidth: 0,
  },
  name: {
    fontSize: { default: '34px', [breakpoints.desktop]: '30px' },
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
  },
  basedIn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '6px',
    fontSize: '15px',
    color: auth.muted,
  },
  // the card's whole width, so Say hi fills it beside the more button, as on a post's page on a phone
  actions: {
    display: 'flex',
    alignSelf: 'stretch',
    gap: '10px',
  },
  // Button's primary look, the rest of the row beside the more button
  sayHi: {
    flexGrow: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: 'auto',
    height: '44px',
    paddingInline: '20px',
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
  heading: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  // with the line breaks it was written with
  aboutMe: {
    marginTop: '10px',
    whiteSpace: 'pre-wrap',
    fontSize: '16px',
    lineHeight: 1.6,
  },
  // one column: the narrow side column on a desktop, a phone's width
  // two columns on a desktop as in onboarding, one on a phone
  prompts: {
    display: 'grid',
    gridTemplateColumns: { default: '1fr', [breakpoints.desktop]: '1fr 1fr' },
    columnGap: '32px',
    marginTop: '12px',
    listStyle: 'none',
  },
  // a line over each row and not under it: the first row's lines part the prompts from the about me, and none is
  // under the last row, however many of the two columns it fills
  prompt: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    // shorter than onboarding's rows, which are tapped to edit: these are only read. a line of text is centered in
    // it, about 19px above and below
    minHeight: '58px',
    paddingBlock: '9px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: auth.cardBorder,
  },
  promptIcon: {
    display: 'flex',
    flexShrink: 0,
    color: auth.muted,
  },
  promptText: {
    minWidth: 0,
    fontSize: '15px',
    lineHeight: 1.35,
    color: auth.muted,
  },
  answer: {
    color: auth.text,
    fontWeight: 700,
  },
});
