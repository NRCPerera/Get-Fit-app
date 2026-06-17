import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { paymentAPI } from '../../api/payment.api';

const initialState = {
  history: [],
  earnings: null,
  loading: false,
  error: null,
};

export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const res = await paymentAPI.getPaymentHistory();
      const payload = res?.data || res;
      return payload?.items || payload || [];
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch payment history';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const fetchInstructorEarnings = createAsyncThunk(
  'payment/fetchEarnings',
  async (_, { rejectWithValue }) => {
    try {
      const res = await paymentAPI.getInstructorEarnings();
      const payload = res?.data || res;
      return payload;
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch earnings';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchInstructorEarnings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstructorEarnings.fulfilled, (state, action) => {
        state.loading = false;
        state.earnings = action.payload;
        state.error = null;
      })
      .addCase(fetchInstructorEarnings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = paymentSlice.actions;
export default paymentSlice.reducer;
