import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { nutritionAPI } from '../../api/nutrition.api';

const initialState = {
  plans: [],
  selectedPlan: null,
  loading: false,
  error: null,
};

export const fetchNutritionPlans = createAsyncThunk(
  'nutrition/fetchPlans',
  async (params = { page: 1, limit: 100 }, { rejectWithValue }) => {
    try {
      const res = await nutritionAPI.getNutritionPlans(params);
      const payload = res?.data?.data || res?.data || res;
      return payload?.items || payload || [];
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch nutrition plans';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const createNutritionPlan = createAsyncThunk(
  'nutrition/create',
  async (planData, { rejectWithValue }) => {
    try {
      await nutritionAPI.createNutritionPlan(planData);
      // Refetch plans after creating
      const res = await nutritionAPI.getNutritionPlans();
      return res?.data?.data?.items || res?.data?.items || res?.data || res || [];
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to create nutrition plan';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const updateNutritionPlan = createAsyncThunk(
  'nutrition/update',
  async ({ planId, data }, { rejectWithValue }) => {
    try {
      await nutritionAPI.updateNutritionPlan(planId, data);
      // Refetch plans after updating
      const res = await nutritionAPI.getNutritionPlans();
      return res?.data?.data?.items || res?.data?.items || res?.data || res || [];
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to update nutrition plan';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const deleteNutritionPlan = createAsyncThunk(
  'nutrition/delete',
  async (planId, { rejectWithValue }) => {
    try {
      await nutritionAPI.deleteNutritionPlan(planId);
      // Refetch plans after deleting
      const res = await nutritionAPI.getNutritionPlans();
      return res?.data?.data?.items || res?.data?.items || res?.data || res || [];
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to delete nutrition plan';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

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
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNutritionPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNutritionPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload;
        state.error = null;
      })
      .addCase(fetchNutritionPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createNutritionPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNutritionPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload;
        state.error = null;
      })
      .addCase(createNutritionPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateNutritionPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNutritionPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload;
        state.error = null;
      })
      .addCase(updateNutritionPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteNutritionPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNutritionPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload;
        state.error = null;
      })
      .addCase(deleteNutritionPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setPlans,
  setSelectedPlan,
  clearError,
} = nutritionSlice.actions;
export default nutritionSlice.reducer;









