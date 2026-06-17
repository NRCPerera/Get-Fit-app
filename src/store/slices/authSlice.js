import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../../api/auth.api';
import { initializePushNotifications, removePushTokenFromBackend } from '../../services/pushNotifications';

const getAuthErrorPayload = (error, fallbackMessage, extra = {}) => ({
  message: error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage,
  ...extra,
});

// Initial state
const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  role: null,
  loading: false,
  error: null,
  pendingEmailVerification: null, // Store email that needs verification
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const resp = await authAPI.login(credentials);
      const { user, accessToken, refreshToken } = resp.data || {};
      // Store tokens securely
      if (accessToken) await SecureStore.setItemAsync('accessToken', accessToken);
      if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
      if (user) await SecureStore.setItemAsync('user', JSON.stringify(user));

      // Register for push notifications after successful login
      initializePushNotifications().catch(err => {
        console.log('Push notification registration failed:', err);
      });

      return { user, accessToken, refreshToken };
    } catch (error) {
      // Handle rate limiting (429) specifically
      if (error.response?.status === 429) {
        return rejectWithValue(getAuthErrorPayload(
          error,
          'Too many login attempts. Please wait 15 minutes before trying again.',
          {
            isRateLimited: true,
            retryAfter: error.response?.data?.retryAfter || 900,
          }
        ));
      }

      return rejectWithValue(getAuthErrorPayload(
        error,
        'Login failed. Please check your credentials and try again.',
        { isRateLimited: false }
      ));
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const resp = await authAPI.register(userData);
      const { user, accessToken, refreshToken, requiresOTPVerification } = resp.data || {};
      if (accessToken) await SecureStore.setItemAsync('accessToken', accessToken);
      if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
      if (user) await SecureStore.setItemAsync('user', JSON.stringify(user));
      return { user, accessToken, refreshToken, requiresOTPVerification, email: userData.email };
    } catch (error) {
      // Handle rate limiting (429) specifically
      if (error.response?.status === 429) {
        return rejectWithValue(getAuthErrorPayload(
          error,
          'Too many registration attempts. Please try again after 15 minutes.',
          {
            isRateLimited: true,
            retryAfter: error.response?.data?.retryAfter || 900,
          }
        ));
      }

      return rejectWithValue(getAuthErrorPayload(
        error,
        'Registration failed. Please check your information and try again.',
        { isRateLimited: false }
      ));
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const resp = await authAPI.verifyOTP(email, otp);
      const { user } = resp.data || {};
      if (user) {
        await SecureStore.setItemAsync('user', JSON.stringify(user));

        // Register for push notifications after email verification
        initializePushNotifications().catch(err => {
          console.log('Push notification registration failed:', err);
        });
      }
      return { user };
    } catch (error) {
      return rejectWithValue(getAuthErrorPayload(
        error,
        'OTP verification failed. Please check your code and try again.'
      ));
    }
  }
);

export const resendOTP = createAsyncThunk(
  'auth/resendOTP',
  async (email, { rejectWithValue }) => {
    try {
      const resp = await authAPI.resendOTP(email);
      return resp;
    } catch (error) {
      return rejectWithValue(getAuthErrorPayload(
        error,
        'Failed to resend OTP. Please try again.'
      ));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Remove push token from backend before logout
      await removePushTokenFromBackend().catch(err => {
        console.log('Failed to remove push token:', err);
      });

      await authAPI.logout();

      // Clear stored tokens
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');

      return null;
    } catch (error) {
      // Even if API call fails, clear local storage
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');

      return rejectWithValue(getAuthErrorPayload(error, 'Logout failed'));
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const resp = await authAPI.refreshToken(refreshToken);
      const { accessToken: newAccess } = resp.data || {};
      if (newAccess) await SecureStore.setItemAsync('accessToken', newAccess);
      return { accessToken: newAccess };
    } catch (error) {
      // If refresh fails, clear all tokens
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');

      return rejectWithValue(getAuthErrorPayload(error, 'Token refresh failed'));
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStoredAuth',
  async (_, { rejectWithValue }) => {
    try {
      const [accessToken, refreshToken, user] = await Promise.all([
        SecureStore.getItemAsync('accessToken'),
        SecureStore.getItemAsync('refreshToken'),
        SecureStore.getItemAsync('user'),
      ]);

      if (accessToken && refreshToken && user) {
        const parsedUser = JSON.parse(user);

        // Validate the token with the backend by calling /auth/me
        // The API client interceptor will automatically handle token refresh if needed
        try {
          const meResponse = await authAPI.getMe();
          if (meResponse?.success && meResponse?.data?.user) {
            const freshUser = meResponse.data.user;
            // Update stored user with fresh data from backend
            await SecureStore.setItemAsync('user', JSON.stringify(freshUser));

            if (freshUser.isEmailVerified) {
              initializePushNotifications().catch(err => {
                console.log('Push notification registration failed on app load:', err);
              });
            }

            return {
              accessToken: await SecureStore.getItemAsync('accessToken'), // May have been refreshed by interceptor
              refreshToken,
              user: freshUser,
            };
          }
        } catch (validationError) {
          // Token invalid and refresh failed — interceptor already cleared tokens
        }

        // Token validation failed, clear stored auth
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('user');
        return null;
      }

      return null;
    } catch (error) {
      return rejectWithValue('Failed to load stored authentication');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const user = action.payload.user || null;
        state.loading = false;
        state.user = user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = Boolean(user && action.payload.accessToken);
        state.role = user?.role || null;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        const user = action.payload.user || null;
        state.loading = false;
        state.user = user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.role = user?.role || null;
        state.error = null;
        // Only set isAuthenticated to true if OTP verification is not required
        // If OTP verification is required, user must verify OTP first
        // This prevents automatic navigation to HomeScreen before OTP verification
        if (!action.payload.requiresOTPVerification) {
          state.isAuthenticated = Boolean(user && action.payload.accessToken);
          state.pendingEmailVerification = null;
        } else {
          state.isAuthenticated = false; // Keep in auth flow until OTP is verified
          state.pendingEmailVerification = action.payload.email; // Store email for navigation
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        const user = action.payload.user || null;
        state.loading = false;
        if (user) {
          state.user = user;
          state.isAuthenticated = true;
          state.role = user.role;
          state.pendingEmailVerification = null; // Clear pending verification
        }
        state.error = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Resend OTP
      .addCase(resendOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendOTP.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.role = null;
        state.error = null;
        state.pendingEmailVerification = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Still clear the state even if API call failed
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.role = null;
      })

      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.role = null;
      })

      // Load stored auth
      .addCase(loadStoredAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const user = action.payload.user || null;
          state.user = user;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.role = user?.role || null;
          // Only set isAuthenticated to true if email is verified
          // This prevents users with unverified emails from accessing the app
          state.isAuthenticated = user?.isEmailVerified === true;
        } else {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.role = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setLoading, updateUser } = authSlice.actions;
export default authSlice.reducer;
