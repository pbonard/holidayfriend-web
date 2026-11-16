// what my-server's chat sends, on the WebSocket and from GET /chat/messaging/recent
export interface MessagingResponse {
  // uuid v7: also when it was sent, read with timeOfId. the ids of a chat sort as their times do
  id: string;
  // a personal chat's room is the other person, whoever sent the message
  roomId: string;
  fromId: string;
  // "text" here, "image" or "video" (contents: the files' names), or "accept": an accepted invite's message, the
  // chat's first, contents [text] as a text's but shown as the invite it was. also
  // "quit" (one's own leaving, from another tab or device) and "delete" (contents[0] is the message deleted), which
  // change what's kept instead of showing
  contentType: string;
  contents: string[];
}

// a photo, a video, or a voice message (mobile's "audio", one m4a). the folder its files are in, and the content type
// of its message, whose contents are the files' names
export type MediaType = 'image' | 'video' | 'audio';

// a photo or video picked, not sent yet. url: the file's object url, what its thumbnail shows
export interface Attachment {
  id: string;
  file: File;
  url: string;
}

// one of POST /chat/messaging/presigned: a presigned POST to garage for one file
export interface PresignedUpload {
  // the file's name, what the message's contents name it by
  filename: string;
  url: string;
  // the form's fields, sent before the file
  fields: Record<string, string>;
}

// what POST /chat/messaging/send takes
export interface SendMessageRequest {
  // always "personal": a chat starts from an accepted invite, between two people
  toIdType: 'personal';
  // the other person
  toId: string;
  contentType: string;
  contents: string[];
  // holidayfriend has no push notifications
  noPush: true;
}

// a chat's summary as this browser keeps it (db/message's rooms store): what the list and the badge need, without
// its messages
export interface RoomSummary {
  // its newest message
  last: MessagingResponse;
  // the other person's newest message's id, '' when none
  lastFromOtherId: string;
  // the newest message read here, '' when none. it's unread while the other person's newest is after it
  readId: string;
}

// a chat in the list: its latest message, and whether there's something unread
export interface ChatPreview {
  roomId: string;
  last: MessagingResponse;
  unread: boolean;
}
