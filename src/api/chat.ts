import axios from 'axios';
import { axiosInstance } from '@/api/axios';
import type {
  GetRoomsResponse,
  MessagingResponse,
  MediaType,
  PresignedUpload,
  SendMessageRequest,
} from '@/types/chat';

export async function getChatRooms(): Promise<GetRoomsResponse> {
  const { data } = await axiosInstance.get<GetRoomsResponse>(
    '/chat/messaging/rooms',
  );
  return data;
}

export async function getRecentMessages(
  cursor: string,
): Promise<MessagingResponse[]> {
  const { data } = await axiosInstance.get<MessagingResponse[]>(
    '/chat/messaging/recent',
    { params: { cursor } },
  );
  return data;
}

export async function getRoomHistory(params: {
  roomId: string;
  ahead?: string;
  cursor?: string;
}): Promise<MessagingResponse[]> {
  const { data } = await axiosInstance.get<MessagingResponse[] | null>(
    '/chat/messaging/history',
    { params },
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

// where to upload n files of a type, one each: a presigned POST to garage, and the name the message names it by
export async function generatePresignedURL(body: {
  contentType: MediaType;
  n: number;
}): Promise<PresignedUpload[]> {
  const { data } = await axiosInstance.post('/chat/messaging/presigned', body);
  return data;
}

// the file, straight to garage with the presigned form. the fields first and the file last, as S3 wants. plain axios
// and not axiosInstance: no token, garage checks the form's signature. axios and not fetch: fetch can't tell how
// much of an upload went, axios's XMLHttpRequest can (onProgress, bytes sent of the whole form). watching it makes
// the browser ask first (a CORS preflight, OPTIONS): garage answers it from the bucket's CORS rules
export async function uploadToStorage(
  { url, fields }: PresignedUpload,
  file: File,
  onProgress?: (sent: number, total: number) => void,
) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  form.append('Content-Type', file.type);
  form.append('file', file);
  try {
    await axios.post(url, form, {
      onUploadProgress: ({ loaded, total }) =>
        onProgress?.(loaded, total ?? file.size),
    });
  } catch {
    throw new Error(`Couldn't upload ${file.name}`);
  }
}

// a link to a file of a message, for an hour. only for who the message was to or from
export async function getSignedURL(params: {
  contentType: MediaType;
  filename: string;
}): Promise<{ url: string }> {
  const { data } = await axiosInstance.get('/chat/messaging/signed', {
    params,
  });
  return data;
}

// whether the person logged in blocked them: chat then doesn't hand them their messages. as mobile asks
export async function checkBlock(id: string): Promise<{ didBlock: boolean }> {
  const { data } = await axiosInstance.get('/chat/block/check', {
    params: { id },
  });
  return data;
}
