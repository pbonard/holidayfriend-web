import { CITIES_BY_COUNTRY, COUNTRIES } from '@/constants/cities';
import type { Place } from '@/types/post';

// the city search of the post form's places and the explore screen, over the cities of CITIES_BY_COUNTRY
const MAX_RESULTS = 8;

// lowercased and without accents, so "sao" finds São Paulo
export function normalize(text: string) {
  return (
    text
      .normalize('NFD')
      // the accents NFD split off. not a unicode property escape: the babel the stylex plugin runs on fails on the Diacritic one
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
  );
}

export type CityOption = Place & {
  label: string;
  cityKey: string;
  countryKey: string;
};

// every city we have, as "City, Country"
const OPTIONS: CityOption[] = COUNTRIES.flatMap(({ code, name }) =>
  (CITIES_BY_COUNTRY[code] ?? []).map((city) => ({
    country: code,
    city,
    label: `${city}, ${name}`,
    cityKey: normalize(city),
    countryKey: normalize(name),
  })),
);

const COUNTRY_NAMES = new Map(COUNTRIES.map(({ code, name }) => [code, name]));

export function countryName(country: string) {
  return COUNTRY_NAMES.get(country) ?? country;
}

export function placeLabel({ country, city }: Place) {
  return `${city}, ${COUNTRY_NAMES.get(country) ?? country}`;
}

export function samePlace(a: Place, b: Place) {
  return a.country === b.country && a.city === b.city;
}

// cities starting with the query first, then cities containing it, then cities of a matching country
export function searchCities(
  query: string,
  exclude: Place[] = [],
): CityOption[] {
  const key = normalize(query.trim());
  if (!key) {
    return [];
  }
  const rank = (option: CityOption) => {
    if (option.cityKey.startsWith(key)) return 0;
    if (option.cityKey.includes(key)) return 1;
    if (option.countryKey.startsWith(key)) return 2;
    // "tokyo, ja" as typed out in full
    if (`${option.cityKey}, ${option.countryKey}`.includes(key)) return 3;
    return -1;
  };
  return OPTIONS.map((option) => ({ option, rank: rank(option) }))
    .filter(
      ({ option, rank }) =>
        rank >= 0 && !exclude.some((place) => samePlace(place, option)),
    )
    .sort(
      (a, b) => a.rank - b.rank || a.option.label.localeCompare(b.option.label),
    )
    .slice(0, MAX_RESULTS)
    .map(({ option }) => option);
}

// the city as a path segment: lowercased, without accents and apostrophes, words joined by -.
// São Paulo is sao-paulo, St. John's is st-johns. no two cities of a country have the same one
export function citySlug(city: string) {
  return normalize(city)
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// the explore screen of a city, /explore/jp/tokyo
export function explorePath({ country, city }: Place) {
  return `/explore/${country.toLowerCase()}/${citySlug(city)}`;
}

// the city of /explore/jp/tokyo, null when the path isn't one of the list's cities
export function placeFromPath(
  countrySegment: string,
  citySegment: string,
): Place | null {
  const country = countrySegment.toUpperCase();
  const slug = citySegment.toLowerCase();
  const city = CITIES_BY_COUNTRY[country]?.find(
    (name) => citySlug(name) === slug,
  );
  return city ? { country, city } : null;
}
