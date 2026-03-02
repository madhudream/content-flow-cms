import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { ContentFile, ContentMap, SaveStatus } from '../types';
import type { RootState } from './store';

interface InputHelpContent {
  enabled: boolean;
  message: string;
  iconType: 'info' | 'exclamation';
}

interface ContentState {
  contentCache: Record<string, ContentMap>; // Key: "{appId}-{pageId}-{lang}"
  inputHelpCache: Record<string, Record<string, InputHelpContent>>; // Key: "{appId}-{pageId}-{lang}"
  dirtyContent: Record<string, string>; // Key: contentId, Value: edited text or image URL
  dirtyInputHelp: Record<string, InputHelpContent>; // Key: inputHelpId, Value: help content
  saveStatus: SaveStatus;
  error: string | null;
}

const initialState: ContentState = {
  contentCache: {},
  inputHelpCache: {},
  dirtyContent: {},
  dirtyInputHelp: {},
  saveStatus: 'idle',
  error: null,
};

// Thunk to fetch content for a specific page
export const fetchContent = createAsyncThunk(
  'content/fetchContent',
  async (params: { appId: string; pageId: string; lang: string }) => {
    const { appId, pageId, lang } = params;
    const filename = `${appId}-${pageId}-${lang}.json`;
    const response = await fetch(`/api/content/${filename}`);
    
    if (!response.ok) {
      // Return empty content for 404 (file doesn't exist yet)
      if (response.status === 404) {
        return { key: `${appId}-${pageId}-${lang}`, content: {}, inputHelp: {} };
      }
      throw new Error(`Failed to fetch content: ${response.statusText}`);
    }
    
    const data: ContentFile = await response.json();
    // Strip $meta and inputHelp before storing in content cache
    const { $meta, inputHelp, ...content } = data;
    
    // Extract inputHelp data (type is already Record<string, InputHelpContent> | undefined)
    const inputHelpData = inputHelp || {};
    
    return { 
      key: `${appId}-${pageId}-${lang}`, 
      content: content as ContentMap,
      inputHelp: inputHelpData
    };
  }
);

// Thunk to save content to the server
export const saveContent = createAsyncThunk(
  'content/saveContent',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { selectedAppId, selectedPageId, selectedLanguage } = state.ui;
    const { contentCache, dirtyContent } = state.content;
    
    if (!selectedAppId || !selectedPageId) {
      throw new Error('No app or page selected');
    }
    
    const key = `${selectedAppId}-${selectedPageId}-${selectedLanguage}`;
    const existingContent = contentCache[key] || {};
    
    // Merge dirty content with existing content
    const updatedContent: ContentMap = {
      ...existingContent,
      ...dirtyContent,
    };
    
    const filename = `${selectedAppId}-${selectedPageId}-${selectedLanguage}.json`;
    const payload: Partial<ContentFile> = {
      $meta: {
        appId: selectedAppId,
        pageId: selectedPageId,
        lang: selectedLanguage,
        version: 1, // Server will auto-increment
        updatedAt: new Date().toISOString(),
      },
      ...updatedContent,
    };
    
    const response = await fetch(`/api/content/${filename}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to save content: ${error}`);
    }
    
    const savedData: ContentFile = await response.json();
    const { $meta, inputHelp, ...content } = savedData;
    const inputHelpData = inputHelp || {};
    return { key, content: content as ContentMap, inputHelp: inputHelpData };
  }
);

// Thunk to save input help to the server
export const saveInputHelp = createAsyncThunk(
  'content/saveInputHelp',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { selectedAppId, selectedPageId, selectedLanguage } = state.ui;
    const { contentCache, inputHelpCache, dirtyInputHelp } = state.content;
    
    if (!selectedAppId || !selectedPageId) {
      throw new Error('No app or page selected');
    }
    
    const key = `${selectedAppId}-${selectedPageId}-${selectedLanguage}`;
    const existingContent = contentCache[key] || {};
    const existingInputHelp = inputHelpCache[key] || {};
    
    // Merge dirty input help with existing input help
    const updatedInputHelp: Record<string, InputHelpContent> = {
      ...existingInputHelp,
      ...dirtyInputHelp,
    };
    
    const filename = `${selectedAppId}-${selectedPageId}-${selectedLanguage}.json`;
    const payload: ContentFile = {
      $meta: {
        appId: selectedAppId,
        pageId: selectedPageId,
        lang: selectedLanguage,
        version: 1, // Server will auto-increment
        updatedAt: new Date().toISOString(),
      },
      inputHelp: updatedInputHelp,
      ...existingContent,
    };
    
    const response = await fetch(`/api/content/${filename}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to save input help: ${error}`);
    }
    
    const savedData: ContentFile = await response.json();
    const { $meta, inputHelp, ...content } = savedData;
    const inputHelpData = inputHelp || {};
    return { key, content: content as ContentMap, inputHelp: inputHelpData };
  }
);

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    updateDirtyContent: (state, action: PayloadAction<{ contentId: string; value: string }>) => {
      const { contentId, value } = action.payload;
      state.dirtyContent[contentId] = value;
    },
    clearDirtyContent: (state) => {
      state.dirtyContent = {};
    },
    updateInputHelpContent: (state, action: PayloadAction<{ inputHelpId: string; value: InputHelpContent }>) => {
      const { inputHelpId, value } = action.payload;
      state.dirtyInputHelp[inputHelpId] = value;
    },
    clearDirtyInputHelp: (state) => {
      state.dirtyInputHelp = {};
    },
    resetSaveStatus: (state) => {
      state.saveStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch content
      .addCase(fetchContent.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchContent.fulfilled, (state, action) => {
        const { key, content, inputHelp } = action.payload;
        state.contentCache[key] = content;
        state.inputHelpCache[key] = inputHelp;
      })
      .addCase(fetchContent.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to load content';
      })
      // Save content
      .addCase(saveContent.pending, (state) => {
        state.saveStatus = 'saving';
        state.error = null;
      })
      .addCase(saveContent.fulfilled, (state, action) => {
        const { key, content, inputHelp } = action.payload;
        state.saveStatus = 'success';
        state.contentCache[key] = content;
        state.inputHelpCache[key] = inputHelp;
        state.dirtyContent = {}; // Clear dirty content after successful save
      })
      .addCase(saveContent.rejected, (state, action) => {
        state.saveStatus = 'error';
        state.error = action.error.message || 'Failed to save content';
      })
      // Save input help
      .addCase(saveInputHelp.pending, (state) => {
        state.saveStatus = 'saving';
        state.error = null;
      })
      .addCase(saveInputHelp.fulfilled, (state, action) => {
        const { key, content, inputHelp } = action.payload;
        state.saveStatus = 'success';
        state.contentCache[key] = content;
        state.inputHelpCache[key] = inputHelp;
        state.dirtyInputHelp = {}; // Clear dirty input help after successful save
      })
      .addCase(saveInputHelp.rejected, (state, action) => {
        state.saveStatus = 'error';
        state.error = action.error.message || 'Failed to save input help';
      });
  },
});

export const { updateDirtyContent, clearDirtyContent, updateInputHelpContent, clearDirtyInputHelp, resetSaveStatus } = contentSlice.actions;

export default contentSlice.reducer;
