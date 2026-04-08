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
  createSubscriptionPaymentWithSavedCard: async (data) => {
    const res = await apiClient.post('/payments/subscription/saved-card', data);
    return res.data;
  },
  completeSubscriptionPayment: async (paymentId) => {
    const res = await apiClient.post('/payments/subscription/complete', { paymentId });
    return res.data;
  },
  // Saved card methods
  saveCard: async (cardData) => {
    const res = await apiClient.post('/payments/cards', cardData);
    return res.data;
  },
  getSavedCards: async () => {
    const res = await apiClient.get('/payments/cards');
    return res.data;
  },
  deleteSavedCard: async (cardId) => {
    const res = await apiClient.delete(`/payments/cards/${cardId}`);
    return res.data;
  },
  setDefaultCard: async (cardId) => {
    const res = await apiClient.patch(`/payments/cards/${cardId}/default`);
    return res.data;
  },
  // Check payment status - called when user returns from PayHere
  // Only returns current status; the PayHere webhook is responsible for completing payments
  markPaymentComplete: async (paymentId) => {
    const res = await apiClient.post(`/payments/${paymentId}/complete`);
    return res.data;
  },
};


