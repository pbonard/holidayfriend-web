// what POST /api/invite takes: a message to the person, from a post or a profile
export interface SendInviteRequest {
  toUserId: string;
  message: string;
}
