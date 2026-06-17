import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { workoutAPI } from '../../api/workout.api';

const initialState = {
  workouts: { beginner: [], intermediate: [], advanced: [] },
  loading: false,
  error: null,
};

export const fetchWorkouts = createAsyncThunk(
  'workout/fetchWorkouts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await workoutAPI.getPublicWorkouts();
      const payload = res?.data || res;
      // Handle grouped response
      if (payload?.grouped) {
        return payload.grouped;
      }
      // Handle items array and group by difficulty
      if (payload?.items && Array.isArray(payload.items)) {
        return {
          beginner: payload.items.filter(w => w.difficulty === 'beginner'),
          intermediate: payload.items.filter(w => w.difficulty === 'intermediate'),
          advanced: payload.items.filter(w => w.difficulty === 'advanced'),
        };
      }
      return payload || { beginner: [], intermediate: [], advanced: [] };
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch workouts';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkouts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkouts.fulfilled, (state, action) => {
        state.loading = false;
        state.workouts = action.payload;
        state.error = null;
      })
      .addCase(fetchWorkouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = workoutSlice.actions;
export default workoutSlice.reducer;
