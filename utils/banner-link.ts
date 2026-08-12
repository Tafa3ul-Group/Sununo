/**
 * Banner link resolution.
 *
 * The portal lets an admin attach one of two things to a banner (see the
 * "رابط / شاليه" toggle on the banners page): a free-form URL, or a chalet —
 * which is stored as that chalet's UUID in the same `link` column. Seeded
 * banners also use internal app paths like "/search".
 *
 * This resolves whichever of those three shapes came back from the API into a
 * concrete action, so a tap on a banner actually goes somewhere.
 */
import { router } from "expo-router";
import { Linking } from "react-native";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * "https://…", "mailto:…", "tel:…", "sununo://…" — but NOT "example.com:8080",
 * which is a bare host carrying a port. A port is the only thing that follows
 * the colon as a digit, so a scheme is one that is followed either by "//" or
 * by anything that is not a digit.
 */
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:(\/\/|[^0-9])/i;

export type BannerLinkTarget =
  | { kind: "chalet"; id: string }
  | { kind: "route"; path: string }
  | { kind: "external"; url: string };

/** Returns null when the banner has no usable link (so it stays non-tappable). */
export function resolveBannerLink(
  link?: string | null,
): BannerLinkTarget | null {
  // `link` comes straight off an untyped API payload (BannerSwiper's rows are
  // `any`), so a number or object must resolve to "no link" rather than throw
  // out of a renderItem and take the home screen down with it.
  const value = typeof link === "string" ? link.trim() : "";
  if (!value) return null;
  if (UUID_RE.test(value)) return { kind: "chalet", id: value };
  // "//host/path" is protocol-relative, not an app route — it has to be checked
  // before the single-slash route branch or it gets pushed at a router that has
  // no such route.
  if (value.startsWith("//")) return { kind: "external", url: `https:${value}` };
  if (value.startsWith("/")) return { kind: "route", path: value };
  if (SCHEME_RE.test(value)) return { kind: "external", url: value };
  // Bare hosts ("sununo.app", "www.example.com") — Linking needs a scheme.
  return { kind: "external", url: `https://${value}` };
}

/** True when the banner has somewhere to go, i.e. it should react to a tap. */
export function hasBannerLink(link?: string | null): boolean {
  return resolveBannerLink(link) !== null;
}

/** Performs the navigation. Returns false when there was nothing to open. */
export function openBannerLink(link?: string | null): boolean {
  const target = resolveBannerLink(link);
  if (!target) return false;

  switch (target.kind) {
    case "chalet":
      // Same guard as the route branch below: a push can throw (e.g. a tap that
      // lands before the root layout has mounted), and that must not crash the
      // home screen.
      try {
        router.push(`/chalet-details/${target.id}`);
      } catch {
        return false;
      }
      return true;
    case "route":
      // An admin-typed path may not match a real route; don't crash the home
      // screen over it.
      try {
        router.push(target.path as never);
      } catch {
        return false;
      }
      return true;
    case "external":
      Linking.openURL(target.url).catch(() => {});
      return true;
  }
}
