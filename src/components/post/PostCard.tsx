import { useState } from 'react';
import Link from 'next/link';
import * as stylex from '@stylexjs/stylex';
import { ROLE_LABELS } from '@/constants';
import { toneOf } from '@/styles/tones';
import { auth, breakpoints, cardLinkMarker } from '@/styles/tokens.stylex';
import type { Place, PostFeedItem } from '@/types/post';
import PersonHeader from '@/components/PersonHeader';
import HomeIcon from '@/components/icons/HomeIcon';
import MapPinIcon from '@/components/icons/MapPinIcon';
import {
  basedInLabel,
  countryName,
  explorePath,
  postPath,
  samePlace,
} from '@/utils/citySearch';

// more would take over the card on a long trip, the rest open with the +n button. the post's page shows them all
const MAX_CITIES = 3;

type PostCardProps = {
  post: PostFeedItem;
  // the city it's seen from: the feed's city, or the one the post's page was opened from
  place: Place;
  // the viewer's own city, null until it's loaded
  myBasedIn: Place | null;
  // the post's own page: no link, the title big, the whole body and every city, the author's city in full
  detail?: boolean;
  // the page's buttons: beside the author on a desktop, at the very bottom on a phone
  actions?: React.ReactNode;
};

// a post: a card of the feed or of the recommendations, where the whole card opens the post's page and its city
// tags and +n button do their own thing, or the post on its own page (detail)
export default function PostCard({
  post,
  place,
  myBasedIn,
  detail = false,
  actions,
}: PostCardProps) {
  // the rest of the trip: the city it's seen from goes without saying
  const otherCities = post.places.filter((city) => !samePlace(city, place));
  const [showAllCities, setShowAllCities] = useState(detail);
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
  // the page tells everyone's city: "Tokyo, Japan", a traveler's with "from"
  const basedIn =
    detail && author
      ? `${post.role === 'traveler' ? 'from ' : ''}${basedInLabel(author)}`
      : null;

  const cities = shown.length > 0 && (
    <div {...stylex.props(styles.fullWidth, styles.cities)}>
      <MapPinIcon size={15} xstyle={styles.pin} />
      <span {...stylex.props(styles.also)}>Also going to travel</span>
      {/* each one opens that city, so a trip leads on to the next */}
      {shown.map((city) => (
        <Link
          key={`${city.country}-${city.city}`}
          href={explorePath(city)}
          {...stylex.props(styles.city, toneOf(`${city.country}-${city.city}`))}
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
  );

  return (
    <article
      {...stylex.props(
        styles.card,
        detail ? styles.detailCard : styles.listCard,
      )}
    >
      <header {...stylex.props(styles.author)}>
        <PersonHeader userId={post.authorId} name={post.authorName} large={detail}>
          {/* "Traveler · ⌂ Based in Kyoto": the home icon and the accent say it's the viewer's home too */}
          {ROLE_LABELS[post.role]}
          {(fromHome || basedIn) && (
            <span aria-hidden="true" {...stylex.props(styles.dot)}>
              ·
            </span>
          )}
          {fromHome ? (
            <span {...stylex.props(styles.fromHome)}>
              <HomeIcon size={13} xstyle={styles.homeIcon} />
              {fromHome}
            </span>
          ) : (
            basedIn
          )}
        </PersonHeader>
      </header>

      {detail ? (
        <h1 {...stylex.props(styles.fullWidth, styles.detailTitle)}>
          {post.title}
        </h1>
      ) : (
        // the title is the link, its ::after covers the card so the whole card opens the post. a link can't hold
        // other links or buttons, so the city tags and the +n button sit on a layer above it instead
        <h2 {...stylex.props(styles.fullWidth, styles.title)}>
          <Link
            href={postPath(place, post.id)}
            {...stylex.props(cardLinkMarker, styles.open)}
          >
            {post.title}
          </Link>
        </h2>
      )}

      <p
        {...stylex.props(
          styles.fullWidth,
          detail ? styles.detailBody : styles.body,
        )}
      >
        {post.body}
      </p>

      {/* the trip at the bottom: the body follows the title right away, and side by side (the recommendations)
          the cards' bodies start, and their trips sit, at the same height */}
      {cities}

      {actions && <div {...stylex.props(styles.actions)}>{actions}</div>}
    </article>
  );
}

// the [stylex.when.descendant(':focus-visible', cardLinkMarker)] key: the card while its title link has the
// keyboard's focus, the area the link opens from
const styles = stylex.create({
  card: {
    // what the title link's ::after covers
    position: 'relative',
    padding: '22px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: auth.cardBorder, ':hover': auth.border },
    borderRadius: '14px',
    backgroundColor: auth.card,
    // a long word or link breaks instead of widening the card
    overflowWrap: 'anywhere',
    // only that link's focus (cardLinkMarker), so a focused city tag or +n button keeps its own ring instead
    outline: {
      default: 'none',
      [stylex.when.descendant(':focus-visible', cardLinkMarker)]:
        `2px solid ${auth.link}`,
    },
    outlineOffset: '2px',
    transition: 'border-color 120ms ease',
  },
  // a card of a list, one column: author, title, body, then the trip
  listCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  // the post's page: the author with the buttons on their right on a desktop and everything else across both
  // columns, one column on a phone with the buttons last (order). roomier, and nothing to hover since it opens
  // nothing
  detailCard: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [breakpoints.desktop]: 'minmax(0, 1fr) auto',
    },
    alignItems: 'start',
    rowGap: { default: '16px', [breakpoints.desktop]: '20px' },
    columnGap: '16px',
    padding: { default: '22px', [breakpoints.desktop]: '36px' },
    borderColor: auth.cardBorder,
    borderRadius: '18px',
  },
  // across both columns of the page's grid, nothing in a list card's column
  fullWidth: {
    gridColumnStart: 1,
    gridColumnEnd: -1,
  },
  // the author: on its own in a list card's column, beside the buttons on the post's page
  author: {
    minWidth: 0,
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
  // beside the author on a desktop, the very last on a phone: after the trip
  actions: {
    order: { default: 2, [breakpoints.desktop]: 0 },
    gridColumnStart: { default: 1, [breakpoints.desktop]: 2 },
    gridRowStart: { default: 'auto', [breakpoints.desktop]: 1 },
    display: 'flex',
    gap: '10px',
  },
  title: {
    fontSize: '19px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
  },
  detailTitle: {
    fontSize: { default: '28px', [breakpoints.desktop]: '36px' },
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
  },
  open: {
    color: 'inherit',
    textDecoration: 'none',
    outline: 'none',
    // covers the card: the whole card is the link's area
    '::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: '14px',
    },
  },
  // above the title link's ::after, so the tags and the button do their own thing instead of opening the post.
  // the auto margin takes what a card stretched to a taller neighbor has to spare, so the trip sits at its bottom
  cities: {
    // after the body on a phone's page too, before its buttons
    order: { default: 1, [breakpoints.desktop]: 0 },
    marginTop: 'auto',
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px',
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
    textDecoration: 'none',
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
  // the whole body on the page, with the line breaks it was written with
  detailBody: {
    whiteSpace: 'pre-wrap',
    fontSize: { default: '17px', [breakpoints.desktop]: '18px' },
    lineHeight: 1.6,
  },
});
