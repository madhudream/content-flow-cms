// CMS App Type Definitions

export interface Page {
  id: string;
  name: string;
  previewPort: number;
  previewPath: string;
}

export interface App {
  id: string;
  name: string;
  description: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  pages: Page[];
}

export interface AppsConfig {
  apps: App[];
}

export interface ContentMeta {
  appId: string;
  pageId: string;
  lang: string;
  version: number;
  updatedAt: string;
}

export interface ContentFile {
  $meta: ContentMeta;
  [key: string]: string | ContentMeta; // Content key-value pairs
}

export type ContentMap = Record<string, string>;

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';
