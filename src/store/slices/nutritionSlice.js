import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  plans: [],
  selectedPlan: null,
  loading: false,
  error: null,
};

const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState,
  reducers: {
    setPlans: (state, action) => {
      state.plans = action.payload;
    },
    setSelectedPlan: (state, action) => {
      state.selectedPlan = action.payload;
    },
    addPlan: (state, action) => {
      state.plans.push(action.payload);
    },
    updatePlan: (state, action) => {
      const index = state.plans.findIndex(plan => plan.id === action.payload.id);
      if (index !== -1) {
        state.plans[index] = action.payload;
      }
    },
    deletePlan: (state, action) => {
      state.plans = state.plans.filter(plan => plan.id !== action.payload);
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
  setPlans,
  setSelectedPlan,
  addPlan,
  updatePlan,
  deletePlan,
  setLoading,
  setError,
  clearError,
} = nutritionSlice.actions;
export default nutritionSlice.reducer;









