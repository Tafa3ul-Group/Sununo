import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Mime types the backend accepts (mirrors IMAGE_ALLOWED_MIME_TYPES in
 * sununo-api/src/utils/constants.ts). Anything else must be re-encoded
 * before upload or the API rejects it.
 */
const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png'];

/**
 * Extension → proper mime for the formats the backend accepts.
 * NOTE: ".jpg" must map to "image/jpeg" — the naive `image/${ext}` pattern
 * produced the invalid mime "image/jpg", which the API rejects (this broke
 * most iPhone camera-roll picks).
 */
const EXTENSION_MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

/** A file part ready to append to FormData (RN native shape). */
export type UploadableImage = { uri: string; name: string; type: string };

/** Subset of ImagePicker.ImagePickerAsset the helper needs. */
type PickedImage = { uri: string; mimeType?: string | null; fileName?: string | null };

/**
 * Thrown when an image can't be prepared (e.g. JPEG conversion failed).
 * Callers surface it with their existing toast/alert patterns.
 */
export class ImagePrepareError extends Error {
  constructor(message?: string) {
    super(message || 'Failed to prepare image for upload');
    this.name = 'ImagePrepareError';
  }
}

/** Filename ending in an extension that matches a supported mime. */
const hasSupportedExtension = (name: string) => /\.(jpe?g|png)$/i.test(name);

/**
 * Prepare a picked image (or bare uri) for upload:
 * - Prefers the picker-reported mimeType, falling back to the extension map.
 * - Unsupported/unknown formats (HEIC/HEIF/WebP/no extension) are re-encoded
 *   to JPEG via expo-image-manipulator so the API always receives jpeg/png.
 *
 * @throws {ImagePrepareError} when the JPEG conversion fails.
 */
export async function prepareImageUpload(input: string | PickedImage): Promise<UploadableImage> {
  const asset: PickedImage = typeof input === 'string' ? { uri: input } : input;
  const fileName = asset.fileName || asset.uri.split('?')[0].split('/').pop() || 'image.jpg';
  const ext = (/\.(\w+)$/.exec(fileName)?.[1] || '').toLowerCase();

  // Normalize the common invalid variant some sources report.
  const reported = asset.mimeType === 'image/jpg' ? 'image/jpeg' : asset.mimeType?.toLowerCase();

  let type: string | null = null;
  if (reported && SUPPORTED_MIME_TYPES.includes(reported)) {
    type = reported;
  } else if (!reported) {
    // No mime reported by the picker — trust the extension when it's a supported one.
    type = EXTENSION_MIME_MAP[ext] || null;
  }

  if (type) {
    // Keep the original file untouched; only make sure the name carries a real extension.
    const name = hasSupportedExtension(fileName)
      ? fileName
      : `${fileName}.${type === 'image/png' ? 'png' : 'jpg'}`;
    return { uri: asset.uri, name, type };
  }

  // Unsupported or unknown format (HEIC/HEIF/WebP/…) → re-encode to JPEG.
  try {
    const converted = await manipulateAsync(asset.uri, [], {
      compress: 0.85,
      format: SaveFormat.JPEG,
    });
    const baseName = fileName.replace(/\.\w+$/, '') || 'image';
    return { uri: converted.uri, name: `${baseName}.jpg`, type: 'image/jpeg' };
  } catch (err) {
    console.error('prepareImageUpload: JPEG conversion failed', err);
    throw new ImagePrepareError();
  }
}
