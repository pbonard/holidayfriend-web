import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { queryKey } from '@/constants';
import {
  createPost,
  getPostDetail,
  listPosts,
  listUserPosts,
  POST_PAGE_SIZE,
} from '@/api/post';
import type { Place } from '@/types/post';

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
  return useInfiniteQuery({
    queryKey: [queryKey.POST, queryKey.GET_CITY_POSTS, place],
    queryFn: ({ pageParam }) => listPosts(place!, pageParam),
    enabled: place !== null,
    initialPageParam: undefined as string | undefined,
    // a short page is the last, so there's no request for an empty one
    getNextPageParam: (lastPage) =>
      lastPage.length < POST_PAGE_SIZE ? undefined : lastPage.at(-1)?.id,
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
