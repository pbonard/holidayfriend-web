import { useCallback } from 'react';
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { queryKey } from '@/constants';
import {
  createPost,
  getPostDetail,
  listNotInterestedPostIds,
  listPosts,
  listUserPosts,
  markNotInterested,
  POST_PAGE_SIZE,
} from '@/api/post';
import type { Place, PostFeedItem } from '@/types/post';

// the ids of the posts the viewer marked "Not interested", left out of the feeds
function useNotInterestedPostIds() {
  return useQuery({
    queryKey: [queryKey.POST, queryKey.GET_NOT_INTERESTED_POSTS],
    queryFn: listNotInterestedPostIds,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPost,
    // every city's feed, the new post is in each of its cities. without it a feed loaded in the last minute
    // (the client's staleTime) would show without it
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [queryKey.POST] }),
  });
}

// all of a city's posts, locals' and travelers', a page at a time: the next one starts after the last post of the
// page before. the explore tabs filter them in the browser, so switching tabs asks for nothing.
// waits for a city: the explore screen knows it only once the profile is loaded
export function useInfiniteCityPosts(place: Place | null) {
  const notInterested = useNotInterestedPostIds();
  // left out as the pages are read and not taken out of the cache: the next page starts after the last post of the
  // page before, and a short page is the last, so taking one out would end the feed early or bring it back
  const hideNotInterested = useCallback(
    (data: InfiniteData<PostFeedItem[], string | undefined>) => {
      const hidden = new Set(notInterested.data);
      return {
        ...data,
        pages: data.pages.map((page) =>
          page.filter((post) => !hidden.has(post.id)),
        ),
      };
    },
    [notInterested.data],
  );
  return useInfiniteQuery({
    queryKey: [queryKey.POST, queryKey.GET_CITY_POSTS, place],
    queryFn: ({ pageParam }) => listPosts(place!, pageParam),
    select: hideNotInterested,
    // waits for the hidden posts so they never show for a moment. a failure to load them shows the feed whole
    // rather than none of it
    enabled: place !== null && !notInterested.isPending,
    initialPageParam: undefined as string | undefined,
    // a short page is the last, so there's no request for an empty one
    getNextPageParam: (lastPage) =>
      lastPage.length < POST_PAGE_SIZE ? undefined : lastPage.at(-1)?.id,
  });
}

// "Not interested" from a card's more button: once it's saved, the post leaves every city's feed and the
// recommendations at once, added to the ids the server sent instead of asking for them again
export function useMarkNotInterested() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotInterested,
    onSuccess: (_, id) =>
      queryClient.setQueryData<string[]>(
        [queryKey.POST, queryKey.GET_NOT_INTERESTED_POSTS],
        (ids = []) => (ids.includes(id) ? ids : [...ids, id]),
      ),
  });
}

// a person's posts on their profile, a page at a time as a city's. writing a post refreshes it too, it's under
// queryKey.POST
export function useInfiniteUserPosts(userId: string) {
  return useInfiniteQuery({
    queryKey: [queryKey.POST, queryKey.GET_USER_POSTS, userId],
    queryFn: ({ pageParam }) => listUserPosts(userId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length < POST_PAGE_SIZE ? undefined : lastPage.at(-1)?.id,
  });
}

// a post's own page
export function useGetPostDetail(id: string) {
  return useQuery({
    queryKey: [queryKey.POST, queryKey.GET_POST_DETAIL, id],
    queryFn: () => getPostDetail(id),
  });
}
