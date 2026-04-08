import apiClient from './client';

export const membershipAPI = {
  getPlans: async () => {
    const res = await apiClient.get('/memberships/plans');
    return res.data;
  },
  getMyMemberships: async () => {
    const res = await apiClient.get('/memberships/me');
    return res.data;
  },
  purchaseMembership: async (planId) => {
    const res = await apiClient.post('/memberships/purchase', { planId });
    return res.data;
  },
};

