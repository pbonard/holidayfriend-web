import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getAccessToken, NotLoggedInError } from '@/api/axios';
import {
  getRecentMessages,
  openMessagingSocket,
  sendMessage,
} from '@/api/chat';
import { useMyProfileBrief } from '@/hooks/useProfile';
import type { ChatMessage, ChatPreview } from '@/types/chat';
import {
  getCursor,
  getDeviceId,
  getRooms,
  getServerRooms,
  getServerWindows,
  getWindows,
  loadEarlier,
  markRoomRead,
  openRoom,
  removeRoom,
  saveMessages,
  subscribeChats,
  type Rooms,
} from '@/db/message';

// waits before opening the socket again after it closed: doubling from the first, up to the last
const RETRY_FIRST_MS = 1000;
const RETRY_MAX_MS = 30 * 1000;

// the person logged in, whose chats these are. their profile's id is their user id. undefined until it's loaded
export function useMyId() {
  return useMyProfileBrief().data?.id;
}

// receives the messages while a page of the app is open: first what arrived while none was (from the cursor), then
// each as it's sent, on the socket. it's opened again when it closes, with a wait growing each time it fails, and
// at once when the tab comes back to view or the network does. as the mobile app's root layout, once for the app
export function useChatConnection() {
  const myId = useMyId();

  useEffect(() => {
    if (!myId) return;
    const user = myId;
    const deviceId = getDeviceId();
    let socket: WebSocket | null = null;
    let stopped = false;
    let failures = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    // a socket that closed without ever opening: the gateway may have turned its token away
    let staleToken = false;

    const receive = (messages: ChatMessage[]) => {
      void saveMessages(user, messages, { fromServer: true });
    };

    // what arrived while no socket was open. after the socket opens, so nothing sent in between is missed: one that
    // comes both ways is kept once
    const catchUp = async () => {
      try {
        receive(await getRecentMessages(await getCursor(user)));
      } catch {
        // the next opening asks again from the same cursor
      }
    };

    const connect = async () => {
      clearTimeout(retryTimer);
      if (stopped || socket) return;
      let token: string;
      try {
        token = await getAccessToken({ stale: staleToken });
      } catch (error) {
        // logged out: the page sends them to log in, nothing to receive
        if (!(error instanceof NotLoggedInError)) retry();
        return;
      }
      if (stopped || socket) return;

      const opening = openMessagingSocket(token, deviceId);
      socket = opening;
      let opened = false;
      opening.onopen = () => {
        opened = true;
        failures = 0;
        staleToken = false;
        void catchUp();
      };
      opening.onmessage = (event: MessageEvent<string>) => {
        try {
          receive([JSON.parse(event.data) as ChatMessage]);
        } catch {
          // chat writes its errors as plain text before closing
        }
      };
      opening.onclose = () => {
        if (socket === opening) socket = null;
        if (!opened) staleToken = true;
        retry();
      };
    };

    const retry = () => {
      if (stopped) return;
      clearTimeout(retryTimer);
      const wait = Math.min(RETRY_FIRST_MS * 2 ** failures, RETRY_MAX_MS);
      failures++;
      retryTimer = setTimeout(connect, wait);
    };

    // as the tab comes back to view, or the network does. a phone's browser closes sockets of tabs in the background:
    // none, it's opened again without waiting, and catches up as it opens. one that looks open may be dead all the
    // same (a phone notices only when the network times it out, and there's no push to fall back on), so what
    // arrived meanwhile is asked for anyway: it shows now, not once the dead one is noticed. one opening catches up
    // as it opens
    const onBack = () => {
      if (document.visibilityState !== 'visible') return;
      if (!socket) {
        failures = 0;
        void connect();
      } else if (socket.readyState === WebSocket.OPEN) {
        void catchUp();
      }
    };

    void connect();
    document.addEventListener('visibilitychange', onBack);
    window.addEventListener('online', onBack);
    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', onBack);
      window.removeEventListener('online', onBack);
      socket?.close();
      socket = null;
    };
  }, [myId]);
}

// the chats kept in this browser for the person logged in, their summaries. null until they're read
function useRooms(myId: string | undefined): Rooms | null {
  const getSnapshot = useCallback(
    () => (myId ? getRooms(myId) : getServerRooms()),
    [myId],
  );
  return useSyncExternalStore(subscribeChats, getSnapshot, getServerRooms);
}

// the list of chats, the one with the newest message first. null until they're read
export function useChatPreviews(): ChatPreview[] | null {
  const myId = useMyId();
  const rooms = useRooms(myId);
  return useMemo(
    () =>
      rooms &&
      Object.entries(rooms)
        .map(([roomId, { last, lastFromOtherId, readId }]) => ({
          roomId,
          last,
          unread: lastFromOtherId > readId,
        }))
        .sort((a, b) => (a.last.id < b.last.id ? 1 : -1)),
    [rooms],
  );
}

// whether any chat has something unread, for the sidebar's red dot
export function useHasUnreadChats() {
  return (useChatPreviews() ?? []).some(({ unread }) => unread);
}

// one chat's latest messages, oldest first, read from IndexedDB a page at a time: undefined until the first page is
// read, loadEarlier adds the one before. exists: there's a chat with them at all. marked read as messages arrive
// while the chat is open and the tab in view
export function useRoomMessages(roomId: string) {
  const myId = useMyId();
  const summary = useRooms(myId)?.[roomId];
  const window = useSyncExternalStore(subscribeChats, getWindows, getServerWindows)[
    roomId
  ];
  const lastId = summary?.last.id;

  useEffect(() => {
    if (myId) void openRoom(myId, roomId);
  }, [myId, roomId]);

  useEffect(() => {
    if (!myId || !lastId) return;
    const markRead = () => {
      if (document.visibilityState === 'visible') {
        void markRoomRead(myId, roomId);
      }
    };
    markRead();
    document.addEventListener('visibilitychange', markRead);
    return () => document.removeEventListener('visibilitychange', markRead);
  }, [myId, roomId, lastId]);

  const showEarlier = useCallback(
    () => (myId ? loadEarlier(myId, roomId) : Promise.resolve()),
    [myId, roomId],
  );

  return {
    myId,
    messages: window?.messages,
    hasEarlier: window?.hasEarlier ?? false,
    loadEarlier: showEarlier,
    exists: Boolean(summary),
  };
}

// a text message to the other person of the chat. kept here at once from its answer: the socket brings it back
// too, and it's kept once
export function useSendMessage(roomId: string) {
  const myId = useMyId();
  return useMutation({
    mutationFn: (text: string) =>
      sendMessage({
        toIdType: 'personal',
        toId: roomId,
        contentType: 'text',
        contents: [text],
        noPush: true,
      }),
    onSuccess: ({ id }, text) => {
      if (!myId) return;
      void saveMessages(
        myId,
        [{ id, roomId, fromId: myId, contentType: 'text', contents: [text] }],
        { fromServer: false },
      );
    },
  });
}

// leaves the chat: chat drops it from the person's messages (the other person keeps theirs), and this browser does.
// inviting them again is how to come back
export function useLeaveChat(roomId: string) {
  const myId = useMyId();
  return useMutation({
    mutationFn: () =>
      sendMessage({
        toIdType: 'personal',
        toId: roomId,
        contentType: 'quit',
        contents: [],
        noPush: true,
      }),
    onSuccess: () => {
      if (myId) void removeRoom(myId, roomId);
    },
  });
}
