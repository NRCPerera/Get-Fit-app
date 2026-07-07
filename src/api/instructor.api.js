import apiClient from './client';
import { uploadWithFetch } from '../utils/uploadHelper';

export const instructorAPI = {
  getAllInstructors: async (params) => {
    const res = await apiClient.get('/instructors', { params });
    return res.data;
  },
  getInstructorById: async (id) => {
    const res = await apiClient.get(`/instructors/${id}`);
    return res.data;
  },
  getMyProfile: async () => {
    const res = await apiClient.get('/instructors/me');
    return res.data;
  },
  getMyStats: async () => {
    const res = await apiClient.get('/instructors/me/stats');
    return res.data;
  },
  getMyClients: async () => {
    const res = await apiClient.get('/instructors/me/clients');
    return res.data;
  },
  // Paid subscription (personal training)
  subscribeToInstructor: async (instructorId, paymentId) => {
    const res = await apiClient.post('/instructors/subscribe', { instructorId, paymentId });
    return res.data;
  },
  unsubscribeFromInstructor: async (instructorId) => {
    const res = await apiClient.post(`/instructors/${instructorId}/unsubscribe`);
    return res.data;
  },
  checkSubscriptionStatus: async (instructorId) => {
    const res = await apiClient.get(`/instructors/${instructorId}/subscription-status`);
    return res.data;
  },
  // Free allocation (member self-assign to instructor)
  allocateToInstructor: async (instructorId) => {
    const res = await apiClient.post('/instructors/allocate', { instructorId });
    return res.data;
  },
  deallocateFromInstructor: async (instructorId) => {
    const res = await apiClient.post(`/instructors/${instructorId}/deallocate`);
    return res.data;
  },
  checkAllocationStatus: async (instructorId) => {
    const res = await apiClient.get(`/instructors/${instructorId}/allocation-status`);
    return res.data;
  },
  getMyCurrentAllocation: async () => {
    const res = await apiClient.get('/instructors/my-allocation');
    return res.data;
  },
  getMyCurrentSubscription: async () => {
    const res = await apiClient.get('/instructors/my-subscription');
    return res.data;
  },
  // Instructor allocation management
  getMyAllocatedMembers: async () => {
    const res = await apiClient.get('/instructors/me/allocated-members');
    return res.data;
  },
  removeAllocatedMember: async (memberId) => {
    const res = await apiClient.delete(`/instructors/me/allocated-members/${memberId}`);
    return res.data;
  },
  toggleAcceptingMembers: async (acceptingMembers) => {
    const res = await apiClient.post('/instructors/me/toggle-accepting-members', { acceptingMembers });
    return res.data;
  },
  getClientMeasurements: async (clientId) => {
    const res = await apiClient.get(`/instructors/clients/${clientId}/measurements`);
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await apiClient.put('/instructors/me', data);
    return res.data;
  },
  uploadTransformationPhoto: async (photoFile, photoType) => {
    const formData = new FormData();
    formData.append('photo', {
      uri: photoFile.uri,
      name: photoFile.fileName || 'photo.jpg',
      type: photoFile.type || 'image/jpeg',
    });
    formData.append('photoType', photoType); // 'before' or 'after'

    // Use uploadWithFetch for better React Native support (same as profile picture upload)
    const result = await uploadWithFetch('/instructors/me/transformation-photos', formData, 60000);
    return result;
  },
  deleteTransformationPhoto: async (photoType) => {
    const res = await apiClient.delete(`/instructors/me/transformation-photos/${photoType}`);
    return res.data;
  },
};
