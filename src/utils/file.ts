import { FILE_MAX_BYTES, VIDEO_MAX_SECONDS } from '@/constants';
import { videoSeconds } from '@/utils/time';

// what's wrong with the files picked, or null: too big, or a video too long
export async function checkFiles(images: File[], videos: File[]) {
  const tooBig = [...images, ...videos].find(
    (file) => file.size > FILE_MAX_BYTES,
  );
  if (tooBig) {
    return `${tooBig.name} is larger than 1 GB.`;
  }
  const lengths = await Promise.all(videos.map(videoSeconds));
  if (lengths.some((seconds) => seconds > VIDEO_MAX_SECONDS)) {
    return `Videos can be up to ${VIDEO_MAX_SECONDS} seconds long.`;
  }
  return null;
}
