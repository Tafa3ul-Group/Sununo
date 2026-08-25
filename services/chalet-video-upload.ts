import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Direct-to-Bunny upload of a chalet tour video.
 *
 * The file never passes through our API: the server reserves the video and
 * signs a one-hour, single-video token, and the phone PUTs the bytes straight
 * to Bunny's TUS endpoint.
 *
 * Background behaviour: the upload runs on an iOS *background* URLSession, so
 * it keeps going (and keeps retrying) after the owner leaves the app, and
 * reports back when they return. Android keeps uploading while the process is
 * alive; if the system reclaims it mid-upload, the pending record below lets
 * the app pick the job back up on next launch.
 */

export interface VideoUploadTicket {
  videoId: string;
  libraryId: string;
  uploadUrl: string;
  expires: number;
  signature: string;
  playbackUrl: string;
  thumbnailUrl: string;
}

/** What we keep on disk so an interrupted upload is not simply lost. */
interface PendingUpload {
  chaletId: string;
  fileUri: string;
  /** TUS upload URL handed back by the creation request. */
  location: string;
  videoId: string;
  startedAt: number;
}

const PENDING_KEY = "chalet-video-upload:pending";
const TUS_VERSION = "1.0.0";

const tusHeaders = (ticket: VideoUploadTicket) => ({
  AuthorizationSignature: ticket.signature,
  AuthorizationExpire: String(ticket.expires),
  VideoId: ticket.videoId,
  LibraryId: ticket.libraryId,
});

/** TUS metadata is a comma-separated list of `key base64(value)` pairs. */
const encodeMetadata = (values: Record<string, string>) =>
  Object.entries(values)
    .map(([key, value]) => `${key} ${btoa(unescape(encodeURIComponent(value)))}`)
    .join(",");

/**
 * TUS "creation": tells Bunny how many bytes are coming and returns the URL the
 * bytes go to. Small and quick, so it stays in JS.
 */
async function createTusUpload(
  ticket: VideoUploadTicket,
  fileSize: number,
  title: string,
): Promise<string> {
  const response = await fetch(ticket.uploadUrl, {
    method: "POST",
    headers: {
      ...tusHeaders(ticket),
      "Tus-Resumable": TUS_VERSION,
      "Upload-Length": String(fileSize),
      "Upload-Metadata": encodeMetadata({
        filetype: "video/mp4",
        title,
      }),
    },
  });

  if (!response.ok) {
    throw new Error(`Upload could not be started (${response.status})`);
  }

  const location = response.headers.get("location") || response.headers.get("Location");
  if (!location) throw new Error("Upload could not be started (no location)");

  // Bunny returns an absolute URL, but the spec allows a relative one.
  return location.startsWith("http")
    ? location
    : new URL(location, ticket.uploadUrl).toString();
}

async function fileSizeOf(fileUri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists) throw new Error("The recording is no longer on the device");
  return (info as any).size ?? 0;
}

export interface UploadHandle {
  /** Resolves when Bunny has the whole file (encoding then continues on their side). */
  done: Promise<void>;
  cancel: () => void;
}

/**
 * Send the file. Progress is reported 0..1.
 *
 * The whole file goes in one PATCH at offset 0 — a background URLSession can
 * only carry a single request, and a chunk loop driven from JS would stop the
 * moment the app is suspended, which is the one thing this must survive.
 */
export function uploadChaletVideo(
  ticket: VideoUploadTicket,
  location: string,
  fileUri: string,
  onProgress?: (fraction: number) => void,
): UploadHandle {
  const task = FileSystem.createUploadTask(
    location,
    fileUri,
    {
      httpMethod: "PATCH",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      // The default already, but it is the entire point of this function.
      sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
      headers: {
        ...tusHeaders(ticket),
        "Tus-Resumable": TUS_VERSION,
        "Upload-Offset": "0",
        "Content-Type": "application/offset+octet-stream",
      },
    },
    ({ totalBytesSent, totalBytesExpectedToSend }) => {
      if (!totalBytesExpectedToSend) return;
      onProgress?.(Math.min(totalBytesSent / totalBytesExpectedToSend, 1));
    },
  );

  const done = task.uploadAsync().then((result) => {
    const status = result?.status ?? 0;
    // 204 is the TUS success code; Bunny also answers 200 on a completed upload.
    if (status !== 204 && status !== 200) {
      throw new Error(`Upload failed (${status})`);
    }
  });

  return { done, cancel: () => void task.cancelAsync() };
}

/**
 * Record → reserve → upload, as one call.
 *
 * `requestTicket` is passed in so this file stays free of the API client: the
 * caller hands it the RTK Query mutation.
 */
export async function startChaletVideoUpload(options: {
  chaletId: string;
  fileUri: string;
  title: string;
  requestTicket: (chaletId: string) => Promise<VideoUploadTicket>;
  onProgress?: (fraction: number) => void;
}): Promise<UploadHandle> {
  const { chaletId, fileUri, title, requestTicket, onProgress } = options;

  const size = await fileSizeOf(fileUri);
  const ticket = await requestTicket(chaletId);
  const location = await createTusUpload(ticket, size, title);

  await setPending({
    chaletId,
    fileUri,
    location,
    videoId: ticket.videoId,
    startedAt: Date.now(),
  });

  const handle = uploadChaletVideo(ticket, location, fileUri, onProgress);
  handle.done
    .then(() => clearPending())
    // Left in place on failure: the next launch can see an upload was cut short
    // and offer to send it again.
    .catch(() => {});

  return handle;
}

// ── Pending-upload record ───────────────────────────────────────────────────

export async function getPending(): Promise<PendingUpload | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingUpload) : null;
  } catch {
    return null;
  }
}

async function setPending(pending: PendingUpload) {
  try {
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // A missing record only costs us the resume prompt, never the upload.
  }
}

export async function clearPending() {
  try {
    await AsyncStorage.removeItem(PENDING_KEY);
  } catch {
    // ignored — see setPending
  }
}
