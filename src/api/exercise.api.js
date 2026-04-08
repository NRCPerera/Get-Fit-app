import apiClient from './client';
import { uploadWithFetch } from '../utils/uploadHelper';
import * as SecureStore from 'expo-secure-store';

export const exerciseAPI = {
  getAllExercises: async (params) => {
    const res = await apiClient.get('/exercises', { params });
    return res.data;
  },
  getExerciseById: async (id) => {
    const res = await apiClient.get(`/exercises/${id}`);
    return res.data;
  },
  searchExercises: async (q) => {
    const res = await apiClient.get('/exercises/search', { params: { q } });
    return res.data;
  },
  createExercise: async (payload) => {
    // Check if payload is FormData (has video) or regular object (no video)
    const isFormData = payload instanceof FormData;
    
    if (isFormData) {
      // Use fetch for FormData (better React Native support)
      const result = await uploadWithFetch('/exercises', payload, 180000); // 3 minutes for large videos
      return result;
    } else {
      // For JSON payload (no video), use regular axios POST
      const res = await apiClient.post('/exercises', payload, {
        timeout: 30000, // 30 seconds for regular requests
      });
      return res.data;
    }
  },
  updateExercise: async (id, payload, isMultipart = false) => {
    // Check if payload is FormData (has video) or regular object (no video)
    const isFormData = payload instanceof FormData;
    
    if (isFormData) {
      // Use fetch for FormData PUT request
      const baseURL = apiClient.defaults.baseURL;
      const url = `${baseURL}/exercises/${id}`;
      
      // Get auth token
      let token = null;
      try {
        token = await SecureStore.getItemAsync('accessToken');
      } catch (error) {
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      try {
        const headers = {
          'Accept': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(url, {
          method: 'PUT',
          body: payload, // FormData - fetch will automatically set Content-Type with boundary
          headers,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Upload timeout');
        }
        throw error;
      }
    } else {
      // For JSON payload (no video), use regular axios PUT
      const res = await apiClient.put(`/exercises/${id}`, payload, {
        timeout: 30000, // 30 seconds for regular requests
      });
      return res.data;
    }
  },
  deleteExercise: async (id) => {
    const res = await apiClient.delete(`/exercises/${id}`);
    return res.data;
  },
  setExerciseStatus: async (id, isActive) => {
    const res = await apiClient.put(`/exercises/${id}`, { isActive });
    return res.data;
  },
  bulkSetStatus: async (ids, isActive) => {
    // No bulk endpoint; perform parallel updates
    const results = await Promise.all(
      ids.map((id) => apiClient.put(`/exercises/${id}`, { isActive }))
    );
    return results.map((r) => r.data);
  },
};


