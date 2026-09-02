/**
 * Universal / App Link entry point.
 *
 * `sununo.app` publishes SEO pages for every chalet at
 * `/<locale>/chalets/<name>-<uuid>`, and its apple-app-site-association hands
 * those paths to this app. Expo Router would otherwise match the web path
 * against the route tree, find nothing, and land the user on +not-found — so
 * the web URL is rewritten to the screen that actually shows the chalet.
 *
 * City pages (`/<locale>/cities/<slug>`) are deliberately NOT claimed by the
 * AASA: the slug is derived from the city's English name, the app has no screen
 * keyed by it, and dropping the user on the home tab with the city silently lost
 * is worse than the web page that answers the link properly.
 */

/** The chalet id is appended to the readable part of every web slug. */
const UUID_RE =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const WEB_HOSTS = new Set(["sununo.app", "www.sununo.app"]);
const LOCALES = new Set(["ar", "en"]);

export function redirectSystemPath({
    path,
}: {
    path: string;
    initial: boolean;
}): string {
    let url: URL;
    try {
        // Deliberately parsed without a base: a bare in-app path ("/chalet-details/x")
        // must throw here and pass straight through. Resolving it against the site
        // would make every internal route look like a sununo.app URL and send it home.
        url = new URL(path);
    } catch {
        return path;
    }

    // The `sununo://` scheme already speaks in app routes; only the website's
    // own URLs need translating.
    const isWebUrl =
        (url.protocol === "https:" || url.protocol === "http:") &&
        WEB_HOSTS.has(url.hostname.toLowerCase());
    if (!isWebUrl) return path;

    const segments = url.pathname.split("/").filter(Boolean);
    if (segments[0] && LOCALES.has(segments[0].toLowerCase())) segments.shift();

    if (segments[0] === "chalets" && segments[1]) {
        const id = decodeURIComponent(segments[1]).match(UUID_RE)?.[0];
        // A chalets URL without a uuid is a listing page, not a chalet.
        if (id) return `/chalet-details/${id.toLowerCase()}`;
    }

    // Anything else the site serves (legal pages, the download page, the
    // marketing home) has no app equivalent — open the app, not a dead end.
    return "/";
}
