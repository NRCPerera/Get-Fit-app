import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { membershipAPI } from '../../api/membership.api';

const initialState = {
  plans: [],
  myMemberships: null,
  loading: false,
  error: null,
};

export const fetchMembershipPlans = createAsyncThunk(
  'membership/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const res = await membershipAPI.getPlans();
      const payload = res?.data || res;
      return payload?.items || payload || [];
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch membership plans';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const fetchMyMemberships = createAsyncThunk(
  'membership/fetchMyMemberships',
  async (_, { rejectWithValue }) => {
    try {
      const res = await membershipAPI.getMyMemberships();
      const payload = res?.data || res;
      return payload;
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch memberships';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const purchaseMembership = createAsyncThunk(
  'membership/purchase',
  async (planId, { rejectWithValue }) => {
    try {
      const res = await membershipAPI.purchaseMembership(planId);
      // After purchase, fetch updated memberships
      const membershipRes = await membershipAPI.getMyMemberships();
      return membershipRes?.data || membershipRes;
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to purchase membership';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

const membershipSlice = createSlice({
  name: 'membership',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch plans
      .addCase(fetchMembershipPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembershipPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload;
        state.error = null;
      })
      .addCase(fetchMembershipPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch my memberships
      .addCase(fetchMyMemberships.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyMemberships.fulfilled, (state, action) => {
        state.loading = false;
        state.myMemberships = action.payload;
        state.error = null;
      })
      .addCase(fetchMyMemberships.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Purchase membership
      .addCase(purchaseMembership.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(purchaseMembership.fulfilled, (state, action) => {
        state.loading = false;
        state.myMemberships = action.payload;
        state.error = null;
      })
      .addCase(purchaseMembership.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = membershipSlice.actions;
export default membershipSlice.reducer;
