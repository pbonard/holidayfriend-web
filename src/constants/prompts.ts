import ClockIcon from '@/components/icons/ClockIcon';
import GlobeIcon from '@/components/icons/GlobeIcon';
import HeartIcon from '@/components/icons/HeartIcon';
import HomeIcon from '@/components/icons/HomeIcon';
import LightbulbIcon from '@/components/icons/LightbulbIcon';
import MapPinIcon from '@/components/icons/MapPinIcon';
import SendIcon from '@/components/icons/SendIcon';
import SuitcaseIcon from '@/components/icons/SuitcaseIcon';

// the profile's prompts, in order: asked by onboarding's about step, answered on a profile's page
export const PROMPTS = [
  { name: 'grewUpIn', label: 'I grew up in', Icon: HomeIcon },
  { name: 'languages', label: 'Languages I speak', Icon: GlobeIcon },
  {
    name: 'dreamDestination',
    label: "Where I've always wanted to go",
    Icon: SendIcon,
  },
  { name: 'obsession', label: "I'm obsessed with", Icon: HeartIcon },
  { name: 'localSpot', label: 'My favorite local spot', Icon: MapPinIcon },
  { name: 'bestTrip', label: 'Best trip so far', Icon: SuitcaseIcon },
  { name: 'birthDecade', label: 'Decade I was born', Icon: ClockIcon },
  { name: 'funFact', label: 'My fun fact', Icon: LightbulbIcon },
] as const;
