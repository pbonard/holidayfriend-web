'use client';

import { useId, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { CITIES_BY_COUNTRY, COUNTRIES } from '@/constants/location';
import { field as fieldStyles } from '@/styles/field';
import { auth } from '@/styles/tokens.stylex';
import type { Place, PostFormValue } from '@/types/post';
import CloseIcon from '@/components/icons/CloseIcon';
import PlusIcon from '@/components/icons/PlusIcon';

const MAX_RESULTS = 8;

// lowercased and without accents, so "sao" finds São Paulo
const normalize = (text: string) =>
  text
    .normalize('NFD')
    // the accents NFD split off. not a unicode property escape: the babel the stylex plugin runs on fails on the Diacritic one
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

type Option = Place & { label: string; cityKey: string; countryKey: string };

// every city we have, as "City, Country"
const OPTIONS: Option[] = COUNTRIES.flatMap(({ code, name }) =>
  (CITIES_BY_COUNTRY[code] ?? []).map((city) => ({
    country: code,
    city,
    label: `${city}, ${name}`,
    cityKey: normalize(city),
    countryKey: normalize(name),
  })),
);

const COUNTRY_NAMES = new Map(COUNTRIES.map(({ code, name }) => [code, name]));

const placeLabel = ({ country, city }: Place) =>
  `${city}, ${COUNTRY_NAMES.get(country) ?? country}`;

const samePlace = (a: Place, b: Place) =>
  a.country === b.country && a.city === b.city;

// cities starting with the query first, then cities containing it, then cities of a matching country
function search(query: string, exclude: Place[]): Option[] {
  const key = normalize(query.trim());
  if (!key) {
    return [];
  }
  const rank = (option: Option) => {
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

// the places as chips, the + opens a search that only adds a city from the list
export default function PlacesInput() {
  const labelId = useId();
  const listId = useId();
  const errorId = useId();
  const { control } = useFormContext<PostFormValue>();
  const {
    field: { value: places, onChange, ref: addRef },
    fieldState: { error },
  } = useController({
    control,
    name: 'places',
    rules: {
      // a traveler's post needs somewhere to go, the server asks for it too
      validate: (places, { role }) =>
        role === 'local' || places.length > 0 || 'Add where you travel',
    },
  });
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const results = search(query, places);
  const open = results.length > 0;

  const close = () => {
    setQuery('');
    setActive(0);
    setAdding(false);
  };

  const pick = (option: Option) => {
    onChange([...places, { country: option.country, city: option.city }]);
    close();
  };

  return (
    <div>
      <p id={labelId} {...stylex.props(fieldStyles.label)}>
        Where
      </p>
      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={error ? errorId : undefined}
        {...stylex.props(styles.row)}
      >
        {adding ? (
          <div {...stylex.props(styles.search)}>
            <input
              autoFocus
              role="combobox"
              aria-label="Search a city"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls={listId}
              aria-activedescendant={open ? `${listId}-${active}` : undefined}
              placeholder="Search a city"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' && open) {
                  event.preventDefault();
                  setActive((index) => (index + 1) % results.length);
                } else if (event.key === 'ArrowUp' && open) {
                  event.preventDefault();
                  setActive(
                    (index) => (index - 1 + results.length) % results.length,
                  );
                } else if (event.key === 'Enter') {
                  // enter would submit the form otherwise, and only a listed city can be added
                  event.preventDefault();
                  if (open) {
                    pick(results[active]);
                  }
                } else if (event.key === 'Escape') {
                  close();
                }
              }}
              // what was typed but not picked is dropped, it isn't a city from the list
              onBlur={close}
              {...stylex.props(styles.input)}
            />
            {open && (
              <ul id={listId} role="listbox" {...stylex.props(styles.list)}>
                {results.map((option, index) => (
                  <li
                    key={`${option.country}-${option.city}`}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                    // mousedown would blur the input and close the list before the click lands
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pick(option)}
                    onMouseEnter={() => setActive(index)}
                    {...stylex.props(
                      styles.option,
                      index === active && styles.optionActive,
                    )}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <button
            // what the form focuses when there's no place yet
            ref={addRef}
            type="button"
            aria-label="Add a place"
            onClick={() => setAdding(true)}
            {...stylex.props(styles.add, error && styles.addError)}
          >
            <PlusIcon size={16} />
          </button>
        )}
        {places
          .map((place, index) => ({ place, index }))
          .reverse()
          .map(({ place, index }) => {
            const label = placeLabel(place);
            return (
              <span
                key={`${place.country}-${place.city}`}
                {...stylex.props(styles.chip, tones[index % tones.length])}
              >
                {label}
                <button
                  type="button"
                  aria-label={`Remove ${label}`}
                  onClick={() =>
                    onChange(places.filter((value) => !samePlace(value, place)))
                  }
                  {...stylex.props(styles.remove)}
                >
                  <CloseIcon size={14} />
                </button>
              </span>
            );
          })}
      </div>
      {error?.message && (
        <p id={errorId} role="alert" {...stylex.props(styles.error)}>
          {error.message}
        </p>
      )}
    </div>
  );
}

const styles = stylex.create({
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px',
  },
  // in the flow, not field.error's overlay: on mobile when comes right under it, with no room for a line between
  error: {
    marginTop: '8px',
    fontSize: '14px',
    lineHeight: '20px',
    color: auth.danger,
  },
  addError: {
    borderColor: auth.danger,
    color: auth.danger,
  },
  add: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    borderWidth: '1px',
    borderStyle: 'dashed',
    borderColor: { default: auth.border, ':hover': auth.muted },
    borderRadius: '50%',
    backgroundColor: 'transparent',
    color: auth.muted,
    cursor: 'pointer',
  },
  // what the list is placed against
  search: {
    position: 'relative',
  },
  input: {
    width: '200px',
    height: '34px',
    paddingInline: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: auth.border, ':focus': auth.link },
    borderRadius: '17px',
    outline: 'none',
    backgroundColor: auth.input,
    color: auth.text,
    fontFamily: 'inherit',
    // 16px keeps ios safari from zooming in on focus
    fontSize: '16px',
    '::placeholder': {
      color: auth.placeholder,
    },
  },
  list: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    zIndex: 10,
    width: '260px',
    maxWidth: 'calc(100vw - 120px)',
    maxHeight: '280px',
    overflowY: 'auto',
    padding: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.border,
    borderRadius: '12px',
    backgroundColor: auth.surface,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    listStyle: 'none',
  },
  option: {
    paddingBlock: '8px',
    paddingInline: '10px',
    borderRadius: '8px',
    fontSize: '15px',
    lineHeight: 1.4,
    cursor: 'pointer',
  },
  optionActive: {
    backgroundColor: auth.control,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: '34px',
    paddingLeft: '12px',
    paddingRight: '6px',
    borderRadius: '17px',
    fontSize: '15px',
    fontWeight: 500,
  },
  remove: {
    display: 'flex',
    padding: '4px',
    borderWidth: 0,
    borderRadius: '50%',
    backgroundColor: {
      default: 'transparent',
      ':hover': 'rgba(255, 255, 255, 0.1)',
    },
    color: 'inherit',
    cursor: 'pointer',
  },
});

// a tint and text color per chip, so each place stands apart. picked by position, so they repeat past the last one
const toneStyles = stylex.create({
  rust: { backgroundColor: '#3a2a24', color: auth.link },
  blue: { backgroundColor: '#24303a', color: '#9dc0e8' },
  green: { backgroundColor: '#26322a', color: '#9fcfa8' },
  purple: { backgroundColor: '#33263a', color: '#c9a3e0' },
  yellow: { backgroundColor: '#37321f', color: '#e3c66f' },
  pink: { backgroundColor: '#3a2430', color: '#e89ab8' },
  teal: { backgroundColor: '#1f3433', color: '#84d1c8' },
});

const tones = [
  toneStyles.rust,
  toneStyles.blue,
  toneStyles.green,
  toneStyles.purple,
  toneStyles.yellow,
  toneStyles.pink,
  toneStyles.teal,
];
