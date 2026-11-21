import { axiosInstance } from '@/api/axios';
import type { IdInterface } from '@/types/common';
import type {
  CreatePostRequest,
  Place,
  PostDetail,
  PostFeedItem,
  UpdatePostRequest,
  UserPostItem,
} from '@/types/post';

export async function createPost(
  request: CreatePostRequest,
): Promise<IdInterface> {
  const { data } = await axiosInstance.post('/api/post', request);
  return data;
}

// the author's own post only, the error "You can only edit your own post" otherwise
export async function updatePost(request: UpdatePostRequest): Promise<void> {
  await axiosInstance.put('/api/post', request);
}

// for good, with its cities. the author's own post only
export async function deletePost(id: string): Promise<void> {
  await axiosInstance.delete('/api/post', { params: { id } });
}

// the server's page size: a page shorter than this is the last one
export const POST_PAGE_SIZE = 5;

// one page of a city's posts, locals' and travelers' both, newest first. before is the last post id of the page
// before, left out for the first
export async function listPosts(
  place: Place,
  before?: string,
): Promise<PostFeedItem[]> {
  const { data } = await axiosInstance.get('/api/post/list', {
    params: { country: place.country, city: place.city, before },
  });
  return data;
}

// a post with its whole body. a post that's gone is the error "Post not found"
export async function getPostDetail(id: string): Promise<PostDetail> {
  const { data } = await axiosInstance.get('/api/post', { params: { id } });
  return data;
}

// hides a post from the viewer, from the more button of its card. marking it again is fine
export async function markNotInterested(id: string): Promise<void> {
  const request: IdInterface = { id };
  await axiosInstance.post('/api/post/not-interested', request);
}

// reports someone's post, from the more button of its card or its page. the server checks it against the rules in the
// background and deletes it when it breaks them, so it answers before that's decided
export async function reportPost(id: string): Promise<void> {
  const request: IdInterface = { id };
  await axiosInstance.post('/api/post/report', request);
}

// the ids of every post the viewer marked "Not interested". apart from the feed, so a city's feed is the same for
// everyone
export async function listNotInterestedPostIds(): Promise<string[]> {
  const { data } = await axiosInstance.get('/api/post/not-interested');
  return data;
}

// one page of a person's posts for their profile, newest first, the same size and paging as a city's
export async function listUserPosts(
  userId: string,
  before?: string,
): Promise<UserPostItem[]> {
  const { data } = await axiosInstance.get('/api/post/user', {
    params: { userId, before },
  });
  return data;
}
