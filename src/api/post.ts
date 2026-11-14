import { axiosInstance } from '@/api/axios';
import type {
  CreatePostRequest,
  Place,
  PostDetail,
  PostFeedItem,
} from '@/types/post';

export async function createPost(
  request: CreatePostRequest,
): Promise<{ id: string }> {
  const { data } = await axiosInstance.post('/api/post', request);
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
  const { data } = await axiosInstance.get('/api/post/list', {
    params: { country: place.country, city: place.city, before },
  });
  return data;
}

// a post with its whole body. a post that's gone is the error "Post not found"
export async function getPostDetail(id: string): Promise<PostDetail> {
  const { data } = await axiosInstance.get(`/api/post/${id}`);
  return data;
}
