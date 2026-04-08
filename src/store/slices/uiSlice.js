import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  error: null,
  notifications: [],
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  addNotification,
  removeNotification,
  clearNotifications,
  setTheme,
} = uiSlice.actions;
export default uiSlice.reducer;



















