import { axiosInstance } from '@/api/axios';
import type { ChatMessage, SendMessageRequest } from '@/types/chat';

// the messages to the person logged in after the cursor, a message id: what arrived while no socket was open.
// my-server's chat answers null for none
export async function getRecentMessages(cursor: string): Promise<ChatMessage[]> {
  const { data } = await axiosInstance.get<ChatMessage[] | null>(
    '/chat/messaging/recent',
    { params: { cursor } },
  );
  return data ?? [];
}

// the message's id. it comes back on the socket too, to every open tab of both people
export async function sendMessage(
  request: SendMessageRequest,
): Promise<{ id: string }> {
  const { data } = await axiosInstance.post('/chat/messaging/send', request);
  return data;
}

// the socket the messages arrive on, as they're sent. a browser can't set headers on a WebSocket: the token goes as
// the subprotocol "bearer, <token>", which the gateway checks like an Authorization header, and the device id in the
// url. same origin, as the api: the gateway routes /chat, and next.config.ts's rewrite does in local development
export function openMessagingSocket(token: string, deviceId: string) {
  const { protocol, host } = window.location;
  const url = `${protocol === 'https:' ? 'wss' : 'ws'}://${host}/chat/messaging/connect?deviceId=${deviceId}`;
  return new WebSocket(url, ['bearer', token]);
}
