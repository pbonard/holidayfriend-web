import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';

// a tint and text color per city chip, so each place stands apart. picked by the city with toneOf, so a city has
// the same color in the post form and on the explore cards
const toneStyles = stylex.create({
  rust: { backgroundColor: '#3a2a24', color: auth.link },
  blue: { backgroundColor: '#24303a', color: '#9dc0e8' },
  green: { backgroundColor: '#26322a', color: '#9fcfa8' },
  purple: { backgroundColor: '#33263a', color: '#c9a3e0' },
  yellow: { backgroundColor: '#37321f', color: '#e3c66f' },
  pink: { backgroundColor: '#3a2430', color: '#e89ab8' },
  teal: { backgroundColor: '#1f3433', color: '#84d1c8' },
});

export const tones = [
  toneStyles.rust,
  toneStyles.blue,
  toneStyles.green,
  toneStyles.purple,
  toneStyles.yellow,
  toneStyles.pink,
  toneStyles.teal,
];

// the same city has the same color on every card
export function toneOf(key: string) {
  let hash = 0;
  for (const char of key) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return tones[Math.abs(hash) % tones.length];
}
