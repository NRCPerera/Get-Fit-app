import apiClient from './client';

export const measurementAPI = {
  addMeasurement: async (data) => {
    const res = await apiClient.post('/measurements', data);
    return res.data;
  },
  getMeasurementHistory: async (params) => {
    const res = await apiClient.get('/measurements/history', { params });
    return res.data;
  },
  getLatestMeasurement: async () => {
    const res = await apiClient.get('/measurements/latest');
    return res.data;
  },
  getProgressComparison: async () => {
    const res = await apiClient.get('/measurements/progress');
    return res.data;
  },
  updateMeasurement: async (measurementId, data) => {
    const res = await apiClient.put(`/measurements/${measurementId}`, data);
    return res.data;
  },
  deleteMeasurement: async (measurementId) => {
    const res = await apiClient.delete(`/measurements/${measurementId}`);
    return res.data;
  },
};










