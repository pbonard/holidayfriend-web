import { axiosInstance } from '@/api/axios';
import type { CreatePostRequest, Place, PostFeedItem } from '@/types/post';

export async function createPost(
  request: CreatePostRequest,
): Promise<{ id: string }> {
  const { data } = await axiosInstance.post('/api/posts', request);
  return data;
}

// the server's page size: a page shorter than this is the last one
export const POST_PAGE_SIZE = 5;

// one page of a city's posts, locals' and travelers' both, newest first. before is the last post id of the page
// before, left out for the first
export async function listPosts(
  place: Place,
  before?: string,
): Promise<PostFeedItem[]> {
  const { data } = await axiosInstance.get('/api/posts', {
    params: { country: place.country, city: place.city, before },
  });
  return data;
}
