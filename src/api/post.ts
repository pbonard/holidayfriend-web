import { axiosInstance } from '@/api/axios';
import type { CreatePostRequest } from '@/types/post';

export async function createPost(
  request: CreatePostRequest,
): Promise<{ id: string }> {
  const { data } = await axiosInstance.post('/api/posts', request);
  return data;
}
