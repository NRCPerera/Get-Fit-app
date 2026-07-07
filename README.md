# Get Fit Mobile App

A React Native + Expo mobile app for Get Fit members and instructors.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example` and point `EXPO_PUBLIC_API_URL` at your backend.
3. Start Expo:
   ```bash
   npm start
   ```

## Environment Variables

- `EXPO_PUBLIC_API_URL`: Base URL of the backend API used by the mobile app, including the forced-update check.

## Forced Updates

The app checks `${EXPO_PUBLIC_API_URL}/api/app-version` at startup before users can access the main app. While the check runs, the existing loading screen stays visible. If the installed native version is below the required minimum for the current platform, the app shows a mandatory update screen and only allows the user to open the App Store or Google Play.

### How it works

- The installed native version comes from `expo-application` via `Application.nativeApplicationVersion`.
- The backend returns per-platform rules for `minimumVersion`, `latestVersion`, `storeUrl`, and `message`.
- If the API is unavailable or returns invalid data, the app does not block access.

### How to change the minimum required version

You can raise the required version on the backend by changing these environment variables and redeploying the API. You do not need to publish a new mobile binary just to tighten the minimum supported version.

- `IOS_MINIMUM_VERSION`
- `ANDROID_MINIMUM_VERSION`
- `IOS_LATEST_VERSION`
- `ANDROID_LATEST_VERSION`

### Store URLs you must replace before production

- `IOS_STORE_URL`: Use your real App Store product URL, which looks like `https://apps.apple.com/app/id1234567890`.
- `ANDROID_STORE_URL`: Use your real Google Play listing URL, which looks like `https://play.google.com/store/apps/details?id=com.yourcompany.getfit`.

### Release reminder

Increase the mobile app version in `app.json` before every App Store / Play Store release. Forced updates compare the installed native version from the shipped app build, so the store release version must move forward each time.

### iOS limitation

iOS cannot silently install updates. The app can only redirect the user to the App Store when an update is required.
