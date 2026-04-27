const IMAGE_BASE_URL = process.env.EXPO_PUBLIC_IMAGE_BASE_URL;
const IMAGE_ACCOUNT_HASH = process.env.EXPO_PUBLIC_IMAGE_ACCOUNT_HASH;

// Placeholder image path
const PLACEHOLDER_IMAGE = require('../assets/placeholder.png');

// Function to get image source URL (internal helper)
export function processImageId(imageId: string | null | undefined): any {
  // Validate inputs
  if (!imageId || typeof imageId !== 'string') {
    return null;
  }

  // Check if imageId is already a complete URL or a local file path
  if (imageId.startsWith('http://') || imageId.startsWith('https://') || imageId.startsWith('/') || imageId.startsWith('file://')) {
    return { uri: imageId };
  }

  // Validate configuration
  if (!IMAGE_BASE_URL || !IMAGE_ACCOUNT_HASH) {
    console.warn('Image configuration missing. baseUrl:', IMAGE_BASE_URL, 'accountHash:', IMAGE_ACCOUNT_HASH);
    return null;
  }

  // Clean up imageId (remove leading slash if present)
  const cleanImageId = imageId.startsWith('/') ? imageId.slice(1) : imageId;

  if (cleanImageId === 'processing') {
    return null;
  }

  // Construct the full URL
  const fullUrl = `${IMAGE_BASE_URL}/images/${IMAGE_ACCOUNT_HASH}/${cleanImageId}?type=png`;

  return { uri: fullUrl };
}

/**
 * Hook to get image source URL
 * Simplified version without language logic
 * @param imageId - The ID or path of the image
 * @returns An object with the URI or a local requirement
 */
export function useImageSrc(imageId?: string | null): any {
  if (!imageId) {
    return PLACEHOLDER_IMAGE;
  }

  const result = processImageId(imageId);
  return result || PLACEHOLDER_IMAGE;
}

/**
 * Function to get image source URL (for non-hook usage)
 * @param imageId - The ID or path of the image
 * @returns An object with the URI or a local requirement
 */
export function getImageSrc(imageId: string | null | undefined): any {
  const result = processImageId(imageId);
  return result || PLACEHOLDER_IMAGE;
}

// Export default for easier importing (hook version)
export default useImageSrc;