# 🚀 Sununo App - Deployment Guide

This guide provides step-by-step instructions for building, testing, and deploying the **Sununo** mobile application (Expo SDK 54) to the Apple App Store, Google Play Store, and internal testing environments using **EAS (Expo Application Services)**.

---

## 📌 Project Overview & Configuration

* **Expo SDK Version:** `54.0.x`
* **Package Manager:** `pnpm`
* **Bundle Identifier (iOS):** `com.sununo.app`
* **Package Name (Android):** `com.sununo.app`
* **EAS Project ID:** `391462b3-5778-4922-81bb-63fe765d070c`
* **EAS Owner:** `dudes12`

---

## 🔑 Prerequisites

Before initiating any deployment or build process, ensure you have the following configured:

1. **EAS CLI**: Installed globally on your machine:
   ```bash
   npm install -g eas-cli
   ```
2. **Expo Account Login**: Log in to your Expo developer account:
   ```bash
   eas login
   ```
   *Currently configured under account:* `dudes12`
3. **Developer Accounts**:
   * **Apple Developer Account** (For iOS builds & App Store submission)
   * **Google Play Console Account** (For Android builds & Play Store submission)

---

## ⚙️ EAS Build Profiles (`eas.json`)

The project uses three distinct deployment profiles configured in `eas.json`:

| Profile | Purpose | Output Format | Description |
| :--- | :--- | :--- | :--- |
| `development` | Local Development | Simulator / Dev Client | Installs a custom development client containing native modules. |
| `preview` | Internal QA & Testing | `.apk` (Android) / Ad-hoc (iOS) | Distributed via Expo Internal Distribution or direct install links. |
| `production` | Public Release | `.aab` (Android) / `.ipa` (iOS) | Signed with release credentials, ready for App Store & Google Play. |

---

## 🛠️ Build Workflows

> 💡 **Important:** EAS Builds run in the cloud. You do not need a macOS machine to build the iOS version, as Expo's servers compile the binaries remotely.

### 1. Production Releases (Submitting to Stores) 🚀
To build production-ready binaries with auto-incremented versions:

```bash
# Build both iOS and Android simultaneously
npx eas-cli build --platform all --profile production

# Build Android only (.aab format)
npx eas-cli build --platform android --profile production

# Build iOS only (.ipa format)
npx eas-cli build --platform ios --profile production
```

### 2. Preview & Staging Builds (For Testers) 🧪
To distribute the app internally to your team or clients:

```bash
# Build internal test versions for both platforms
npx eas-cli build --platform all --profile preview

# Build Android test APK (can be installed directly on Android devices)
npx eas-cli build --platform android --profile preview
```

### 3. Development Client Builds (For Local Native Coding) 💻
If you add or update native code plugins that require rebuilding the custom client:

```bash
# Build custom dev clients
npx eas-cli build --platform all --profile development
```

---

## ⚡ Over-The-Air (OTA) Updates (`eas update`)

EAS Update allows you to deploy bug fixes and minor changes directly to users' devices **without** submitting a new version to the App Store or Google Play Store.

### 1. Publish a Hotfix
```bash
# Publish update to your production users
npx eas-cli update --branch production --message "Fix: Resolve visual issue in shalet details"
```

### 2. Preview Updates Locally / Staging
```bash
# Publish to preview branch for internal QA verification
npx eas-cli update --branch preview --message "Feature: Add new localization files"
```

---

## 🩺 Diagnostics & Pre-flight Checklist

To ensure your local environment and configurations are in perfect shape:

### 1. Run Expo Doctor
Always run the doctor before building to catch schema, package mismatch, or credential errors:
```bash
npx expo-doctor
```

### 2. Resolving Metro & PNPM Symlink Mismatches
Since the project utilizes **pnpm**, you will see a warning in `expo-doctor` regarding `resolver.unstable_enableSymlinks`.
* **Note:** This warning is expected and **must be ignored**. This configuration is required in `metro.config.js` for Metro to work seamlessly with pnpm node modules.

### 3. App Icon Specifications
* File: `assets/images/icon.png`
* Format: **PNG (True 8-bit/color RGB, Non-interlaced)**
* Size: **1024x1024 pixels**
* *Avoid saving JPEG files with a `.png` extension, as it will cause build validation failures.*

---

## 📥 Submitting to the App Stores (`eas submit`)

Once your production builds are completed successfully, you can submit them to the respective stores directly from your terminal:

### 🤖 Google Play Store Submission
```bash
npx eas-cli submit --platform android
```

### 🍏 Apple App Store Submission
```bash
npx eas-cli submit --platform ios
```

*Alternatively, you can automate build and submit together:*
```bash
npx eas-cli build --platform all --profile production --auto-submit
```

---

*Document compiled & updated on: 2026-05-23 by Antigravity*
