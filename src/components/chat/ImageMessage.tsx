'use client';

import Image from 'next/image';
import * as stylex from '@stylexjs/stylex';
import { useMediaURL } from '@/hooks/useChat';
import { auth } from '@/styles/tokens.stylex';

// a photo of a message, whole and at its own shape, from this browser (db/media), downloaded as its message arrived,
// as on mobile. a click opens it full size in a new tab
export default function ImageMessage({ filename }: { filename: string }) {
  const media = useMediaURL('image', filename);

  if (!media.url) {
    return (
      <span {...stylex.props(styles.box, styles.placeholder)}>
        {media.isError ? 'Photo unavailable' : null}
      </span>
    );
  }
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noreferrer"
      aria-label="Open photo"
      {...stylex.props(styles.link)}
    >
      {/* unoptimized: a local object url, next's image optimizer can't fetch it */}
      <Image
        src={media.url}
        alt="Photo"
        width={240}
        height={240}
        unoptimized
        {...stylex.props(styles.image)}
      />
    </a>
  );
}

const styles = stylex.create({
  // as wide as the photo, not stretched to the widest beside it
  link: {
    display: 'block',
    width: 'fit-content',
    maxWidth: '100%',
    borderRadius: '12px',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
    outlineOffset: '2px',
  },
  box: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '240px',
    maxWidth: '100%',
    height: '240px',
    borderRadius: '12px',
  },
  placeholder: {
    backgroundColor: auth.card,
    color: auth.muted,
    fontSize: '13px',
  },
  // the whole photo at its own shape, scaled down to fit 240 wide and 320 tall: a tall screenshot narrow and tall,
  // a wide photo wide. the width and height given to Image only reserve room until it loads
  image: {
    display: 'block',
    width: 'auto',
    height: 'auto',
    maxWidth: 'min(240px, 100%)',
    maxHeight: '320px',
    borderRadius: '12px',
    backgroundColor: auth.card,
  },
});
