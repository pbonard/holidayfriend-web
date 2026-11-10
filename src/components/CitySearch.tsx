import { type Ref, useId, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import type { Place } from '@/types/post';
import SearchIcon from '@/components/icons/SearchIcon';
import { type CityOption, searchCities } from '@/utils/citySearch';

type CitySearchProps = {
  onPick: (place: Place) => void;
  // the input's accessible name and placeholder
  label?: string;
  autoFocus?: boolean;
  // for a form: its field's ref, so a failed submit focuses it, and the error it shows
  inputRef?: Ref<HTMLInputElement>;
  invalid?: boolean;
  describedBy?: string;
};

// a search over the cities of the list, for exploring a city and for where a profile is based in.
// only a city of the list can be picked, what's typed and not picked is dropped
export default function CitySearch({
  onPick,
  label = 'Search a city or country',
  autoFocus,
  inputRef,
  invalid,
  describedBy,
}: CitySearchProps) {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);

  const results = focused ? searchCities(query) : [];
  const open = results.length > 0;

  const pick = (option: CityOption) => {
    onPick({ country: option.country, city: option.city });
    setQuery('');
    setActive(0);
  };

  return (
    <div {...stylex.props(styles.root)}>
      <SearchIcon size={18} xstyle={styles.icon} />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        autoFocus={autoFocus}
        placeholder={label}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && open) {
            event.preventDefault();
            setActive((index) => (index + 1) % results.length);
          } else if (event.key === 'ArrowUp' && open) {
            event.preventDefault();
            setActive((index) => (index - 1 + results.length) % results.length);
          } else if (event.key === 'Enter') {
            // in a form, enter would submit it with nothing picked
            event.preventDefault();
            if (open) {
              pick(results[active]);
              event.currentTarget.blur();
            }
          } else if (event.key === 'Escape') {
            setQuery('');
          }
        }}
        {...stylex.props(styles.input, invalid && styles.inputInvalid)}
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
  );
}

const styles = stylex.create({
  // what the icon and the list are placed against
  root: {
    position: 'relative',
    width: '100%',
  },
  icon: {
    position: 'absolute',
    top: '50%',
    left: '16px',
    transform: 'translateY(-50%)',
    color: auth.muted,
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    height: '48px',
    paddingLeft: '44px',
    paddingRight: '14px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: auth.border, ':focus': auth.link },
    borderRadius: '10px',
    outline: 'none',
    backgroundColor: auth.control,
    color: auth.text,
    fontFamily: 'inherit',
    // 16px keeps ios safari from zooming in on focus
    fontSize: '16px',
    '::placeholder': {
      color: auth.placeholder,
    },
  },
  inputInvalid: {
    borderColor: auth.danger,
  },
  list: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    zIndex: 10,
    maxHeight: '320px',
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
    paddingBlock: '10px',
    paddingInline: '12px',
    borderRadius: '8px',
    fontSize: '15px',
    lineHeight: 1.4,
    cursor: 'pointer',
  },
  optionActive: {
    backgroundColor: auth.control,
  },
});
