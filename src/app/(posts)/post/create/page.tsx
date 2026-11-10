import type { Metadata } from 'next';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import CreatePost from '@/components/post/CreatePost';

export const metadata: Metadata = {
  title: 'Create a post · Holidayfriend',
};

export default function CreatePostPage() {
  return (
    <>
      <header {...stylex.props(styles.header)}>
        <h1 {...stylex.props(styles.title)}>Create a post</h1>
        <p {...stylex.props(styles.description)}>Post to find new friends.</p>
      </header>
      <CreatePost />
    </>
  );
}

const styles = stylex.create({
  header: {
    marginBottom: { default: '20px', [breakpoints.desktop]: '24px' },
  },
  title: {
    fontSize: { default: '34px', [breakpoints.desktop]: '38px' },
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
  },
  description: {
    marginTop: '4px',
    fontSize: '16px',
    lineHeight: 1.5,
    color: auth.muted,
  },
});
