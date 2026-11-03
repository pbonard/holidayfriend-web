import Link from 'next/link';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';

type TextLinkProps = Omit<React.ComponentProps<typeof Link>, 'className' | 'style'>;

// the underlined accent link used inside sentences ("Log in", "Terms of Service", "Change")
export default function TextLink(props: TextLinkProps) {
  return <Link {...props} {...stylex.props(styles.link)} />;
}

const styles = stylex.create({
  link: {
    color: auth.link,
    fontWeight: 600,
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  },
});
