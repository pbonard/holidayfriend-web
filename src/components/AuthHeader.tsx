import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints } from '@/styles/tokens.stylex';

type AuthHeaderProps = {
  title: string;
  description?: React.ReactNode;
};

export default function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <header {...stylex.props(styles.header, description != null && styles.withDescription)}>
      <h1 {...stylex.props(styles.title)}>{title}</h1>
      {description != null && <p {...stylex.props(styles.description)}>{description}</p>}
    </header>
  );
}

const styles = stylex.create({
  header: {
    marginBottom: { default: '52px', [breakpoints.desktop]: '48px' },
  },
  withDescription: {
    marginBottom: '24px',
  },
  title: {
    fontSize: { default: '32px', [breakpoints.desktop]: '34px' },
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
  },
  description: {
    marginTop: '10px',
    fontSize: '17px',
    lineHeight: 1.5,
    color: auth.muted,
  },
});
