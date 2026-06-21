const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * RNFirebase + `useFrameworks: "static"` makes the Firebase pods build as
 * framework modules that #import React Native's non-modular headers
 * (RCTBridgeModule.h, RCTEventEmitter.h). Xcode rejects this with
 * `-Werror,-Wnon-modular-include-in-framework-module` and the build fails.
 *
 * This config plugin injects a post_install setting that allows those includes
 * for every pod target — the standard fix for RNFirebase-on-Expo iOS builds.
 * It runs on every `expo prebuild`, so the fix survives Continuous Native
 * Generation (the /ios folder is git-ignored and regenerated).
 */
const SNIPPET =
  "    installer.pods_project.targets.each do |__rnfb_target|\n" +
  "      __rnfb_target.build_configurations.each do |__rnfb_config|\n" +
  "        __rnfb_config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'\n" +
  "      end\n" +
  "    end\n";

module.exports = function withNonModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        "Podfile",
      );
      let contents = fs.readFileSync(podfilePath, "utf-8");
      if (
        !contents.includes(
          "CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES",
        )
      ) {
        contents = contents.replace(
          /(post_install do \|installer\|\n)/,
          `$1${SNIPPET}`,
        );
        fs.writeFileSync(podfilePath, contents);
      }
      return cfg;
    },
  ]);
};
