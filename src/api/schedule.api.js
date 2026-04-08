import apiClient from './client';

export const scheduleAPI = {
  createSchedule: async (data) => {
    const res = await apiClient.post('/schedules', data);
    return res.data;
  },
  getMySchedules: async () => {
    const res = await apiClient.get('/schedules/me');
    return res.data;
  },
  getScheduleById: async (id) => {
    const res = await apiClient.get(`/schedules/${id}`);
    return res.data;
  },
  updateSchedule: async (id, data) => {
    const res = await apiClient.put(`/schedules/${id}`, data);
    return res.data;
  },
  deleteSchedule: async (id) => {
    const res = await apiClient.delete(`/schedules/${id}`);
    return res.data;
  },
  getTemplates: async () => {
    const res = await apiClient.get('/schedules/templates');
    return res.data;
  },
};


