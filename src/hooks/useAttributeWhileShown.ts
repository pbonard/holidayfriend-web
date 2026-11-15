import { useLayoutEffect, useRef } from 'react';

// an attribute on the element only while it's shown. with cacheComponents, next doesn't unmount a page left behind:
// it hides it with react's <Activity> (display: none), still in the document. a style that looks for the attribute
// (stylex.when.siblingAfter, .descendant…) would still find it on the hidden page. effects are cleaned up when a
// page is hidden and run again when it's shown, so the attribute follows. the element renders it too, for the
// first paint, before effects run
export function useAttributeWhileShown<T extends HTMLElement>(name: string) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.setAttribute(name, '');
    return () => element.removeAttribute(name);
  }, [name]);
  return ref;
}
