import { Newsreader } from 'next/font/google';

// editorial serif for the brand, the opsz axis tightens the letterforms at display sizes
export const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
});
