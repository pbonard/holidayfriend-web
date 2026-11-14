import type { AuthorBasedIn } from '@/types/post';

// how much of where they're based in shows on their posts. one value, so a city can't be shown without its country
export type ShowBasedIn = 'city' | 'country' | 'none';

export interface ProfileFormValue {
  name: string;
  basedInCountry: string;
  basedInCity: string;
  aboutMe: string;
  grewUpIn: string;
  languages: string;
  dreamDestination: string;
  obsession: string;
  localSpot: string;
  bestTrip: string;
  birthDecade: string;
  funFact: string;
  showBasedIn: ShowBasedIn;
}

// GET /api/profile/{id}: a person's profile page, as anyone sees it. an unanswered prompt is ''
export interface Profile {
  id: string;
  name: string;
  // as much as they show, null when they show neither
  basedIn: AuthorBasedIn | null;
  aboutMe: string;
  grewUpIn: string;
  languages: string;
  dreamDestination: string;
  obsession: string;
  localSpot: string;
  bestTrip: string;
  birthDecade: string;
  funFact: string;
}

// GET /api/profile/brief/my: what a screen needs of the person logged in
export interface ProfileBrief {
  // their own posts are told by it, e.g. no "Say hi" on them
  id: string;
  name: string;
  basedInCountry: string;
  basedInCity: string;
}
