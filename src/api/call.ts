import { axiosInstance } from '@/api/axios';
import type { TurnResponse } from '@/types/call';

export async function getTurn(): Promise<TurnResponse> {
  const { data } = await axiosInstance.get('/chat/turn');
  return data;
}

// the socket of the call between two people. its id is theirs joined, the smaller first, so both come to the same
// call, as mobile's do. the token goes as the subprotocol, as openMessagingSocket's
export function openCallSocket(token: string, myId: string, otherId: string) {
  const { protocol, host } = window.location;
  const callId = myId > otherId ? `${otherId}${myId}` : `${myId}${otherId}`;
  const url = `${protocol === 'https:' ? 'wss' : 'ws'}://${host}/chat/call?id=${callId}`;
  return new WebSocket(url, ['bearer', token]);
}
