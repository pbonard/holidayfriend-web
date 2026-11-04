import * as stylex from '@stylexjs/stylex';

const DARK = '@media (prefers-color-scheme: dark)';

export const colors = stylex.defineVars({
  background: { default: '#ffffff', [DARK]: '#0a0a0a' },
  foreground: { default: '#171717', [DARK]: '#ededed' },
  muted: { default: '#666666', [DARK]: '#a1a1a1' },
  border: { default: '#ebebeb', [DARK]: '#1f1f1f' },
});

// the auth pages are always dark, whatever the system scheme
export const auth = stylex.defineVars({
  hero: '#151413',
  // lighter than the #202124 google's dark button is locked to, so the sign in buttons stand out
  surface: '#2e2c29',
  control: '#252422',
  border: '#46433f',
  text: '#f4efe8',
  muted: '#a9a49c',
  placeholder: '#77726b',
  accent: '#7a4030',
  accentHover: '#8a4a38',
  link: '#e8a37c',
  danger: '#f07a6a',
});

export const breakpoints = stylex.defineConsts({
  desktop: '@media (min-width: 768px)',
});

export const spacing = stylex.defineVars({
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
});

export const fonts = stylex.defineVars({
  sans: 'var(--font-geist-sans), system-ui, sans-serif',
  mono: 'var(--font-geist-mono), ui-monospace, monospace',
});
