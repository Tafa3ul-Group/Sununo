// Pure semver-ish comparison used by the update gate. No native deps so it can
// be unit-tested in isolation. Handles "2.1.1", "2.1", "2.1.1-beta.2", etc. by
// comparing the numeric release segments left-to-right.

function parseVersion(v: string | null | undefined): number[] {
  return String(v ?? "")
    .split(/[-+]/)[0] // drop any pre-release / build suffix ("2.1.1-rc.1" → "2.1.1")
    .split(".")
    .map((p) => {
      const n = parseInt(p, 10);
      return Number.isFinite(n) ? n : 0;
    });
}

/**
 * True when `current` is strictly older than `latest`.
 * An empty/invalid `latest` returns false (never prompt without a target version).
 */
export function isVersionOlder(
  current: string | null | undefined,
  latest: string | null | undefined,
): boolean {
  if (!latest) return false;
  const a = parseVersion(current);
  const b = parseVersion(latest);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x < y) return true;
    if (x > y) return false;
  }
  return false;
}
