import type { AuthorBasedIn } from '@/types/post';

// what POST /api/invite takes: a message to the person, from a post or a profile
export interface SendInviteRequest {
  toUserId: string;
  message: string;
}

// one of GET /api/invite/list: a pending invite sent to the person logged in
export interface InviteListItem {
  // uuid v7: also when it was last sent, read with timeOfId
  id: string;
  fromUserId: string;
  // '' when the sender's profile is gone
  fromName: string;
  // as much as the sender shows of where they're based in, null when they show neither
  fromBasedIn: AuthorBasedIn | null;
  message: string;
}
