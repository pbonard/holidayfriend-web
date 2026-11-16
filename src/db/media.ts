import { getSignedURL } from '@/api/chat';
import type { MessagingResponse, MediaType } from '@/types/chat';

// the photos and videos of chats, kept in this browser as the mobile app keeps them on the phone (downloadFiles in
// its db/message): downloaded as their message arrives, before anyone looks, then shown from here, a video played
// with nothing to buffer. in Cache Storage, under a made up address of this site per file: /chat-media/<type>/<name>.
// the file names are my-server's uuids, one per file, so a file is never replaced under its name.
// Cache Storage is only there in a secure context (https, or localhost): elsewhere (next dev opened by a phone through
// the mac's address) a file is downloaded each time it shows, as before

const CACHE = 'chat-media-v1';

// a file being fetched, by its key: asked for again meanwhile (shown while its background download runs), it's the
// same fetch
const inflight = new Map<string, Promise<Blob>>();

function keyOf(contentType: MediaType, filename: string) {
  return `/chat-media/${contentType}/${filename}`;
}

async function openCache() {
  try {
    return typeof caches === 'undefined' ? null : await caches.open(CACHE);
  } catch {
    // blocked site data
    return null;
  }
}

// from garage, through a link my-server signs for who the message was to or from. reading the body across sites needs
// garage's CORS rules to allow this one (GET)
async function download(contentType: MediaType, filename: string) {
  const { url } = await getSignedURL({ contentType, filename });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Couldn't download ${filename}`);
  }
  return response.blob();
}

// the file, from this browser when it's kept, downloaded and kept when it isn't
export function getMedia(
  contentType: MediaType,
  filename: string,
): Promise<Blob> {
  const key = keyOf(contentType, filename);
  const going = inflight.get(key);
  if (going) return going;

  const fetching = (async () => {
    const cache = await openCache();
    const kept = await cache?.match(key);
    if (kept) return kept.blob();
    const blob = await download(contentType, filename);
    await cache
      ?.put(key, new Response(blob, { headers: { 'Content-Type': blob.type } }))
      // full: it's shown all the same, and downloaded again next time
      .catch(() => undefined);
    return blob;
  })().finally(() => inflight.delete(key));
  inflight.set(key, fetching);
  return fetching;
}

// the files of messages just received, downloaded in the background, as mobile does before it saves them. the
// messages show at once, their files as they're ready. one that fails is tried again when it shows
export function downloadMessagesMedia(messages: MessagingResponse[]) {
  messages.forEach(({ contentType, contents }) => {
    if (
      contentType !== 'image' &&
      contentType !== 'video' &&
      contentType !== 'audio'
    )
      return;
    contents.forEach((filename) => {
      getMedia(contentType, filename).catch(() => undefined);
    });
  });
}

// one's own files just uploaded, kept as they were sent, so they're never downloaded back
export async function keepMedia(
  contentType: MediaType,
  filenames: string[],
  files: File[],
) {
  const cache = await openCache();
  if (!cache) return;
  await Promise.all(
    filenames.map((filename, index) =>
      cache
        .put(
          keyOf(contentType, filename),
          new Response(files[index], {
            headers: { 'Content-Type': files[index].type },
          }),
        )
        .catch(() => undefined),
    ),
  );
}

// logged out or the account deleted: the chats' photos and videos kept in this browser go
export async function clearMedia() {
  try {
    if (typeof caches !== 'undefined') await caches.delete(CACHE);
  } catch {
    // blocked site data: nothing was kept
  }
}

// the addresses <img> and <video> show the files from (object urls), one per file, shared by everyone showing it.
// an address holds its file in memory until it's let go: it is, a moment after the last one showing it stops (the
// moment: one shown again right away, a page coming back into view, keeps it)
const RELEASE_AFTER_MS = 1000;
const objectURLs = new Map<
  Blob,
  { url: string; users: number; timer?: ReturnType<typeof setTimeout> }
>();

export function acquireObjectURL(blob: Blob) {
  let entry = objectURLs.get(blob);
  if (!entry) {
    entry = { url: URL.createObjectURL(blob), users: 0 };
    objectURLs.set(blob, entry);
  }
  clearTimeout(entry.timer);
  entry.users++;
}

export function releaseObjectURL(blob: Blob) {
  const entry = objectURLs.get(blob);
  if (!entry) return;
  entry.users--;
  if (entry.users > 0) return;
  entry.timer = setTimeout(() => {
    URL.revokeObjectURL(entry.url);
    objectURLs.delete(blob);
  }, RELEASE_AFTER_MS);
}

export function objectURLOf(blob: Blob) {
  return objectURLs.get(blob)?.url ?? null;
}
