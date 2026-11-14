import { axiosInstance } from '@/api/axios';
import type { SendInviteRequest } from '@/types/invite';

// the server's own words when it doesn't send one, e.g. "You're already chatting with this person"
export async function sendInvite(request: SendInviteRequest): Promise<void> {
  await axiosInstance.post('/api/invite', request);
}
