/**
 * Core Types for ContentFlow SDK
 */

/**
 * Content map: contentId -> content string value
 */
export type ContentMap = Record<string, string>;

/**
 * Metadata for a content file
 */
export interface ContentMeta {
  appId: string;
  pageId: string;
  lang: string;
  version: number;
  updatedAt: string;
}

/**
 * Input help content configuration
 */
export interface InputHelpContent {
  enabled: boolean;
  message: string;
  iconType: 'info' | 'exclamation';
}

/**
 * Content file structure with metadata
 */
export interface ContentFile {
  $meta: ContentMeta;
  inputHelp?: Record<string, InputHelpContent>;
  [contentId: string]: string | ContentMeta | Record<string, InputHelpContent> | undefined;
}

/**
 * SDK initialization configuration
 */
export interface ContentFlowConfig {
  /**
   * Unique app identifier
   */
  appId: string;

  /**
   * Current language/locale (e.g., 'en-US', 'es-ES')
   */
  language: string;

  /**
   * Base URL for content storage (local dev: '/data', production: CDN URL)
   */
  storageUrl: string;

  /**
   * List of page IDs to eagerly fetch on initialization
   */
  pages: string[];
}

/**
 * Content loading status
 */
export type ContentStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Zustand store state shape
 */
export interface ContentStoreState {
  /**
   * SDK configuration
   */
  config: ContentFlowConfig | null;

  /**
   * Content maps keyed by pageId
   * e.g., { 'home': { 'hero-title': 'Welcome', ... }, 'about': { ... } }
   */
  contentMaps: Record<string, ContentMap>;

  /**
   * Input help configurations keyed by inputHelpId
   */
  inputHelp: Record<string, InputHelpContent>;

  /**
   * Loading status for each page
   */
  status: Record<string, ContentStatus>;

  /**
   * Error messages for failed fetches
   */
  errors: Record<string, string | null>;

  /**
   * Actions
   */
  initialize: (config: ContentFlowConfig) => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
  getContent: (pageId: string, contentId: string) => string | undefined;
  getInputHelp: (inputHelpId: string) => InputHelpContent | undefined;
  fetchPageContent: (pageId: string) => Promise<void>;
}
