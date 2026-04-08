import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import exerciseSlice from './slices/exerciseSlice';
import scheduleSlice from './slices/scheduleSlice';
import instructorSlice from './slices/instructorSlice';
import nutritionSlice from './slices/nutritionSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    exercise: exerciseSlice,
    schedule: scheduleSlice,
    instructor: instructorSlice,
    nutrition: nutritionSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});
