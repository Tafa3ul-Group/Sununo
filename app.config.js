// Dynamic Expo config.
//
// Keeps app.json as the single source of truth for all static config, and only
// overrides the Firebase config-file paths for EAS *cloud* builds. The files
// (google-services.json / GoogleService-Info.plist) are git-ignored — they hold
// project keys — so EAS can't get them from git. Instead they're uploaded as EAS
// *file* environment variables, and EAS exposes each as an env var whose value is
// the on-disk path of the written file. We point googleServicesFile at that path.
//
// Locally (no env vars set) it falls back to the files in the repo root, so
// `expo prebuild` / `expo run:ios` keep working unchanged.
//
// If those files are absent locally (fresh clone — they're git-ignored), we drop
// the Firebase plugins and config-file paths instead of failing prebuild. The app
// still builds and runs; analytics degrades to a no-op (services/analytics.ts is
// written for exactly this case). Restore them by putting the real files in the
// repo root — see docs/analytics-ga4-setup.md.
const fs = require("fs");
const path = require("path");
const appJson = require("./app.json");

const FIREBASE_PLUGINS = [
  "@react-native-firebase/app",
  "@react-native-firebase/analytics",
];

module.exports = () => {
  const expo = { ...appJson.expo };

  // EAS file env vars win; otherwise use the repo-root file only if it exists.
  const resolveLocal = (relPath) => {
    const abs = path.resolve(__dirname, relPath);
    return fs.existsSync(abs) ? relPath : null;
  };

  const iosPlist =
    process.env.GOOGLE_SERVICES_INFO_PLIST ??
    resolveLocal(expo.ios?.googleServicesFile ?? "./GoogleService-Info.plist");
  const androidJson =
    process.env.GOOGLE_SERVICES_JSON ??
    resolveLocal(expo.android?.googleServicesFile ?? "./google-services.json");

  // Per-platform: a missing plist must not disable Firebase for Android (and
  // vice versa). Point googleServicesFile only at files that actually exist —
  // pointing at a missing one is what makes prebuild throw ENOENT.
  expo.ios = { ...expo.ios };
  expo.android = { ...expo.android };

  if (iosPlist) expo.ios.googleServicesFile = iosPlist;
  else delete expo.ios.googleServicesFile;

  if (androidJson) expo.android.googleServicesFile = androidJson;
  else delete expo.android.googleServicesFile;

  const missing = [
    !androidJson && "google-services.json",
    !iosPlist && "GoogleService-Info.plist",
  ].filter(Boolean);

  if (missing.length) {
    console.warn(
      `[app.config] Missing Firebase config (${missing.join(", ")}) — that ` +
        `platform builds WITHOUT Firebase Analytics. Add the file(s) to the ` +
        `project root to enable it.`,
    );
  }

  // Only drop the plugins when NEITHER platform is configured; keeping them with
  // one file present is what lets Android use Firebase while iOS waits for its plist.
  if (!iosPlist && !androidJson) {
    expo.plugins = (expo.plugins ?? []).filter((plugin) => {
      const name = Array.isArray(plugin) ? plugin[0] : plugin;
      return !FIREBASE_PLUGINS.includes(name);
    });
  }

  return expo;
};
