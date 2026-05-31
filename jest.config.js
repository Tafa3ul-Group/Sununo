module.exports = {
  preset: "jest-expo",
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // Extends jest-expo's default list with the redux ecosystem (ships ESM).
  // Under pnpm the inner `node_modules/<pkg>` segment must be allow-listed by
  // name, otherwise it matches the ignore pattern and is left untransformed.
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|immer|redux|@reduxjs|reselect|react-redux|i18next|react-i18next))",
    "/node_modules/react-native-reanimated/plugin/",
  ],
};
