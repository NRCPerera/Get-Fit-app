import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  instructors: [],
  selectedInstructor: null,
  stats: null,
  loading: false,
  error: null,
};

const instructorSlice = createSlice({
  name: 'instructor',
  initialState,
  reducers: {
    setInstructors: (state, action) => {
      state.instructors = action.payload;
    },
    setSelectedInstructor: (state, action) => {
      state.selectedInstructor = action.payload;
    },
    setStats: (state, action) => {
      state.stats = action.payload;
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
  setInstructors,
  setSelectedInstructor,
  setStats,
  setLoading,
  setError,
  clearError,
} = instructorSlice.actions;
export default instructorSlice.reducer;









