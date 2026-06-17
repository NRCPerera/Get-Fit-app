import apiClient from './client';

export const paymentAPI = {
  createPaymentIntent: async (data) => {
    const res = await apiClient.post('/payments/create-intent', data);
    return res.data;
  },
  confirmPayment: async (paymentIntentId) => {
    const res = await apiClient.post('/payments/confirm', { paymentIntentId });
    return res.data;
  },
  getPaymentHistory: async () => {
    const res = await apiClient.get('/payments/history');
    return res.data;
  },
  getInstructorEarnings: async () => {
    const res = await apiClient.get('/payments/earnings');
    return res.data;
  },
  createSubscriptionPayment: async (data) => {
    const res = await apiClient.post('/payments/subscription', data);
    return res.data;
  },
  completeSubscriptionPayment: async (paymentId) => {
    const res = await apiClient.post('/payments/subscription/complete', { paymentId });
    return res.data;
  },
  // Check payment status - called when user returns from PayHere
  // Only returns current status; the PayHere webhook is responsible for completing payments
  markPaymentComplete: async (paymentId) => {
    const res = await apiClient.post(`/payments/${paymentId}/complete`);
    return res.data;
  },
};


