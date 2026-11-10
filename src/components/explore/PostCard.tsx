import { useState } from 'react';
import Link from 'next/link';
import * as stylex from '@stylexjs/stylex';
import { toneOf } from '@/styles/tones';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import type { Place, PostFeedItem } from '@/types/post';
import HomeIcon from '@/components/icons/HomeIcon';
import MapPinIcon from '@/components/icons/MapPinIcon';
import { countryName, explorePath, samePlace } from '@/utils/citySearch';

const ROLE_LABELS = { local: 'Local', traveler: 'Traveler' } as const;
// more would take over the card on a long trip, the rest open with the +n button
const MAX_CITIES = 3;

// a post of the city being explored, `place`. myBasedIn is the viewer's own city, null until it's loaded
export default function PostCard({
  post,
  place,
  myBasedIn,
}: {
  post: PostFeedItem;
  place: Place;
  myBasedIn: Place | null;
}) {
  // the first letter of the name in place of a photo, the profile has none yet
  const initial = post.authorName.trim().charAt(0).toUpperCase() || '?';
  // the rest of the trip: the city being explored goes without saying
  const otherCities = post.places.filter((city) => !samePlace(city, place));
  const [showAllCities, setShowAllCities] = useState(false);
  const shown = showAllCities ? otherCities : otherCities.slice(0, MAX_CITIES);
  const hiddenCount = otherCities.length - shown.length;
  // a traveler from home stands out, the city before the country. not a local: they live in the city being
  // explored, so the tag would only say that the viewer lives there too
  const author = post.authorBasedIn;
  // an author who shows only their country is never the same city, even when they are
  const sameCountry = author?.country === myBasedIn?.country;
  // "Based in Seoul" when it's the viewer's city too, or their shared country when the city isn't the same or
  // isn't shown
  const fromHome =
    post.role === 'local' || !author || !myBasedIn || !sameCountry
      ? null
      : author.city === myBasedIn.city
        ? `Based in ${author.city}`
        : `Based in ${countryName(author.country)}`;

  return (
    <article {...stylex.props(styles.card)}>
      <header {...stylex.props(styles.author)}>
        <span aria-hidden="true" {...stylex.props(styles.avatar)}>
          {initial}
        </span>
        <div>
          <p {...stylex.props(styles.name)}>{post.authorName}</p>
          {/* "Traveler · ⌂ Based in Kyoto": the home icon and the accent say it's the viewer's home too */}
          <p {...stylex.props(styles.role)}>
            {ROLE_LABELS[post.role]}
            {fromHome && (
              <>
                <span aria-hidden="true" {...stylex.props(styles.dot)}>
                  ·
                </span>
                <span {...stylex.props(styles.fromHome)}>
                  <HomeIcon size={13} xstyle={styles.homeIcon} />
                  {fromHome}
                </span>
              </>
            )}
          </p>
        </div>
      </header>
      <h2 {...stylex.props(styles.title)}>{post.title}</h2>
      {shown.length > 0 && (
        <div {...stylex.props(styles.cities)}>
          <MapPinIcon size={15} xstyle={styles.pin} />
          <span {...stylex.props(styles.also)}>Also going to travel</span>
          {/* each one opens that city, so a trip leads on to the next */}
          {shown.map((city) => (
            <Link
              key={`${city.country}-${city.city}`}
              href={explorePath(city)}
              {...stylex.props(
                styles.city,
                toneOf(`${city.country}-${city.city}`),
              )}
            >
              {city.city}
            </Link>
          ))}
          {/* the rest of the trip in place, as tags like the others. a tap works where a hover tooltip can't */}
          {hiddenCount > 0 && (
            <button
              type="button"
              aria-label={`Show ${hiddenCount} more ${hiddenCount === 1 ? 'city' : 'cities'}`}
              onClick={() => setShowAllCities(true)}
              {...stylex.props(styles.more)}
            >
              +{hiddenCount}
            </button>
          )}
        </div>
      )}
      <p {...stylex.props(styles.body)}>{post.body}</p>
    </article>
  );
}

const styles = stylex.create({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: '22px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.cardBorder,
    borderRadius: '14px',
    backgroundColor: auth.card,
    // a long word or link breaks instead of widening the card
    overflowWrap: 'anywhere',
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: auth.control,
    fontSize: '17px',
    fontWeight: 700,
  },
  name: {
    fontSize: '16px',
    fontWeight: 700,
    lineHeight: 1.3,
  },
  // the role, and where the author is based in when it's the viewer's home too. wraps on a narrow card
  role: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: '6px',
    fontSize: '14px',
    lineHeight: 1.3,
    color: auth.muted,
  },
  dot: {
    color: auth.placeholder,
  },
  // the accent with a soft halo of itself around the letters, so it looks lit. still, nothing moves
  fromHome: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: auth.link,
    fontWeight: 600,
    textShadow: '0 0 6px rgba(232, 163, 124, 0.55)',
  },
  // the same halo for the icon, following its lines (a box-shadow would glow around its square box)
  homeIcon: {
    flexShrink: 0,
    filter: 'drop-shadow(0 0 3px rgba(232, 163, 124, 0.7))',
  },
  title: {
    fontSize: '19px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
  },
  cities: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px',
    // closer to the title it belongs to than the card's gap
    marginTop: '-4px',
  },
  pin: {
    color: auth.muted,
  },
  also: {
    marginRight: '2px',
    fontSize: '13px',
    color: auth.muted,
  },
  city: {
    display: 'inline-flex',
    alignItems: 'center',
    height: '26px',
    paddingInline: '10px',
    borderRadius: '13px',
    fontSize: '13px',
    fontWeight: 600,
    filter: { default: 'none', ':hover': 'brightness(1.25)' },
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
    outlineOffset: '2px',
  },
  more: {
    height: '26px',
    paddingInline: '10px',
    borderWidth: 0,
    borderRadius: '13px',
    backgroundColor: { default: auth.control, ':hover': auth.border },
    color: { default: auth.muted, ':hover': auth.text },
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
    outlineOffset: '2px',
  },
  // the start of the body: 3 lines on a phone's narrow card, 6 on a desktop, and the browser adds … when there's
  // more. its line breaks show as spaces (the default white-space), so the card stays one paragraph
  body: {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: { default: 3, [breakpoints.desktop]: 6 },
    overflow: 'hidden',
    fontSize: '15px',
    lineHeight: 1.55,
    color: auth.muted,
  },
});
