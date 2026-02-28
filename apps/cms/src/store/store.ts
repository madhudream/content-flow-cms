import { configureStore } from '@reduxjs/toolkit';
import appsReducer from './appsSlice';
import uiReducer from './uiSlice';
import contentReducer from './contentSlice';

export const store = configureStore({
  reducer: {
    apps: appsReducer,
    ui: uiReducer,
    content: contentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
