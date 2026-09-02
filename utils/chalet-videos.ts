/**
 * The chalet's tour videos, as a list — only the ones ready to play.
 *
 * A video sits on Bunny for a minute or two after it is uploaded, encoding.
 * Nothing here may reach a customer during that window: a playlist URL that is
 * not live yet only ever produces a black slide. So a video is returned only
 * with an explicit 'ready' status AND a URL to play — anything half-filled is
 * treated as not ready rather than given the benefit of the doubt.
 *
 * The `videos` array is the current shape; the single `video*` fields on the
 * chalet are the older one, still sent for app builds that predate the reel.
 */
export type ChaletVideo = {
  url: string;
  thumbnailUrl?: string | null;
};

export function getChaletVideos(chalet: any): ChaletVideo[] {
  if (!chalet) return [];

  if (Array.isArray(chalet.videos) && chalet.videos.length > 0) {
    return chalet.videos
      .filter((v: any) => v?.url && v?.status === "ready")
      .map((v: any) => ({
        url: v.url as string,
        thumbnailUrl: (v.thumbnailUrl ?? v.thumbnail ?? null) as string | null,
      }));
  }

  if (chalet.videoStatus === "ready" && chalet.videoUrl) {
    return [
      {
        url: chalet.videoUrl as string,
        thumbnailUrl: (chalet.videoThumbnailUrl ?? null) as string | null,
      },
    ];
  }

  return [];
}
