import * as stylex from '@stylexjs/stylex';
import { colors, spacing } from '@/styles/tokens.stylex';

export default function Home() {
  return (
    <main {...stylex.props(styles.main)}>
      <h1 {...stylex.props(styles.title)}>Holiday Friend</h1>
      <p {...stylex.props(styles.subtitle)}>
        Next.js + TanStack Query + StyleX
      </p>
    </main>
  );
}

const styles = stylex.create({
  main: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    minHeight: '100vh',
    padding: spacing.xl,
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 600,
  },
  subtitle: {
    color: colors.muted,
  },
});
