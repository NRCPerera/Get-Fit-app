import apiClient from './client';

const createAuthApiError = (response, fallbackMessage) => {
  const message = response?.data?.error ||
    response?.data?.message ||
    fallbackMessage;
  const error = new Error(message);
  error.response = response;
  error.status = response?.status;
  error.data = response?.data;
  return error;
};

const ensureAuthSuccess = (response, fallbackMessage) => {
  if (response.status >= 400 || response.data?.success === false) {
    throw createAuthApiError(response, fallbackMessage);
  }

  return response.data;
};

export const authAPI = {
  // Register a new user
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return ensureAuthSuccess(response, 'Registration failed. Please check your information and try again.');
  },

  // Login user
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return ensureAuthSuccess(response, 'Login failed. Please check your credentials and try again.');
  },

  // Logout user
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return ensureAuthSuccess(response, 'Logout failed.');
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    return ensureAuthSuccess(response, 'Token refresh failed.');
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return ensureAuthSuccess(response, 'Failed to send OTP. Please try again.');
  },

  // Verify password reset OTP (does not consume the OTP)
  verifyPasswordResetOTP: async (email, otp) => {
    const response = await apiClient.post('/auth/verify-password-reset-otp', { email, otp });
    return ensureAuthSuccess(response, 'Invalid OTP code. Please try again.');
  },

  // Reset password with OTP
  resetPassword: async (email, otp, password) => {
    const response = await apiClient.post('/auth/reset-password', { email, otp, password });
    return ensureAuthSuccess(response, 'Failed to reset password. Please try again.');
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await apiClient.get(`/auth/verify-email/${token}`);
    return ensureAuthSuccess(response, 'Email verification failed.');
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    const response = await apiClient.post('/auth/verify-otp', { email, otp });
    return ensureAuthSuccess(response, 'OTP verification failed. Please check your code and try again.');
  },

  // Resend OTP
  resendOTP: async (email) => {
    const response = await apiClient.post('/auth/resend-otp', { email });
    return ensureAuthSuccess(response, 'Failed to resend OTP. Please try again.');
  },

  // Get current user
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return ensureAuthSuccess(response, 'Failed to load your account.');
  },
};

