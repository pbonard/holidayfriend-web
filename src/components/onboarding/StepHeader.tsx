import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints } from '@/styles/tokens.stylex';

export default function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <header {...stylex.props(styles.header)}>
      <h1 {...stylex.props(styles.title)}>{title}</h1>
      <p {...stylex.props(styles.description)}>{description}</p>
    </header>
  );
}

const styles = stylex.create({
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: { default: '32px', [breakpoints.desktop]: '34px' },
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.2,
  },
  description: {
    marginTop: '8px',
    fontSize: '16px',
    lineHeight: 1.5,
    color: auth.muted,
  },
});
