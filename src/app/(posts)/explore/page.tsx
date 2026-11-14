import type { Metadata } from 'next';
import Explore from '@/components/post/Explore';

export const metadata: Metadata = {
  title: 'Explore · Holidayfriend',
};

export default function ExplorePage() {
  // goes on to the viewer's own city. inside the layout's suspense: the screen reads the tab from the query
  return <Explore />;
}
