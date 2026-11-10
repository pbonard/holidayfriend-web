import Link from 'next/link';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';

// next to a city's posts, asks the viewer to add their own
export default function CreatePostCard({ city }: { city: string }) {
  return (
    <section aria-labelledby="create-post-card" {...stylex.props(styles.card)}>
      <h2 id="create-post-card" {...stylex.props(styles.title)}>
        Heading to {city}?
      </h2>
      <p {...stylex.props(styles.text)}>
        Post what you&apos;re up for so locals and other travelers can find
        you.
      </p>
      <Link href="/post/create" {...stylex.props(styles.button)}>
        Create a post
      </Link>
    </section>
  );
}

const styles = stylex.create({
  card: {
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#4a2f26',
    borderRadius: '14px',
    // the accent, faded into the card
    backgroundColor: '#2f221d',
  },
  title: {
    fontSize: '19px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
  },
  text: {
    marginTop: '8px',
    fontSize: '15px',
    lineHeight: 1.5,
    color: auth.muted,
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '46px',
    marginTop: '18px',
    borderRadius: '10px',
    backgroundColor: { default: auth.text, ':hover': '#ffffff' },
    color: auth.page,
    fontSize: '16px',
    fontWeight: 700,
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
    outlineOffset: '2px',
  },
});
