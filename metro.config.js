const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable pnpm support
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Ensure Metro watches the pnpm store and node_modules
config.watchFolders = [
  __dirname,
  path.resolve(__dirname, 'node_modules'),
];

module.exports = config;
