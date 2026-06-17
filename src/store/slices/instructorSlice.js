import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { instructorAPI } from '../../api/instructor.api';

const initialState = {
  instructors: [],
  selectedInstructor: null,
  stats: null,
  loading: false,
  error: null,
};

export const fetchInstructors = createAsyncThunk(
  'instructor/fetchInstructors',
  async (params = { page: 1, limit: 100 }, { rejectWithValue }) => {
    try {
      const res = await instructorAPI.getAllInstructors(params);
      const payload = res?.data?.data || res?.data || res;
      return payload?.items || payload || [];
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch instructors';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const fetchInstructorDetail = createAsyncThunk(
  'instructor/fetchDetail',
  async (instructorId, { rejectWithValue }) => {
    try {
      const res = await instructorAPI.getInstructorDetail(instructorId);
      const payload = res?.data || res;
      return payload;
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch instructor detail';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const fetchInstructorStats = createAsyncThunk(
  'instructor/fetchStats',
  async (instructorId, { rejectWithValue }) => {
    try {
      const res = await instructorAPI.getInstructorStats(instructorId);
      const payload = res?.data || res;
      return payload;
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch instructor stats';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const subscribeToInstructor = createAsyncThunk(
  'instructor/subscribe',
  async (instructorId, { rejectWithValue }) => {
    try {
      const res = await instructorAPI.subscribeToInstructor(instructorId);
      const payload = res?.data || res;
      return payload;
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to subscribe to instructor';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

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
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstructors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstructors.fulfilled, (state, action) => {
        state.loading = false;
        state.instructors = action.payload;
        state.error = null;
      })
      .addCase(fetchInstructors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchInstructorDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstructorDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedInstructor = action.payload;
        state.error = null;
      })
      .addCase(fetchInstructorDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchInstructorStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(subscribeToInstructor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(subscribeToInstructor.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(subscribeToInstructor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setInstructors,
  setSelectedInstructor,
  clearError,
} = instructorSlice.actions;
export default instructorSlice.reducer;









