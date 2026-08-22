/**
 * Blur-up loading for remote photos.
 *
 * The CDN serves one full-size rendition per image — there is no thumbnail
 * variant to fetch first and no per-image blurhash stored alongside it. A
 * single neutral blurhash still buys the effect that matters: a soft, warm
 * shape holds the layout immediately, then cross-dissolves into the real photo
 * instead of the frame snapping from empty to sharp.
 *
 * Pair both on every remote `expo-image`:
 *   placeholder={IMAGE_BLUR_PLACEHOLDER}
 *   transition={IMAGE_TRANSITION}
 */
export const IMAGE_BLUR_PLACEHOLDER = {
  blurhash: "L6Ps#Ct7of00~qofofM{IUM{ofj[",
};

/** Long enough to read as a dissolve, short enough to stay out of the way. */
export const IMAGE_TRANSITION = {
  duration: 320,
  effect: "cross-dissolve",
} as const;

/**
 * Placeholder for one photo: its own blurhash when the API sent one, otherwise
 * the neutral fallback (older rows, or an image that failed to encode).
 */
export function imagePlaceholder(blurhash?: string | null) {
  return blurhash ? { blurhash } : IMAGE_BLUR_PLACEHOLDER;
}
