import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import exerciseSlice from './slices/exerciseSlice';
import scheduleSlice from './slices/scheduleSlice';
import instructorSlice from './slices/instructorSlice';
import nutritionSlice from './slices/nutritionSlice';
import workoutSlice from './slices/workoutSlice';
import membershipSlice from './slices/membershipSlice';
import paymentSlice from './slices/paymentSlice';
import measurementSlice from './slices/measurementSlice';
import medicalSlice from './slices/medicalSlice';
import notificationSlice from './slices/notificationSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    exercise: exerciseSlice,
    schedule: scheduleSlice,
    instructor: instructorSlice,
    nutrition: nutritionSlice,
    workout: workoutSlice,
    membership: membershipSlice,
    payment: paymentSlice,
    measurement: measurementSlice,
    medical: medicalSlice,
    notification: notificationSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});
