import client from './client';

export const workoutAPI = {
    /**
     * Get all active workouts for the mobile app
     * Returns workouts grouped by difficulty level
     */
    getPublicWorkouts: async (params = {}) => {
        const response = await client.get('/workouts/public', { params });
        return response.data;
    },

    /**
     * Get a single workout by ID
     */
    getWorkoutById: async (id) => {
        const response = await client.get(`/workouts/${id}`);
        return response.data;
    }
};
