import { useEffect, useState } from 'react';

type InfiniteList = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  fetchNextPage: () => unknown;
};

// how far ahead of the end the next page is asked for, so it's usually there before it's scrolled to
const AHEAD = '600px';

// the next page as the end of a list scrolls near the window's bottom, like a list's onEndReached. returns the ref
// for an empty element after the list's last item, the end the observer watches
export function useEndReached(list: InfiniteList) {
  const [end, setEnd] = useState<Element | null>(null);
  useLoadAtEnd(list, end, null, `0px 0px ${AHEAD} 0px`);
  return setEnd;
}

// the same for a row that scrolls sideways: the next page as the row's end scrolls near its right edge. returns the
// refs for the row, the box it scrolls in, and for an empty element after its last item
export function useEndReachedHorizontally(list: InfiniteList) {
  const [row, setRow] = useState<Element | null>(null);
  const [end, setEnd] = useState<Element | null>(null);
  // the end only once the row is there too, or its observer would watch the window instead
  useLoadAtEnd(list, row && end, row, `0px ${AHEAD} 0px 0px`);
  return { rowRef: setRow, endRef: setEnd };
}

// the elements are state from callback refs and not useRef, so the observer starts when they appear: a list that
// shows only once its data is there (a row that's nothing while it's empty) would otherwise never be watched.
// root null is the window
function useLoadAtEnd(
  {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  }: InfiniteList,
  end: Element | null,
  root: Element | null,
  rootMargin: string,
) {
  useEffect(() => {
    // a failed page waits for its retry instead of asking again on every scroll
    if (!end || !hasNextPage || isFetchingNextPage || isFetchNextPageError) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchNextPage();
        }
      },
      { root, rootMargin },
    );
    observer.observe(end);
    return () => observer.disconnect();
  }, [
    end,
    root,
    rootMargin,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  ]);
}
