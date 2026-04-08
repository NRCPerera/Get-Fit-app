import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  schedules: [],
  selectedSchedule: null,
  templates: [],
  loading: false,
  error: null,
};

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setSchedules: (state, action) => {
      state.schedules = action.payload;
    },
    setSelectedSchedule: (state, action) => {
      state.selectedSchedule = action.payload;
    },
    addSchedule: (state, action) => {
      state.schedules.push(action.payload);
    },
    updateSchedule: (state, action) => {
      const index = state.schedules.findIndex(schedule => schedule.id === action.payload.id);
      if (index !== -1) {
        state.schedules[index] = action.payload;
      }
    },
    deleteSchedule: (state, action) => {
      state.schedules = state.schedules.filter(schedule => schedule.id !== action.payload);
    },
    setTemplates: (state, action) => {
      state.templates = action.payload;
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
  setSchedules,
  setSelectedSchedule,
  addSchedule,
  updateSchedule,
  deleteSchedule,
  setTemplates,
  setLoading,
  setError,
  clearError,
} = scheduleSlice.actions;
export default scheduleSlice.reducer;



















