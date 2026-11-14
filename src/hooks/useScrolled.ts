import { useEffect, useState } from 'react';

// whether the page has scrolled at all, for a box that sticks from the very top (the explore screen's search, a
// profile's back link) to show a line under itself once things go under it. only set when it changes, not on every
// scroll
export function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 0);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return scrolled;
}
