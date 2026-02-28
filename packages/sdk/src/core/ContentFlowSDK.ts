import type { ContentFlowConfig } from '../types';
import { useContentStore } from './store';

/**
 * ContentFlow SDK - Main entry point
 */
export class ContentFlowSDK {
  private static initialized = false;

  /**
   * Initialize the SDK with configuration
   * Eagerly fetches all page content files in parallel
   *
   * @param config - SDK configuration
   * @example
   * ```ts
   * await ContentFlowSDK.initialize({
   *   appId: 'demo',
   *   language: 'en-US',
   *   storageUrl: '/data',
   *   pages: ['home', 'about', 'contact']
   * });
   * ```
   */
  static async initialize(config: ContentFlowConfig): Promise<void> {
    if (this.initialized) {
      console.warn('[ContentFlow SDK] SDK already initialized. Skipping.');
      return;
    }

    try {
      await useContentStore.getState().initialize(config);
      this.initialized = true;
      console.log('[ContentFlow SDK] Initialized successfully', config);
    } catch (error) {
      console.error('[ContentFlow SDK] Initialization failed', error);
      throw error;
    }
  }

  /**
   * Change the current language
   * Refetches all page content with the new language
   *
   * @param language - New language code (e.g., 'es-ES')
   */
  static async setLanguage(language: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('[ContentFlow SDK] Cannot set language: SDK not initialized');
    }

    await useContentStore.getState().setLanguage(language);
  }

  /**
   * Get the current configuration
   */
  static getConfig(): ContentFlowConfig | null {
    return useContentStore.getState().config;
  }

  /**
   * Get content value for a specific page and contentId
   */
  static getContent(pageId: string, contentId: string): string | undefined {
    return useContentStore.getState().getContent(pageId, contentId);
  }
}
