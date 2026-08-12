import { renderHook } from "@testing-library/react-native";

import {
  getAvatarSrc,
  getImageSrc,
  processImageId,
  useImageSrc,
} from "@/hooks/useImageSrc";

// The module reads these at import time with hard-coded fallbacks. Under jest no
// .env is loaded (verified: process.env.EXPO_PUBLIC_* is empty), so the fallbacks
// are what every assertion below is built on.
const IMAGE_BASE_URL = "http://192.168.0.167:3010";
const IMAGE_ACCOUNT_HASH = "token";
const API_URL = "http://localhost:3000";

/** Strip the scheme so a "//" search can't trip over "http://". */
const afterScheme = (uri: string) => uri.replace(/^[a-z]+:\/\//i, "");

describe("processImageId — rejected input", () => {
  it("returns null for null, undefined and empty string", () => {
    expect(processImageId(null)).toBeNull();
    expect(processImageId(undefined)).toBeNull();
    expect(processImageId("")).toBeNull();
  });

  it("returns null for non-string values coming from a malformed API payload", () => {
    // The signature says string, but the API is the real source and it lies.
    expect(processImageId(123 as any)).toBeNull();
    expect(processImageId(0 as any)).toBeNull();
    expect(processImageId(-1 as any)).toBeNull();
    expect(processImageId(true as any)).toBeNull();
    expect(processImageId({} as any)).toBeNull();
    expect(processImageId([] as any)).toBeNull();
    expect(processImageId({ url: "/uploads/a.png" } as any)).toBeNull();
    expect(processImageId(NaN as any)).toBeNull();
  });

  it("returns null for the 'processing' sentinel the API sends while an upload is converting", () => {
    expect(processImageId("processing")).toBeNull();
  });
});

describe("processImageId — API uploads", () => {
  it("joins '/uploads/...' to the API base with exactly one slash", () => {
    const src = processImageId("/uploads/photo.png");
    expect(src).toEqual({ uri: `${API_URL}/uploads/photo.png` });
    expect(afterScheme(src.uri)).not.toContain("//");
  });

  it("joins 'uploads/...' (no leading slash) to the same URL", () => {
    const src = processImageId("uploads/photo.png");
    expect(src).toEqual({ uri: `${API_URL}/uploads/photo.png` });
    expect(afterScheme(src.uri)).not.toContain("//");
  });

  it("keeps nested upload paths and query-ish suffixes intact", () => {
    expect(processImageId("/uploads/2026/08/chalet-1.jpeg")).toEqual({
      uri: `${API_URL}/uploads/2026/08/chalet-1.jpeg`,
    });
  });

  it("does not treat a path that merely contains 'uploads/' as an upload", () => {
    // Only a prefix match counts; anything else falls through to the CDN branch.
    expect(processImageId("media/uploads/a.png")).toEqual({
      uri: `${IMAGE_BASE_URL}/images/${IMAGE_ACCOUNT_HASH}/media/uploads/a.png?type=png`,
    });
  });
});

describe("processImageId — pass-through URLs", () => {
  it("passes absolute http:// and https:// URLs through untouched", () => {
    expect(processImageId("http://example.com/a.png")).toEqual({
      uri: "http://example.com/a.png",
    });
    expect(processImageId("https://blob.dudes.studio/images/token/x?type=png")).toEqual({
      uri: "https://blob.dudes.studio/images/token/x?type=png",
    });
  });

  it("passes file:// URIs (freshly picked local images) through untouched", () => {
    const local = "file:///var/mobile/Containers/Data/Application/tmp/IMG_0001.jpg";
    expect(processImageId(local)).toEqual({ uri: local });
  });

  it("passes any other leading-slash path through as-is — it never reaches the CDN branch", () => {
    // "/other/path" matches the generic startsWith('/') check, so it is returned
    // verbatim (a schemeless uri), NOT prefixed with the API or CDN base.
    expect(processImageId("/other/path")).toEqual({ uri: "/other/path" });
    expect(processImageId("/a.png")).toEqual({ uri: "/a.png" });
    expect(processImageId("/")).toEqual({ uri: "/" });
  });

  it("does not null out '/processing' — the leading-slash branch pre-empts the sentinel check", () => {
    // The `cleanImageId` slice() at the bottom of the function can therefore never
    // see a leading slash; documented here so a future refactor notices.
    expect(processImageId("/processing")).toEqual({ uri: "/processing" });
  });
});

describe("processImageId — CDN ids", () => {
  it("builds the /images/<hash>/<id>?type=png URL for a bare id", () => {
    expect(processImageId("abc123")).toEqual({
      uri: `${IMAGE_BASE_URL}/images/${IMAGE_ACCOUNT_HASH}/abc123?type=png`,
    });
  });

  it("handles a uuid-shaped id and a very long id", () => {
    const uuid = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";
    expect(processImageId(uuid).uri).toBe(
      `${IMAGE_BASE_URL}/images/${IMAGE_ACCOUNT_HASH}/${uuid}?type=png`,
    );

    const long = "z".repeat(2048);
    expect(processImageId(long).uri).toBe(
      `${IMAGE_BASE_URL}/images/${IMAGE_ACCOUNT_HASH}/${long}?type=png`,
    );
  });

  it("interpolates non-ASCII ids verbatim (the network layer percent-encodes them)", () => {
    const arabic = "صورة-الشاليه";
    expect(processImageId(arabic).uri).toBe(
      `${IMAGE_BASE_URL}/images/${IMAGE_ACCOUNT_HASH}/${arabic}?type=png`,
    );
  });

  it("percent-encodes an id containing a space", () => {
    // A literal space would make the URI invalid, so <Image> would fail to load it.
    expect(processImageId("my photo").uri).toBe(
      `${IMAGE_BASE_URL}/images/${IMAGE_ACCOUNT_HASH}/my%20photo?type=png`,
    );
  });

  it("percent-encodes an id containing '?' so it cannot break the query string", () => {
    // A raw '?' would end the path early ("/images/token/a?b?type=png"), folding
    // the type=png parameter into the previous value so the CDN never sees it.
    expect(processImageId("a?b").uri).toBe(
      `${IMAGE_BASE_URL}/images/${IMAGE_ACCOUNT_HASH}/a%3Fb?type=png`,
    );
  });
});

describe("useImageSrc / getImageSrc placeholders", () => {
  it("falls back to the chalet placeholder for empty input", () => {
    const placeholder = getImageSrc(null);
    expect(placeholder).toBeTruthy();
    expect(JSON.stringify(placeholder)).toContain("placeholder.png");

    expect(getImageSrc(undefined)).toBe(placeholder);
    expect(getImageSrc("")).toBe(placeholder);
    expect(getImageSrc("processing")).toBe(placeholder);
    expect(getImageSrc(42 as any)).toBe(placeholder);
  });

  it("useImageSrc returns the same placeholder for empty input", () => {
    const placeholder = getImageSrc(null);
    const { result: none } = renderHook(() => useImageSrc());
    const { result: nul } = renderHook(() => useImageSrc(null));
    const { result: empty } = renderHook(() => useImageSrc(""));
    const { result: processing } = renderHook(() => useImageSrc("processing"));

    expect(none.current).toBe(placeholder);
    expect(nul.current).toBe(placeholder);
    expect(empty.current).toBe(placeholder);
    expect(processing.current).toBe(placeholder);
  });

  it("useImageSrc and getImageSrc resolve real ids identically", () => {
    const { result } = renderHook(() => useImageSrc("abc123"));
    expect(result.current).toEqual(getImageSrc("abc123"));
    expect(result.current).toEqual({
      uri: `${IMAGE_BASE_URL}/images/${IMAGE_ACCOUNT_HASH}/abc123?type=png`,
    });

    const { result: upload } = renderHook(() => useImageSrc("/uploads/a.png"));
    expect(upload.current).toEqual({ uri: `${API_URL}/uploads/a.png` });
  });
});

describe("getAvatarSrc", () => {
  it("falls back to the person illustration, not the chalet placeholder", () => {
    const person = getAvatarSrc(null);
    expect(JSON.stringify(person)).toContain("profile.png");
    expect(person).not.toBe(getImageSrc(null));

    expect(getAvatarSrc(undefined)).toBe(person);
    expect(getAvatarSrc("")).toBe(person);
    expect(getAvatarSrc("processing")).toBe(person);
    expect(getAvatarSrc({ uri: "x" } as any)).toBe(person);
  });

  it("returns the real avatar when one exists", () => {
    expect(getAvatarSrc("/uploads/avatars/u1.png")).toEqual({
      uri: `${API_URL}/uploads/avatars/u1.png`,
    });
    expect(getAvatarSrc("https://cdn.example.com/me.jpg")).toEqual({
      uri: "https://cdn.example.com/me.jpg",
    });
  });
});
