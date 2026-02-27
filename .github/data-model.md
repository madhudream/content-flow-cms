# Data Model: ContentFlow CMS

**Feature**: 001-contentflow-cms  
**Date**: 2026-02-27

---

## Core Types (TypeScript — `packages/sdk/src/types.ts`)

```typescript
/** Flat map of contentId → string value (text or image URL) */
export type ContentMap = Record<string, string>;

/** Extended entry for richer storage (used in CMS, stored in JSON $meta) */
export interface ContentEntry {
  contentId: string;
  value: string;
  type: 'text' | 'image';
  updatedAt: string; // ISO 8601
}

/** File stored at data/{appId}-{pageId}-{lang}.json */
export interface ContentFile {
  $meta: {
    appId: string;
    pageId: string;
    lang: string;
    version: number;
    updatedAt: string;
  };
  [contentId: string]: string; // flat content entries (excluding $meta)
}

/** SDK initialization options */
export interface ContentFlowConfig {
  appId: string;
  language: string;         // e.g. "en-US"
  storageUrl: string;       // base URL to data/ folder or CDN
  pages: string[];          // page IDs to prefetch
}

/** Storage adapter contract */
export interface IContentStorage {
  read(appId: string, pageId: string, lang: string): Promise<ContentMap>;
  write(appId: string, pageId: string, lang: string, data: ContentMap): Promise<void>;
}
```

---

## App Registry (`data/apps.config.json`)

```typescript
interface AppConfig {
  id: string;           // unique, kebab-case
  name: string;
  description: string;
  defaultLanguage: string;
  pages: PageConfig[];
}

interface PageConfig {
  id: string;           // unique within app, kebab-case
  name: string;         // display name
  previewPort: number;  // local dev port of consuming app
  previewPath?: string; // default "/" 
}
```

---

## Form Page Metadata (`apps/bwo-tax-forms/src/metadata/*.json`)

```typescript
interface FormPageMeta {
  pageId: string;
  title: string;
  titleContentId: string;
  layout: 'single-column' | 'two-column';
  sections: FormSection[];
}

interface FormSection {
  id: string;
  title: string;
  titleContentId: string;
  fields: FormField[];
}

type FieldType = 'text' | 'password' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'number';

interface FormField {
  id: string;
  type: FieldType;
  contentId: string;        // maps to ContentComponent contentId
  label: string;            // defaultText fallback
  required?: boolean;
  placeholder?: string;
  placeholderContentId?: string;
  options?: { value: string; label: string }[];  // for select/radio
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    customMessage?: string;
    customMessageContentId?: string;
  };
}
```

---

## Zustand Store Shape (`packages/sdk/src/core/store.ts`)

```typescript
interface ContentFlowStore {
  // State
  config: ContentFlowConfig | null;
  contentMaps: Record<string, ContentMap>; // key: "{appId}-{pageId}-{lang}"
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: (config: ContentFlowConfig) => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
  getContent: (pageId: string, contentId: string) => string | undefined;
}
```

---

## RTK Store Shape (CMS — `apps/cms/src/app/store.ts`)

```typescript
// appsSlice
interface AppsState {
  apps: AppConfig[];
  selectedAppId: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

// pagesSlice
interface PagesState {
  selectedPageId: string | null;
}

// editorSlice
interface EditorState {
  selectedContentId: string | null;
  contentMap: ContentMap;       // current page's content for selected lang
  dirtyEntries: Set<string>;    // contentIds with unsaved changes
  isSaving: boolean;
}

// languageSlice
interface LanguageState {
  current: string;              // e.g. "en-US"
  supported: string[];
}
```

---

## CMS ↔ Consuming App postMessage Protocol

```typescript
// CMS → iframe (inject highlight mode)
interface CMSInitMessage {
  type: 'CONTENTFLOW_CMS_INIT';
  mode: 'highlight';
}

// iframe → CMS (user clicked element)
interface ContentClickMessage {
  type: 'CONTENTFLOW_CONTENT_CLICK';
  contentId: string;
  currentValue: string;
  elementType: 'text' | 'image';
  rect: { top: number; left: number; width: number; height: number };
}

// CMS → iframe (preview updated value)
interface ContentPreviewMessage {
  type: 'CONTENTFLOW_PREVIEW_UPDATE';
  contentId: string;
  value: string;
}
```
