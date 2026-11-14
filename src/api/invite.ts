import { axiosInstance } from '@/api/axios';
import type { InviteListItem, SendInviteRequest } from '@/types/invite';

// the server's own words when it doesn't send one, e.g. "You're already chatting with this person"
export async function sendInvite(request: SendInviteRequest): Promise<void> {
  await axiosInstance.post('/api/invite', request);
}

// the server's page size: a page shorter than this is the last one
export const INVITE_PAGE_SIZE = 20;

// one page of the pending invites sent to the person logged in, newest first. before is the last invite id of the
// page before, left out for the first
export async function listInvites(before?: string): Promise<InviteListItem[]> {
  const { data } = await axiosInstance.get('/api/invite/list', {
    params: { before },
  });
  return data;
}

// the invite's message becomes the first message of a chat with its sender. one already answered, or sent again
// since with a new id, is the error "Invite not found"
export async function acceptInvite(id: string): Promise<void> {
  await axiosInstance.post(`/api/invite/${id}/accept`);
}

// it stays declined, so its sender can't send another for a while
export async function declineInvite(id: string): Promise<void> {
  await axiosInstance.post(`/api/invite/${id}/decline`);
}
