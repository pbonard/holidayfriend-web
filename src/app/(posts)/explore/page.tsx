import { Suspense } from 'react';
import type { Metadata } from 'next';
import Explore from '@/components/post/Explore';

export const metadata: Metadata = {
  title: 'Explore · Holidayfriend',
};

// goes on to the city explored last, or the viewer's own. in its own suspense: the screen reads the tab from the query
export default function ExplorePage() {
  return (
    <Suspense>
      <Explore />
    </Suspense>
  );
}
