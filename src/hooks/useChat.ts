import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAccessToken, NotLoggedInError } from '@/api/axios';
import {
  checkBlock,
  getRecentMessages,
  openMessagingSocket,
  sendMessage,
} from '@/api/chat';
import { queryKey } from '@/constants';
import {
  acquireObjectURL,
  downloadMessagesMedia,
  getMedia,
  objectURLOf,
  releaseObjectURL,
} from '@/db/media';
import {
  getPending,
  getServerPending,
  restorePending,
  settlePending,
  subscribePending,
} from '@/db/pending';
import { useMyProfileBrief } from '@/hooks/useProfile';
import type { MessagingResponse, ChatPreview, MediaType } from '@/types/chat';
import { saveDraft } from '@/utils/chatDraft';
import {
  getCursor,
  getDeviceId,
  getRooms,
  getChatRoomMessagesMap,
  getServerChatRoomMessagesMap,
  loadEarlier,
  markRoomRead,
  openRoom,
  removeRoom,
  putMessages,
  saveSentMessage,
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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!myId) return;
    const user = myId;
    const deviceId = getDeviceId();
    // one's own messages a reload interrupted before chat answered: back in their chats as not sent
    void restorePending(user);
    let socket: WebSocket | null = null;
    let stopped = false;
    let failures = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    // a socket that closed without ever opening: the gateway may have turned its token away
    let staleToken = false;

    const receive = (messages: MessagingResponse[]) => {
      // kept, then one's own among them no longer pending (db/pending): the message shows before its pending one goes
      void (async () => {
        try {
          await putMessages(user, messages, { moveCursor: true });
        } finally {
          await settlePending(user, messages);
        }
      })();
      // their photos and videos, in the background, as mobile downloads them as they arrive
      downloadMessagesMedia(messages);
      // blocked or unblocked, here or on another device: the chat's menu asks again
      messages
        .filter(
          ({ contentType }) =>
            contentType === 'block' || contentType === 'unblock',
        )
        .forEach(({ roomId }) =>
          queryClient.invalidateQueries({
            queryKey: [queryKey.CHAT, queryKey.CHECK_BLOCK, roomId],
          }),
        );
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
          receive([JSON.parse(event.data) as MessagingResponse]);
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
  }, [myId, queryClient]);
}

// the chats kept in this browser for the person logged in, their summaries. null until they're read
function useRooms(myId: string | undefined): Rooms | null {
  const getSnapshot = useCallback(() => (myId ? getRooms(myId) : null), [myId]);
  // null while prerendering: IndexedDB is the browser's
  return useSyncExternalStore(subscribeChats, getSnapshot, () => null);
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
  const messages = useSyncExternalStore(
    subscribeChats,
    getChatRoomMessagesMap,
    getServerChatRoomMessagesMap,
  )[roomId];
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
    messages: messages?.messages,
    hasEarlier: messages?.hasEarlier ?? false,
    loadEarlier: showEarlier,
    exists: Boolean(summary),
  };
}

// a photo or video of a message as an address an <img> or <video> shows: from this browser when it's kept,
// downloaded when it isn't (a message from before, or cleared site data). null until it's there. the address is let
// go when it's no longer shown
export function useMediaURL(contentType: MediaType, filename: string) {
  const media = useQuery({
    queryKey: [queryKey.CHAT, queryKey.GET_MEDIA, contentType, filename],
    queryFn: () => getMedia(contentType, filename),
    // a file never changes under its name
    staleTime: Infinity,
    // its bytes held in memory a minute after it's no longer shown: it's in Cache Storage anyway
    gcTime: 60 * 1000,
  });
  const blob = media.data;
  // showing it holds its address, which useSyncExternalStore reads once it's there
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!blob) return () => {};
      acquireObjectURL(blob);
      onChange();
      return () => releaseObjectURL(blob);
    },
    [blob],
  );
  const url = useSyncExternalStore(
    subscribe,
    () => (blob ? objectURLOf(blob) : null),
    () => null,
  );
  return { url, isError: media.isError };
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
      if (!myId) return;
      void removeRoom(myId, roomId);
      // nothing to finish writing there
      saveDraft(myId, roomId, '');
    },
  });
}

// deletes messages for both people, as mobile's Delete: a "delete" message for each, which chat relays to the other
// person's devices and one's own others. chat's answer is success: each goes from here as soon as its delete is
// answered (saveSentMessage), so when some fail, only those are left
export function useDeleteMessages(roomId: string) {
  const myId = useMyId();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map(async (messageId) => {
          const contents = [messageId];
          const { id } = await sendMessage({
            toIdType: 'personal',
            toId: roomId,
            contentType: 'delete',
            contents,
            noPush: true,
          });
          if (myId) {
            await saveSentMessage(myId, {
              id,
              roomId,
              fromId: myId,
              contentType: 'delete',
              contents,
            });
          }
        }),
      );
      const failed = results.filter(
        ({ status }) => status === 'rejected',
      ).length;
      if (failed === ids.length)
        throw new Error("Couldn't delete the messages.");
      if (failed > 0) throw new Error(`Couldn't delete ${failed} of them.`);
    },
  });
}

// a chat's own messages on their way, or not sent, shown at its end (db/pending)
export function usePendingMessages(roomId: string) {
  const getSnapshot = useCallback(() => getPending(roomId), [roomId]);
  return useSyncExternalStore(subscribePending, getSnapshot, getServerPending);
}

// whether the person logged in blocked the other person of the chat (chat's /chat/block/check)
export function useCheckBlock(roomId: string) {
  return useQuery({
    queryKey: [queryKey.CHAT, queryKey.CHECK_BLOCK, roomId],
    queryFn: () => checkBlock(roomId),
  });
}

// blocks or unblocks the other person of the chat, as mobile does: a "block" or "unblock" message, which chat hands
// to the person logged in alone. blocked, chat doesn't hand them their messages, and they aren't told. kept as soon
// as it's answered (saveSentMessage): its pill shows in the chat
export function useBlockChat(roomId: string) {
  const myId = useMyId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (block: boolean) => {
      const contentType = block ? 'block' : 'unblock';
      const { id } = await sendMessage({
        toIdType: 'personal',
        toId: roomId,
        contentType,
        contents: [],
        noPush: true,
      });
      if (myId) {
        await saveSentMessage(myId, {
          id,
          roomId,
          fromId: myId,
          contentType,
          contents: [],
        });
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [queryKey.CHAT, queryKey.CHECK_BLOCK, roomId],
      }),
  });
}
