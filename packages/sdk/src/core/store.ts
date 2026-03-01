import { create } from 'zustand';
import type { ContentFlowConfig, ContentStoreState, ContentMap } from '../types';
import { LocalJsonAdapter } from '../adapters/LocalJsonAdapter';

/**
 * Zustand store for content management
 */
export const useContentStore = create<ContentStoreState>((set, get) => ({
  config: null,
  contentMaps: {},
  status: {},
  errors: {},

  /**
   * Initialize SDK with configuration and eagerly fetch all page content
   */
  initialize: async (config: ContentFlowConfig) => {
    set({ config, contentMaps: {}, status: {}, errors: {} });

    // Eagerly fetch all pages in parallel
    const fetchPromises = config.pages.map((pageId) => get().fetchPageContent(pageId));

    await Promise.all(fetchPromises);
  },

  /**
   * Change language and refetch all pages
   */
  setLanguage: async (language: string) => {
    const { config } = get();
    if (!config) {
      console.error('[ContentFlow SDK] Cannot set language: SDK not initialized');
      return;
    }

    const newConfig = { ...config, language };
    set({ config: newConfig, contentMaps: {}, status: {}, errors: {} });

    // Refetch all pages with new language
    const fetchPromises = newConfig.pages.map((pageId) => get().fetchPageContent(pageId));

    await Promise.all(fetchPromises);
  },

  /**
   * Get content value for a specific page and contentId
   */
  getContent: (pageId: string, contentId: string) => {
    const { contentMaps } = get();
    return contentMaps[pageId]?.[contentId];
  },

  /**
   * Fetch content for a specific page
   */
  fetchPageContent: async (pageId: string) => {
    const { config } = get();
    if (!config) {
      console.error('[ContentFlow SDK] Cannot fetch content: SDK not initialized');
      return;
    }

    // Set loading status
    set((state) => ({
      status: { ...state.status, [pageId]: 'loading' },
      errors: { ...state.errors, [pageId]: null },
    }));

    try {
      const adapter = new LocalJsonAdapter(config.storageUrl);
      // Use new folder structure: appId/language/pageId.json
      const filename = `${config.appId}/${config.language}/${pageId}.json`;
      const contentMap: ContentMap = await adapter.read(filename);

      // Update content map
      set((state) => ({
        contentMaps: { ...state.contentMaps, [pageId]: contentMap },
        status: { ...state.status, [pageId]: 'loaded' },
        errors: { ...state.errors, [pageId]: null },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ContentFlow SDK] Failed to fetch content for page: ${pageId}`, error);

      set((state) => ({
        status: { ...state.status, [pageId]: 'error' },
        errors: { ...state.errors, [pageId]: errorMessage },
      }));
    }
  },
}));
