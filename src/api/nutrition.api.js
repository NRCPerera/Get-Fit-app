import apiClient from './client';

export const nutritionAPI = {
  getMyPlans: async () => {
    const res = await apiClient.get('/nutrition/me');
    return res.data;
  },
  getPlanById: async (id) => {
    const res = await apiClient.get(`/nutrition/mine/${id}`);
    return res.data;
  },
  createPlan: async (data) => {
    const res = await apiClient.post('/nutrition', data);
    return res.data;
  },
};


