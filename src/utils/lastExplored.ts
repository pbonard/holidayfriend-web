import { CITIES_BY_COUNTRY } from '@/constants/cities';
import type { Place } from '@/types/post';

// the city the viewer explored last, where /explore (the sidebar's Explore) takes them back to.
// only in this browser: a new one starts at the city their profile is based in

const STORAGE_KEY = 'lastExplored';

// null when nothing's kept, storage is blocked, or the city is no longer in the list
export function readLastExplored(): Place | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (
      value &&
      typeof value === 'object' &&
      'country' in value &&
      'city' in value &&
      typeof value.country === 'string' &&
      typeof value.city === 'string' &&
      CITIES_BY_COUNTRY[value.country]?.includes(value.city)
    ) {
      return { country: value.country, city: value.city };
    }
  } catch {
    // unreadable is the same as nothing kept
  }
  return null;
}

export function saveLastExplored(place: Place) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ country: place.country, city: place.city }),
    );
  } catch {
    // not kept, /explore goes to the profile's city instead
  }
}
