import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import { jakarta, newsreader } from '@/styles/font';
import TextLink from '@/components/TextLink';

// the brand panel stays put while the signup steps (email, phone, code) swap on the right
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${jakarta.variable} ${newsreader.variable}`}>
      <main {...stylex.props(styles.page)}>
        <section {...stylex.props(styles.hero)}>
          <div {...stylex.props(styles.brand)}>
            <p {...stylex.props(styles.logo)}>Holidayfriend</p>
            <p {...stylex.props(styles.tagline)}>For travelers who want to meet locals</p>
          </div>
          <p {...stylex.props(styles.loginPrompt)}>
            Already have an account? <TextLink href="/login">Log in</TextLink>
          </p>
        </section>

        <section {...stylex.props(styles.panel)}>
          <div {...stylex.props(styles.content)}>{children}</div>
        </section>
      </main>
    </div>
  );
}

const styles = stylex.create({
  page: {
    display: 'flex',
    flexDirection: { default: 'column', [breakpoints.desktop]: 'row' },
    minHeight: '100vh',
    backgroundColor: auth.surface,
    color: auth.text,
    fontFamily: 'var(--font-jakarta), system-ui, sans-serif',
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    width: { default: '100%', [breakpoints.desktop]: '420px' },
    minHeight: { default: null, [breakpoints.desktop]: '100vh' },
    paddingBlock: { default: '120px 32px', [breakpoints.desktop]: '48px 48px' },
    paddingInline: { default: '24px', [breakpoints.desktop]: '48px' },
    backgroundColor: auth.hero,
    borderStyle: 'solid',
    borderColor: auth.border,
    borderWidth: 0,
    borderBottomWidth: { default: '1px', [breakpoints.desktop]: 0 },
    borderRightWidth: { default: 0, [breakpoints.desktop]: '1px' },
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: { default: '16px', [breakpoints.desktop]: '20px' },
    flexGrow: { default: 0, [breakpoints.desktop]: 1 },
    textAlign: 'center',
  },
  logo: {
    fontFamily: 'var(--font-newsreader), Georgia, serif',
    fontSize: { default: '44px', [breakpoints.desktop]: '54px' },
    fontWeight: 400,
    letterSpacing: '-0.03em',
    lineHeight: 1,
  },
  tagline: {
    fontFamily: 'var(--font-newsreader), Georgia, serif',
    fontSize: { default: '19px', [breakpoints.desktop]: '21px' },
    fontStyle: 'italic',
    fontWeight: 300,
    letterSpacing: '0.005em',
    color: auth.muted,
  },
  loginPrompt: {
    marginTop: { default: '80px', [breakpoints.desktop]: 0 },
    fontSize: '15px',
    color: auth.muted,
  },
  panel: {
    display: 'flex',
    flexGrow: 1,
    alignItems: { default: 'flex-start', [breakpoints.desktop]: 'center' },
    justifyContent: 'center',
    paddingBlock: { default: '40px', [breakpoints.desktop]: '64px' },
    paddingInline: '20px',
  },
  content: {
    width: '100%',
    maxWidth: '420px',
  },
});
