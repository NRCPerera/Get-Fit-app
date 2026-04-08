import apiClient from './client';

export const medicalAPI = {
  createMedicalForm: async (data) => {
    const res = await apiClient.post('/medical', data);
    return res.data;
  },
  getMedicalForm: async () => {
    const res = await apiClient.get('/medical/me');
    return res.data;
  },
  updateMedicalForm: async (data) => {
    const res = await apiClient.put('/medical/me', data);
    return res.data;
  },
};


