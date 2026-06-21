const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * iOS Podfile tweaks required for @react-native-firebase to build alongside
 * React Native's New Architecture WITHOUT `useFrameworks` (which conflicts with
 * Mapbox/Hermes and makes RNFirebase build as a framework module that can't
 * import React's headers — "RCTBridgeModule must be imported from module").
 *
 * Instead we build everything as static libraries and:
 *  1) enable `use_modular_headers!` so Firebase's Swift pods
 *     (FirebaseCoreInternal → GoogleUtilities) get module maps, and
 *  2) keep CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES as a safety net.
 *
 * Runs on every `expo prebuild`, so it survives Continuous Native Generation
 * (the /ios folder is git-ignored and regenerated).
 */
const POST_INSTALL_SNIPPET =
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

      // 1) Enable modular headers globally — required for Firebase's Swift pods
      //    to build as static libraries.
      if (!contents.includes("use_modular_headers!")) {
        contents = contents.replace(
          /(platform :ios[^\n]*\n)/,
          "$1use_modular_headers!\n",
        );
      }

      // 2) Safety net for any remaining non-modular includes.
      if (
        !contents.includes(
          "CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES",
        )
      ) {
        contents = contents.replace(
          /(post_install do \|installer\|\n)/,
          `$1${POST_INSTALL_SNIPPET}`,
        );
      }

      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
};
