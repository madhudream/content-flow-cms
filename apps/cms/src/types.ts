// CMS App Type Definitions

export interface Page {
  id: string;
  name: string;
  previewPath: string;
}

export interface App {
  id: string;
  name: string;
  description: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  basePath: string;
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

export interface InputHelpContent {
  enabled: boolean;
  message: string;
  iconType: 'info' | 'exclamation';
}

export interface ContentFile {
  $meta: ContentMeta;
  inputHelp?: Record<string, InputHelpContent>;
  [key: string]: string | ContentMeta | Record<string, InputHelpContent> | undefined;
}

export type ContentMap = Record<string, string>;

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';
