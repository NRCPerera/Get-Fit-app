//user.api.js
import apiClient from './client';
import { uploadWithFetch } from '../utils/uploadHelper';

export const userAPI = {
  getProfile: async () => {
    const res = await apiClient.get('/users/me');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await apiClient.put('/users/me', data);
    return res.data;
  },
  uploadProfilePicture: async (formData) => {
    // Use fetch for FormData (better React Native support)
    const result = await uploadWithFetch('/users/me/profile-picture', formData, 60000);
    return result;
  },
  changePassword: async (data) => {
    const res = await apiClient.post('/users/me/change-password', data);
    return res.data;
  },
  deleteAccount: async () => {
    const res = await apiClient.delete('/users/me');
    return res.data;
  },
};


