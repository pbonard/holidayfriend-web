import { Suspense } from 'react';
import type { Metadata } from 'next';
import Explore from '@/components/explore/Explore';

export const metadata: Metadata = {
  title: 'Explore · Holidayfriend',
};

export default function ExplorePage() {
  // goes on to the viewer's own city, the screen reads the tab from the query, which next only has in the browser
  return (
    <Suspense>
      <Explore />
    </Suspense>
  );
}
