import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  selectedAppId: string | null;
  selectedPageId: string | null;
  selectedLanguage: string;
  selectedContentId: string | null;
  editorPanelOpen: boolean;
  viewportMode: 'desktop' | 'mobile';
  elementType: 'text' | 'image';
}

const initialState: UiState = {
  selectedAppId: null,
  selectedPageId: null,
  selectedLanguage: 'en-US',
  selectedContentId: null,
  editorPanelOpen: false,
  viewportMode: 'desktop',
  elementType: 'text',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    selectApp: (state, action: PayloadAction<string>) => {
      state.selectedAppId = action.payload;
      state.selectedPageId = null; // Reset page when app changes
      state.selectedContentId = null;
      state.editorPanelOpen = false;
    },
    selectPage: (state, action: PayloadAction<string>) => {
      state.selectedPageId = action.payload;
      state.selectedContentId = null;
      state.editorPanelOpen = false;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.selectedLanguage = action.payload;
    },
    openEditor: (state, action: PayloadAction<{ contentId: string; elementType?: 'text' | 'image' }>) => {
      state.selectedContentId = action.payload.contentId;
      state.elementType = action.payload.elementType || 'text';
      state.editorPanelOpen = true;
    },
    closeEditor: (state) => {
      state.selectedContentId = null;
      state.editorPanelOpen = false;
    },
    setViewportMode: (state, action: PayloadAction<'desktop' | 'mobile'>) => {
      state.viewportMode = action.payload;
    },
  },
});

export const {
  selectApp,
  selectPage,
  setLanguage,
  openEditor,
  closeEditor,
  setViewportMode,
} = uiSlice.actions;

export default uiSlice.reducer;
