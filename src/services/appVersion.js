import { Linking, Platform } from 'react-native';
import * as Application from 'expo-application';

const REQUEST_TIMEOUT_MS = 8000;
const SUPPORTED_PLATFORMS = new Set(['ios', 'android']);

const warnVersionCheck = (message, error) => {
  if (__DEV__) {
    if (error) {
      console.warn('[app-version]', message, error);
    } else {
      console.warn('[app-version]', message);
    }
  }
};

const toVersionParts = (version) => {
  const stringVersion = String(version || '').trim();
  const parts = stringVersion.split('.').slice(0, 3);

  while (parts.length < 3) {
    parts.push('0');
  }

  return parts.map((part) => {
    const match = part.match(/\d+/);
    return match ? Number.parseInt(match[0], 10) : 0;
  });
};

export const compareVersions = (leftVersion, rightVersion) => {
  const left = toVersionParts(leftVersion);
  const right = toVersionParts(rightVersion);

  for (let index = 0; index < 3; index += 1) {
    if (left[index] > right[index]) return 1;
    if (left[index] < right[index]) return -1;
  }

  return 0;
};

const sanitizeVersionRule = (rule) => {
  if (!rule || typeof rule !== 'object') return null;

  const minimumVersion = typeof rule.minimumVersion === 'string' ? rule.minimumVersion.trim() : '';
  const latestVersionRaw = typeof rule.latestVersion === 'string' ? rule.latestVersion.trim() : '';
  const latestVersion = latestVersionRaw || minimumVersion;
  const storeUrl = typeof rule.storeUrl === 'string' ? rule.storeUrl.trim() : '';
  const message = typeof rule.message === 'string' ? rule.message.trim() : '';

  if (!minimumVersion || !latestVersion || !storeUrl) {
    return null;
  }

  return {
    minimumVersion,
    latestVersion,
    storeUrl,
    message: message || 'A new version is required to continue.',
  };
};

export const getInstalledVersion = () => {
  const nativeVersion = Application.nativeApplicationVersion;
  return typeof nativeVersion === 'string' ? nativeVersion.trim() : '';
};

export const checkAppVersion = async () => {
  const platform = Platform.OS;
  const fallback = {
    updateRequired: false,
    minimumVersion: null,
    latestVersion: null,
    storeUrl: null,
    message: null,
    installedVersion: getInstalledVersion(),
    platform,
  };

  if (!SUPPORTED_PLATFORMS.has(platform)) {
    return fallback;
  }

  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!apiBaseUrl) {
    warnVersionCheck('EXPO_PUBLIC_API_URL is not set. Skipping app version check.');
    return fallback;
  }

  if (!fallback.installedVersion) {
    warnVersionCheck('Application.nativeApplicationVersion is unavailable. Skipping app version check.');
    return fallback;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/app-version`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      warnVersionCheck(`Version endpoint returned ${response.status}. Allowing app access.`);
      return fallback;
    }

    const payload = await response.json();
    const rule = sanitizeVersionRule(payload?.[platform]);

    if (!rule) {
      warnVersionCheck(`Version payload for platform "${platform}" is missing required fields. Allowing app access.`);
      return fallback;
    }

    const updateRequired = compareVersions(fallback.installedVersion, rule.minimumVersion) < 0;

    return {
      ...fallback,
      ...rule,
      updateRequired,
    };
  } catch (error) {
    const label = error?.name === 'AbortError'
      ? 'Version check timed out after 8 seconds. Allowing app access.'
      : 'Version check failed. Allowing app access.';
    warnVersionCheck(label, error);
    return fallback;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const openStore = async (url) => {
  if (!url) {
    warnVersionCheck('Store URL is missing. Unable to open app store.');
    return false;
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      warnVersionCheck(`Store URL is not supported: ${url}`);
      return false;
    }

    await Linking.openURL(url);
    return true;
  } catch (error) {
    warnVersionCheck('Failed to open store URL.', error);
    return false;
  }
};
