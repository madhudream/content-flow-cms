import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { AppsConfig } from '../types';

interface AppsState {
  apps: AppsConfig['apps'];
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}

const initialState: AppsState = {
  apps: [],
  status: 'idle',
  error: null,
};

// Thunk to fetch apps.config.json from the server
export const fetchApps = createAsyncThunk('apps/fetchApps', async () => {
  const response = await fetch('/api/apps');
  if (!response.ok) {
    throw new Error(`Failed to fetch apps config: ${response.statusText}`);
  }
  const data: AppsConfig = await response.json();
  
  // Add basePath to each app based on app ID
  const appsWithBasePath = data.apps.map((app) => {
    let basePath = '';
    
    // Map app IDs to URL paths
    if (app.id === 'bwo-taxforms') {
      basePath = `${window.location.protocol}//${window.location.host}/bwo`;
    } else if (app.id === 'demo') {
      basePath = `${window.location.protocol}//${window.location.host}/demo`;
    } else if (app.id === 'customer-portal') {
      basePath = `${window.location.protocol}//${window.location.host}/portal`;
    } else {
      basePath = `${window.location.protocol}//${window.location.host}`;
    }
    
    return {
      ...app,
      basePath,
    };
  });
  
  return appsWithBasePath;
});

const appsSlice = createSlice({
  name: 'apps',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApps.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchApps.fulfilled, (state, action: PayloadAction<AppsConfig['apps']>) => {
        state.status = 'success';
        state.apps = action.payload;
      })
      .addCase(fetchApps.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Failed to load apps';
      });
  },
});

export default appsSlice.reducer;
