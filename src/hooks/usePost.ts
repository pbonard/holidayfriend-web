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
  deletePost,
  getPostDetail,
  listNotInterestedPostIds,
  listPosts,
  listRelatedPosts,
  listUserPosts,
  markNotInterested,
  POST_PAGE_SIZE,
  reportPost,
  updatePost,
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

// every place the post shows is under queryKey.POST: its page, its cities' feeds, its author's profile
export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePost,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [queryKey.POST] }),
  });
}

// everything about posts is marked stale, but only the city feeds on screen ask again now, so a card deleted from
// the feed leaves it. the post's own page isn't asked for again: it's still on screen until the caller leaves it,
// and would show the post gone for a moment. the rest ask again once they're shown
export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKey.POST],
        refetchType: 'none',
      });
      queryClient.invalidateQueries({
        queryKey: [queryKey.POST, queryKey.GET_CITY_POSTS],
      });
    },
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

// "Report post" from a card's or a page's more button. nothing to refresh: the post stays until the server's check
// deletes it, and the feeds leave it out once they ask again
export function useReportPost() {
  return useMutation({ mutationFn: reportPost });
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

// the row under a post's page, without what the viewer marked "Not interested", as the feeds
export function useGetRelatedPosts(id: string, place: Place) {
  const notInterested = useNotInterestedPostIds();
  return useQuery({
    queryKey: [queryKey.POST, queryKey.GET_RELATED_POSTS, id, place],
    queryFn: () => listRelatedPosts(id, place),
    select: (posts) =>
      posts.filter((post) => !notInterested.data?.includes(post.id)),
    enabled: !notInterested.isPending,
  });
}
