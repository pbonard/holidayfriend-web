import Image from 'next/image';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints, fonts } from '@/styles/tokens.stylex';
import { newsreader } from '@/styles/font';
import loginHero from '@/assets/login-hero.jpeg';

// the picture stays put on desktop while the steps swap on the right, phones only get the steps
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={newsreader.variable}>
      <main {...stylex.props(styles.page)}>
        <section {...stylex.props(styles.panel)}>
          <div {...stylex.props(styles.content)}>{children}</div>
        </section>

        <section {...stylex.props(styles.hero)}>
          {/* lazy by default, so phones that hide the panel don't download it */}
          <Image
            src={loginHero}
            alt="Friends sharing drinks at a dimly lit bar"
            sizes="50vw"
            {...stylex.props(styles.picture)}
          />
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
    fontFamily: fonts.sans,
  },
  hero: {
    display: { default: 'none', [breakpoints.desktop]: 'flex' },
    // half of the page at every desktop width, the panel takes the other half
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
    minHeight: '100vh',
    padding: '48px',
    backgroundColor: auth.hero,
    borderStyle: 'solid',
    borderColor: auth.border,
    borderWidth: 0,
    borderLeftWidth: '1px',
  },
  // scales to fit inside its half whatever the window's shape, never cropped
  picture: {
    width: 'auto',
    height: 'auto',
    maxWidth: '100%',
    maxHeight: 'calc(100vh - 96px)',
    borderRadius: '8px',
  },
  panel: {
    display: 'flex',
    flexGrow: 0,
    width: { default: '100%', [breakpoints.desktop]: '50%' },
    alignItems: { default: 'flex-start', [breakpoints.desktop]: 'center' },
    justifyContent: 'center',
    paddingBlock: { default: '40px', [breakpoints.desktop]: '64px' },
    paddingInline: '20px',
  },
  content: {
    width: '100%',
    // the form's box: its 40px padding on both sides leaves the 280px google's button can use
    maxWidth: '361px',
  },
});
