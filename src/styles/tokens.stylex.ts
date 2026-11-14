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
  // the darker page behind the profile setup's card. also written out as themeColor in app/layout.tsx, change both:
  // that one goes into a <meta> tag and can't read this variable, and defineVars can't take it from an import
  page: '#1f1e1c',
  card: '#272624',
  cardBorder: '#363431',
  input: '#1b1a18',
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
  sans: 'var(--font-google-sans), Roboto, Arial, sans-serif',
  mono: 'var(--font-geist-mono), ui-monospace, monospace',
});

// on <html>, which the root layout's inline script marks data-sidebar="collapsed" before the first paint:
// the sidebar's collapsed styles are stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)
export const rootMarker = stylex.defineMarker();

// on the login layout, whose panel is lighter: <html> takes that color with stylex.when.descendant
export const surfaceMarker = stylex.defineMarker();

// on a card's main link, whose ::after covers the card: the card rings itself with stylex.when.descendant while
// that link has the keyboard's focus, and not while one of its own tags or buttons has it
export const cardLinkMarker = stylex.defineMarker();
