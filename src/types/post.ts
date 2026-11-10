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

export interface AuthorBasedIn {
  country: string;
  // null when the author shows only their country
  city: string | null;
}

// one card of a city's feed, from GET /api/posts
export interface PostFeedItem {
  id: string;
  role: PostRole;
  title: string;
  body: string;
  authorName: string;
  // where the author's profile is based in, as much as they show. null when they show neither or the profile is gone
  authorBasedIn: AuthorBasedIn | null;
  // every city of the post, the one being explored too. a local's post has just theirs
  places: Place[];
}

