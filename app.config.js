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
const appJson = require("./app.json");

module.exports = () => {
  const expo = { ...appJson.expo };

  const iosPlist = process.env.GOOGLE_SERVICES_INFO_PLIST;
  const androidJson = process.env.GOOGLE_SERVICES_JSON;

  if (iosPlist) {
    expo.ios = { ...expo.ios, googleServicesFile: iosPlist };
  }
  if (androidJson) {
    expo.android = { ...expo.android, googleServicesFile: androidJson };
  }

  return expo;
};
