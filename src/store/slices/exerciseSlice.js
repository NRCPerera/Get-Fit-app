import { createSlice } from '@reduxjs/toolkit';

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
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setExercises,
  setSelectedExercise,
  setFilters,
  clearFilters,
  setLoading,
  setError,
  clearError,
} = exerciseSlice.actions;
export default exerciseSlice.reducer;









