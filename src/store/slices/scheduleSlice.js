import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { scheduleAPI } from '../../api/schedule.api';

const initialState = {
  schedules: [],
  selectedSchedule: null,
  templates: [],
  loading: false,
  error: null,
};

export const fetchSchedules = createAsyncThunk(
  'schedule/fetchSchedules',
  async (params = { page: 1, limit: 100 }, { rejectWithValue }) => {
    try {
      const res = await scheduleAPI.getMySchedules(params);
      const payload = res?.data?.data || res?.data || res;
      return payload?.items || payload || [];
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch schedules';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const createSchedule = createAsyncThunk(
  'schedule/create',
  async (scheduleData, { rejectWithValue }) => {
    try {
      await scheduleAPI.createSchedule(scheduleData);
      // Refetch schedules after creating
      const res = await scheduleAPI.getMySchedules();
      return res?.data?.data?.items || res?.data?.items || res?.data || res || [];
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to create schedule';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const updateScheduleThunk = createAsyncThunk(
  'schedule/update',
  async ({ scheduleId, data }, { rejectWithValue }) => {
    try {
      await scheduleAPI.updateSchedule(scheduleId, data);
      // Refetch schedules after updating
      const res = await scheduleAPI.getMySchedules();
      return res?.data?.data?.items || res?.data?.items || res?.data || res || [];
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to update schedule';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const deleteScheduleThunk = createAsyncThunk(
  'schedule/delete',
  async (scheduleId, { rejectWithValue }) => {
    try {
      await scheduleAPI.deleteSchedule(scheduleId);
      // Refetch schedules after deleting
      const res = await scheduleAPI.getMySchedules();
      return res?.data?.data?.items || res?.data?.items || res?.data || res || [];
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to delete schedule';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

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
    updateScheduleLocal: (state, action) => {
      const index = state.schedules.findIndex(schedule => schedule.id === action.payload.id);
      if (index !== -1) {
        state.schedules[index] = action.payload;
      }
    },
    setTemplates: (state, action) => {
      state.templates = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules = action.payload;
        state.error = null;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules = action.payload;
        state.error = null;
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateScheduleThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateScheduleThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules = action.payload;
        state.error = null;
      })
      .addCase(updateScheduleThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteScheduleThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteScheduleThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules = action.payload;
        state.error = null;
      })
      .addCase(deleteScheduleThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSchedules,
  setSelectedSchedule,
  addSchedule,
  updateScheduleLocal,
  setTemplates,
  clearError,
} = scheduleSlice.actions;
export default scheduleSlice.reducer;



















