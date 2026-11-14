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

// GET /api/profile: what a screen needs of the person logged in
export interface ProfileBrief {
  // their own posts are told by it, e.g. no "Say hi" on them
  id: string;
  name: string;
  basedInCountry: string;
  basedInCity: string;
}
