import { useId } from 'react';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';

type ToggleProps = {
  label: string;
  // a line under the label on what turning it on means
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

// an on/off switch with its label. only the switch and the space around it toggle, the text is plain text
export default function Toggle({
  label,
  description,
  checked,
  onChange,
}: ToggleProps) {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <div {...stylex.props(styles.row)}>
      <div {...stylex.props(styles.text)}>
        <span id={labelId} {...stylex.props(styles.label)}>
          {label}
        </span>
        {description && (
          <span id={descriptionId} {...stylex.props(styles.description)}>
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={() => onChange(!checked)}
        {...stylex.props(styles.hitArea)}
      >
        <span {...stylex.props(styles.track, checked && styles.trackOn)}>
          <span {...stylex.props(styles.thumb, checked && styles.thumbOn)} />
        </span>
      </button>
    </div>
  );
}

const styles = stylex.create({
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    paddingBlock: '10px',
  },
  // larger than the switch, so a thumb near it still hits. the negative margin keeps the switch where it was
  hitArea: {
    display: 'flex',
    flexShrink: 0,
    padding: '10px',
    margin: '-10px',
    borderWidth: 0,
    borderRadius: '12px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
    outlineOffset: '-2px',
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  label: {
    fontSize: '15px',
    fontWeight: 600,
  },
  description: {
    fontSize: '13px',
    lineHeight: 1.4,
    color: auth.muted,
  },
  track: {
    position: 'relative',
    flexShrink: 0,
    width: '44px',
    height: '26px',
    borderRadius: '13px',
    backgroundColor: auth.border,
    transition: 'background-color 120ms ease',
  },
  trackOn: {
    backgroundColor: auth.accent,
  },
  thumb: {
    position: 'absolute',
    top: '3px',
    left: '3px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: auth.text,
    transition: 'transform 120ms ease',
  },
  thumbOn: {
    transform: 'translateX(18px)',
  },
});
