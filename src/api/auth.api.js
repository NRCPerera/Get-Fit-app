import apiClient from './client';

export const authAPI = {
  // Register a new user
  register: async (userData) => {
    const { data } = await apiClient.post('/auth/register', userData);
    return data; // backend returns { success, message, data: { user, accessToken, refreshToken } }
  },

  // Login user
  login: async (credentials) => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data;
  },

  // Logout user
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    const { data } = await apiClient.post('/auth/refresh-token', { refreshToken });
    return data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password with OTP
  resetPassword: async (email, otp, password) => {
    const response = await apiClient.post('/auth/reset-password', { email, otp, password });
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await apiClient.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    const response = await apiClient.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  // Resend OTP
  resendOTP: async (email) => {
    const response = await apiClient.post('/auth/resend-otp', { email });
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

