export type PostRole = 'local' | 'traveler';

// one of the cities in CITIES_BY_COUNTRY, the same pair the profile's based in is
export interface Place {
  // ISO 3166-1 alpha-2
  country: string;
  city: string;
}

export interface PostFormValue {
  role: PostRole;
  // where a traveler is going, only asked of a traveler. a local's city is the one their profile is based in
  places: Place[];
  title: string;
  body: string;
}

// what the server takes. places are left out of a local's post
export interface CreatePostRequest {
  role: PostRole;
  places?: Place[];
  title: string;
  body: string;
}
