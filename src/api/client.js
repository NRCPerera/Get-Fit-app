import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// API Base URL - Using Render.com hosted backend
const API_URL = 'https://get-fit-backend-mpk7.onrender.com/api/v1';

// Store reference for dispatching logout on auth failure
let storeRef = null;
export const setStoreRef = (store) => {
  storeRef = store;
};

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Default timeout (can be overridden per request)
  headers: {
    'Content-Type': 'application/json',
  },
  // For React Native, ensure proper adapter is used
  adapter: Platform.OS === 'web' ? undefined : undefined, // Use default adapter for React Native
  // Increase max redirects and other network settings
  maxRedirects: 5,
  validateStatus: (status) => status < 500, // Don't throw on 4xx errors
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // If FormData, don't set Content-Type - let axios/React Native set it with boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    } catch (error) {
      // Error getting token
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling 401 auth failures
// NOTE: Because validateStatus allows 4xx, 401 responses arrive here as successes
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const forceLogout = async () => {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
  await SecureStore.deleteItemAsync('user');
  if (storeRef) {
    const { logoutUser } = require('../store/slices/authSlice');
    storeRef.dispatch(logoutUser());
  }
};

apiClient.interceptors.response.use(
  async (response) => {
    // Handle 401 responses that come through as successes due to validateStatus
    if (response.status === 401) {
      const originalRequest = response.config;

      // Skip auth endpoints to avoid infinite loops
      if (originalRequest.url?.includes('/auth/login') ||
          originalRequest.url?.includes('/auth/register') ||
          originalRequest.url?.includes('/auth/refresh-token') ||
          originalRequest.url?.includes('/auth/logout')) {
        return response;
      }

      if (originalRequest._retry) {
        // Already retried, force logout
        await forceLogout();
        return response;
      }

      if (isRefreshing) {
        // Another request is already refreshing, queue this one
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(() => {
          return response;
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const refreshResponse = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken } = refreshResponse.data.data;
        await SecureStore.setItemAsync('accessToken', accessToken);

        processQueue(null, accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await forceLogout();
        return response;
      } finally {
        isRefreshing = false;
      }
    }

    return response;
  },
  async (error) => {
    // This handles network errors and 5xx errors
    return Promise.reject(error);
  }
);

export default apiClient;

