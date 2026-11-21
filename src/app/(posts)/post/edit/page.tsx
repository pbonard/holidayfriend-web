import { Suspense } from 'react';
import type { Metadata } from 'next';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import EditPost from '@/components/post/EditPost';

export const metadata: Metadata = {
  title: 'Edit your post · Holidayfriend',
};

// /post/edit?id={id}: the create screen's form with the post in it. the id is read inside its own suspense, so the
// heading shows at once
export default function EditPostPage() {
  return (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <h1 {...stylex.props(styles.title)}>Edit your post</h1>
        <p {...stylex.props(styles.description)}>
          Change anything but who wrote it.
        </p>
      </header>
      <Suspense>
        <EditPost />
      </Suspense>
    </div>
  );
}

// the create screen's
const styles = stylex.create({
  page: {
    maxWidth: '760px',
    marginInline: 'auto',
  },
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
