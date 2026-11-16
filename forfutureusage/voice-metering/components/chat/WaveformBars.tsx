import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';

// the lowest a bar goes, so silence still shows as a line of dots
const MIN_HEIGHT = 0.15;

type WaveformBarsProps = {
  // 0 to 1 each, left to right
  levels: readonly number[];
  // how much is played, 0 to 1: the bars up to there in the accent. all of them when it isn't given (a live meter)
  progress?: number;
};

// a voice message's loudness as bars, as tall as the box they're in. decorative: the player says where it is
export default function WaveformBars({ levels, progress }: WaveformBarsProps) {
  return (
    <div aria-hidden="true" {...stylex.props(styles.bars)}>
      {levels.map((level, index) => (
        <span
          key={index}
          {...stylex.props(
            styles.bar(Math.max(MIN_HEIGHT, level)),
            progress !== undefined &&
              (index + 0.5) / levels.length > progress &&
              styles.unplayed,
          )}
        />
      ))}
    </div>
  );
}

const styles = stylex.create({
  bars: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    height: '100%',
  },
  bar: (height: number) => ({
    flexGrow: 1,
    flexBasis: 0,
    minWidth: '2px',
    height: `${height * 100}%`,
    borderRadius: '999px',
    backgroundColor: auth.link,
  }),
  unplayed: {
    backgroundColor: auth.border,
  },
});
