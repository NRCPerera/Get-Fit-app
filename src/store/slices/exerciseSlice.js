import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { exerciseAPI } from '../../api/exercise.api';

const initialState = {
  exercises: [],
  selectedExercise: null,
  filters: {
    category: '',
    difficulty: '',
    search: '',
  },
  loading: false,
  error: null,
};

export const fetchExercises = createAsyncThunk(
  'exercise/fetchExercises',
  async (params = { page: 1, limit: 100, status: 'active' }, { rejectWithValue }) => {
    try {
      const res = await exerciseAPI.getAllExercises(params);
      const payload = res?.data?.data || res?.data || res;
      return payload?.items || payload || [];
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch exercises';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

const exerciseSlice = createSlice({
  name: 'exercise',
  initialState,
  reducers: {
    setExercises: (state, action) => {
      state.exercises = action.payload;
    },
    setSelectedExercise: (state, action) => {
      state.selectedExercise = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: '',
        difficulty: '',
        search: '',
      };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExercises.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExercises.fulfilled, (state, action) => {
        state.loading = false;
        state.exercises = action.payload;
        state.error = null;
      })
      .addCase(fetchExercises.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setExercises,
  setSelectedExercise,
  setFilters,
  clearFilters,
  clearError,
} = exerciseSlice.actions;
export default exerciseSlice.reducer;









