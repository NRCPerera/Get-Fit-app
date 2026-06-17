import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { medicalAPI } from '../../api/medical.api';

const initialState = {
  form: null,
  loading: false,
  error: null,
};

export const fetchMedicalForm = createAsyncThunk(
  'medical/fetchForm',
  async (_, { rejectWithValue }) => {
    try {
      const res = await medicalAPI.getMedicalForm();
      const payload = res?.data || res;
      return payload;
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch medical form';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const updateMedicalForm = createAsyncThunk(
  'medical/update',
  async (data, { rejectWithValue }) => {
    try {
      await medicalAPI.updateMedicalForm(data);
      // Fetch fresh form data after update
      const res = await medicalAPI.getMedicalForm();
      return res?.data || res;
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to update medical form';
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

const medicalSlice = createSlice({
  name: 'medical',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedicalForm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMedicalForm.fulfilled, (state, action) => {
        state.loading = false;
        state.form = action.payload;
        state.error = null;
      })
      .addCase(fetchMedicalForm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateMedicalForm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMedicalForm.fulfilled, (state, action) => {
        state.loading = false;
        state.form = action.payload;
        state.error = null;
      })
      .addCase(updateMedicalForm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = medicalSlice.actions;
export default medicalSlice.reducer;
