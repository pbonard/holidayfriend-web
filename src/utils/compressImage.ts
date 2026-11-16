// a photo made smaller before it's uploaded, in the browser and without a library, as the mobile app's picker does
// (quality 0.5 there): drawn on a canvas no larger than MAX_SIDE on its long side, and saved as a JPEG. that also
// drops what the camera wrote into it (EXIF, the place it was taken among it)

// on its long side: sharp on any phone or laptop screen, a fraction of a camera's 4000 and more
const MAX_SIDE = 1920;
const QUALITY = 0.7;

// the photo as a smaller JPEG, or the file itself when it can't be made smaller: a GIF (it would stop moving), one
// the browser can't draw (HEIC outside safari), or one already smaller than what it would become
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }
  let bitmap: ImageBitmap;
  try {
    // from-image: turned the way the camera meant, its EXIF orientation applied before it's lost
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return file;
  }
  // JPEG has no transparency: a transparent PNG's clear parts would turn black, white is how it's usually seen
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY),
  );
  if (!blob || blob.size >= file.size) {
    return file;
  }
  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
}
