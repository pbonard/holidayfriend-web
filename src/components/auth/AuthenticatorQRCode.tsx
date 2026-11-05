import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import type { AuthenticatorSetup } from '@/types/auth';

export default function AuthenticatorQRCode({
  setup,
}: {
  setup: AuthenticatorSetup;
}) {
  return (
    <>
      {/* a data url from our own backend, there is nothing for next/image to optimize */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/png;base64,${setup.qrCode}`}
        alt="QR code to add this account to Google Authenticator"
        {...stylex.props(styles.qr)}
      />
      <p {...stylex.props(styles.text)}>
        Are you on mobile? <br />
        <a href={setup.otpauthUrl} {...stylex.props(styles.link)}>
          {' '}
          Set up by this link{' '}
        </a>
        or enter this key in your authenticator :{' '}
        <code {...stylex.props(styles.secret)}>{setup.secret}</code>
      </p>
    </>
  );
}

const styles = stylex.create({
  qr: {
    display: 'block',
    width: '180px',
    height: '180px',
    marginInline: 'auto',
    marginBottom: '20px',
    padding: '8px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    imageRendering: 'pixelated',
  },
  text: {
    marginBottom: '20px',
    fontSize: '14px',
    lineHeight: 1.5,
    color: auth.muted,
  },
  link: {
    color: auth.link,
  },
  secret: {
    fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
    fontSize: '13px',
    overflowWrap: 'anywhere',
    color: auth.text,
  },
});
