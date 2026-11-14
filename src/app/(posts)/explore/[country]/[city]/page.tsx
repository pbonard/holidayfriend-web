import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Explore from '@/components/post/Explore';
import { CITIES_BY_COUNTRY } from '@/constants/cities';
import { citySlug, placeFromPath, placeLabel } from '@/utils/citySearch';

type Params = Promise<{ country: string; city: string }>;

// every city of the list is built ahead, so its path is known while prerendering
export function generateStaticParams() {
  return Object.entries(CITIES_BY_COUNTRY).flatMap(([country, cities]) =>
    cities.map((city) => ({
      country: country.toLowerCase(),
      city: citySlug(city),
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { country, city } = await params;
  const place = placeFromPath(country, city);
  return {
    title: place
      ? `${placeLabel(place)} · Holidayfriend`
      : 'Explore · Holidayfriend',
  };
}

// /explore/jp/tokyo, the screen reads the city from the path itself. a path that isn't a city of the list is a 404.
// the path is read inside the page's own suspense: the explore layout's is already on screen when going from one
// city to another, so it can't show while this one waits, and the navigation would wait for it
export default function ExploreCityPage({ params }: { params: Params }) {
  return (
    <Suspense>
      <ExploreCity params={params} />
    </Suspense>
  );
}

async function ExploreCity({ params }: { params: Params }) {
  const { country, city } = await params;
  if (!placeFromPath(country, city)) {
    notFound();
  }
  return <Explore />;
}
