const IMAGE_BASE_URL = process.env.EXPO_PUBLIC_IMAGE_BASE_URL || 'http://192.168.0.167:3010';
const IMAGE_ACCOUNT_HASH = process.env.EXPO_PUBLIC_IMAGE_ACCOUNT_HASH || 'token';


// Placeholder image path
const PLACEHOLDER_IMAGE = require('../assets/placeholder.png');
// Person/avatar placeholder (used when a user has no profile image).
// PNG (extracted from profile.svg) so it renders in both RN <Image> and expo-image.
const PERSON_PLACEHOLDER = require('../assets/profile.png');

// Function to get image source URL (internal helper)
export function processImageId(imageId: string | null | undefined): any {
  // Validate inputs
  if (!imageId || typeof imageId !== 'string') {
    return null;
  }

  // If it's a local upload from the API server, prepend API URL.
  // Handles both "/uploads/..." and "uploads/..." (no leading slash).
  if (imageId.startsWith('/uploads/') || imageId.startsWith('uploads/')) {
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    const path = imageId.startsWith('/') ? imageId : `/${imageId}`;
    return { uri: `${apiBaseUrl}${path}` };
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

/**
 * Like getImageSrc but falls back to the person/avatar illustration
 * (assets/profile.svg) instead of the chalet house placeholder.
 * Use for user/host/reviewer avatars.
 * @param imageId - The ID or path of the avatar image
 */
export function getAvatarSrc(imageId: string | null | undefined): any {
  const result = processImageId(imageId);
  return result || PERSON_PLACEHOLDER;
}

// Export default for easier importing (hook version)
export default useImageSrc;