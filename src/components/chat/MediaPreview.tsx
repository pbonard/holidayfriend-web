import Image from 'next/image';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import CloseIcon from '@/components/icons/CloseIcon';

// a photo or video picked, not sent yet. url: the file's object url, what its thumbnail shows
export type Attachment = {
  id: string;
  file: File;
  url: string;
};

type MediaPreviewProps = {
  attachments: Attachment[];
  // the ×: it's taken off, not sent
  onRemove: (id: string) => void;
};

// the photos and videos picked, in a row in the input's place, each with an × in its top right corner to take it off.
// a row that scrolls sideways when there are more than fit
export default function MediaPreview({ attachments, onRemove }: MediaPreviewProps) {
  return (
    <ul aria-label="To send" {...stylex.props(styles.row)}>
      {attachments.map(({ id, file, url }) => {
        const video = file.type.startsWith('video/');
        return (
          <li key={id} {...stylex.props(styles.item)}>
            {video ? (
              // its first frame. muted and never played, only shown
              <video src={url} muted playsInline preload="metadata" {...stylex.props(styles.thumb)} />
            ) : (
              // unoptimized: a local object url, next's image optimizer can't fetch it
              <Image
                src={url}
                alt={file.name}
                width={72}
                height={72}
                unoptimized
                {...stylex.props(styles.thumb)}
              />
            )}
            {video && <span {...stylex.props(styles.badge)}>Video</span>}
            <button
              type="button"
              aria-label={`Remove ${file.name}`}
              onClick={() => onRemove(id)}
              {...stylex.props(styles.remove)}
            >
              <CloseIcon size={12} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

const styles = stylex.create({
  row: {
    display: 'flex',
    gap: '10px',
    // room for the × buttons, which sit over the thumbnails' corners. as much under them, so the thumbnails sit in
    // the middle of the box, as far from its bottom as from its top
    paddingTop: '6px',
    paddingRight: '6px',
    paddingBottom: '6px',
    overflowX: 'auto',
    listStyle: 'none',
  },
  item: {
    position: 'relative',
    flexShrink: 0,
  },
  thumb: {
    display: 'block',
    width: '72px',
    height: '72px',
    borderRadius: '10px',
    objectFit: 'cover',
    backgroundColor: auth.card,
  },
  // over the bottom of a video's thumbnail, so it isn't taken for a photo
  badge: {
    position: 'absolute',
    left: '4px',
    bottom: '4px',
    paddingBlock: '1px',
    paddingInline: '5px',
    borderRadius: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 600,
  },
  // the thumbnail's top right corner, half outside it
  remove: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    padding: 0,
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: auth.page,
    borderRadius: '50%',
    backgroundColor: { default: auth.surface, ':hover': auth.border },
    color: auth.text,
    cursor: 'pointer',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
  },
});
