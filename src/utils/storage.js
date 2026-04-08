import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'onboardingCompleted',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
};

export const storage = {
  // Onboarding
  async setOnboardingCompleted() {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    } catch (error) {
    }
  },

  async getOnboardingCompleted() {
    try {
      const completed = await SecureStore.getItemAsync(STORAGE_KEYS.ONBOARDING_COMPLETED);
      return completed === 'true';
    } catch (error) {
      return false;
    }
  },

  // Auth tokens
  async saveToken(key, token) {
    try {
      await SecureStore.setItemAsync(key, token);
    } catch (error) {
    }
  },

  async getToken(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      return null;
    }
  },

  async removeToken(key) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
    }
  },

  // User data
  async saveUser(user) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
    }
  },

  async getUser() {
    try {
      const user = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      return null;
    }
  },

  async removeUser() {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
    } catch (error) {
    }
  },

  // Clear all data
  async clearAll() {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.ONBOARDING_COMPLETED),
        SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.USER),
      ]);
    } catch (error) {
    }
  },
};









