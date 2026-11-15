// what my-server's chat sends, on the WebSocket and from GET /chat/messaging/recent (MessagingResponse there)
export interface ChatMessage {
  // uuid v7: also when it was sent, read with timeOfId. the ids of a chat sort as their times do
  id: string;
  // a personal chat's room is the other person, whoever sent the message
  roomId: string;
  fromId: string;
  // "text" here, or "accept": an accepted invite's message, the chat's first, contents [text] as a text's but shown
  // as the invite it was. also
  // "quit" (one's own leaving, from another tab or device) and "delete" (contents[0] is the message deleted), which
  // change what's kept instead of showing
  contentType: string;
  contents: string[];
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

// a message as this browser keeps it in IndexedDB: as chat sent it. read its text with textOf
export interface StoredMessage {
  // chat's id for it: its time is read from it, and the messages of a chat sort by it
  id: string;
  fromId: string;
  contentType: string;
  contents: string[];
}

// a chat's summary as this browser keeps it (db/message's rooms store): what the list and the badge need, without
// its messages
export interface RoomSummary {
  // its newest message
  last: StoredMessage;
  // the other person's newest message's id, '' when none
  lastFromOtherId: string;
  // the newest message read here, '' when none. it's unread while the other person's newest is after it
  readId: string;
}

// a chat in the list: its latest message, and whether there's something unread
export interface ChatPreview {
  roomId: string;
  last: StoredMessage;
  unread: boolean;
}
