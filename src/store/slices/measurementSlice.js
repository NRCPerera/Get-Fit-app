import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { measurementAPI } from '../../api/measurement.api';

const initialState = {
  history: [],
  latest: null,
  progress: null,
  loading: false,
  error: null,
};

export const fetchMeasurementHistory = createAsyncThunk(
  'measurement/fetchHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await measurementAPI.getMeasurementHistory(params);
      const payload = res?.data || res;
      return payload?.items || payload || [];
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch measurements';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const fetchLatestMeasurement = createAsyncThunk(
  'measurement/fetchLatest',
  async (_, { rejectWithValue }) => {
    try {
      const res = await measurementAPI.getLatestMeasurement();
      const payload = res?.data || res;
      return payload;
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch latest measurement';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const fetchProgressComparison = createAsyncThunk(
  'measurement/fetchProgress',
  async (_, { rejectWithValue }) => {
    try {
      const res = await measurementAPI.getProgressComparison();
      const payload = res?.data || res;
      return payload;
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch progress';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const addMeasurement = createAsyncThunk(
  'measurement/add',
  async (data, { rejectWithValue }) => {
    try {
      await measurementAPI.addMeasurement(data);
      // Refetch history and latest after adding
      const [historyRes, latestRes] = await Promise.all([
        measurementAPI.getMeasurementHistory(),
        measurementAPI.getLatestMeasurement(),
      ]);
      return {
        history: historyRes?.data?.items || historyRes?.data || historyRes || [],
        latest: latestRes?.data || latestRes,
      };
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to add measurement';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const updateMeasurement = createAsyncThunk(
  'measurement/update',
  async ({ measurementId, data }, { rejectWithValue }) => {
    try {
      await measurementAPI.updateMeasurement(measurementId, data);
      // Refetch history after updating
      const res = await measurementAPI.getMeasurementHistory();
      return res?.data?.items || res?.data || res || [];
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to update measurement';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const deleteMeasurement = createAsyncThunk(
  'measurement/delete',
  async (measurementId, { rejectWithValue }) => {
    try {
      await measurementAPI.deleteMeasurement(measurementId);
      // Refetch history after deleting
      const res = await measurementAPI.getMeasurementHistory();
      return res?.data?.items || res?.data || res || [];
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to delete measurement';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

const measurementSlice = createSlice({
  name: 'measurement',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeasurementHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeasurementHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
        state.error = null;
      })
      .addCase(fetchMeasurementHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchLatestMeasurement.fulfilled, (state, action) => {
        state.latest = action.payload;
      })
      .addCase(fetchProgressComparison.fulfilled, (state, action) => {
        state.progress = action.payload;
      })
      .addCase(addMeasurement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMeasurement.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload.history;
        state.latest = action.payload.latest;
        state.error = null;
      })
      .addCase(addMeasurement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateMeasurement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMeasurement.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
        state.error = null;
      })
      .addCase(updateMeasurement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteMeasurement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMeasurement.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
        state.error = null;
      })
      .addCase(deleteMeasurement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = measurementSlice.actions;
export default measurementSlice.reducer;
