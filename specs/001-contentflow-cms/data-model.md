# Data Model: ContentFlow CMS

**Phase**: 1 (Design & Contracts)  
**Date**: 2026-02-27  
**Status**: Complete

## Overview

This document defines all entities, their fields, relationships, validation rules, and state transitions for the ContentFlow CMS system.

---

## Core Entities

### 1. App

**Description**: A registered consuming application that uses the ContentFlow SDK.

**Schema**:
```typescript
interface App {
  id: string;              // Unique identifier (e.g., "demo", "bwo-taxforms")
  name: string;            // Display name (e.g., "Demo App", "BWO Tax Forms")
  description: string;     // Brief description for CMS dashboard
  baseUrl: string;         // Base URL for preview (e.g., "http://localhost:3002")
  pages: Page[];           // Array of pages in this app
  defaultLanguage: string; // Default locale (e.g., "en-US")
}
```

**Validation Rules**:
- `id`: Required, lowercase alphanumeric + hyphens only, 3-50 chars, unique across all apps
- `name`: Required, 1-100 chars
- `description`: Required, 1-500 chars
- `baseUrl`: Required, valid HTTP/HTTPS URL
- `pages`: Required, minimum 1 page
- `defaultLanguage`: Required, valid BCP 47 language tag (e.g., "en-US", "es-ES")

**Storage**: `data/apps.config.json`

**Example**:
```json
{
  "id": "demo",
  "name": "Demo App",
  "description": "Simple React demo application showcasing ContentFlow SDK",
  "baseUrl": "http://localhost:3002",
  "pages": [
    { "id": "home", "name": "Home", "path": "/home" },
    { "id": "about", "name": "About", "path": "/about" },
    { "id": "contact", "name": "Contact", "path": "/contact" }
  ],
  "defaultLanguage": "en-US"
}
```

---

### 2. Page

**Description**: A single page/route within a consuming application.

**Schema**:
```typescript
interface Page {
  id: string;         // Unique within app (e.g., "home", "personal-info")
  name: string;       // Display name (e.g., "Home Page")
  path: string;       // Route path (e.g., "/home", "/about")
}
```

**Validation Rules**:
- `id`: Required, lowercase alphanumeric + hyphens only, 3-50 chars, unique within app
- `name`: Required, 1-100 chars
- `path`: Required, valid URL path starting with `/`, 1-200 chars

**Computed Properties**:
- `previewUrl`: Derived from App's `baseUrl` + Page's `path` + `?cms-mode=true`
  - Example: `http://localhost:3002/home?cms-mode=true`

**Example**:
```json
{
  "id": "home",
  "name": "Home Page",
  "path": "/home"
}
```

---

### 3. ContentMap

**Description**: Flat key-value map of all editable content for a specific app, page, and locale.

**Schema**:
```typescript
/** Flat map of contentId → string value (text or image URL) */
export type ContentMap = Record<string, string>;

/** File stored at data/{appId}-{pageId}-{lang}.json */
export interface ContentFile {
  $meta: {
    appId: string;
    pageId: string;
    lang: string;
    version: number;
    updatedAt: string;  // ISO 8601 timestamp
  };
  [contentId: string]: string; // flat content entries (excluding $meta)
}
```

**File Storage Format**:
Filename: `{appId}-{pageId}-{lang}.json`  
Example: `demo-home-en-US.json`

```json
{
  "$meta": {
    "appId": "demo",
    "pageId": "home",
    "lang": "en-US",
    "version": 1,
    "updatedAt": "2026-02-27T10:30:00Z"
  },
  "hero-title": "Welcome to ContentFlow",
  "hero-subtitle": "Edit content without touching code",
  "cta-button": "Get Started",
  "hero-image": "/data/images/demo-hero-image-1709035800.jpg"
}
```

**Validation Rules**:
- `contentId` keys: Required, kebab-case, 3-100 chars, must match `^[a-z0-9-]+$`
- Values: Required, strings only (URLs for image type), 0-10,000 chars
- `$meta`: Reserved key for file metadata, not editable content
- `$meta.appId`: Must match filename `{appId}`
- `$meta.pageId`: Must match filename `{pageId}`
- `$meta.lang`: Must match filename `{lang}`
- `$meta.version`: Integer, increments on each save
- `$meta.updatedAt`: ISO 8601 timestamp, updated on each save

**State Transitions**:
1. **Not Exists** → **Created**: First save for a page/locale creates file with `version: 1`
2. **Created** → **Updated**: Subsequent saves increment `version`, update `updatedAt`
3. **Updated** → **Deleted**: Manual file deletion (not supported in CMS Phase 1)

---

### 4. ContentEntry (Transient)

**Description**: A single piece of editable content (transient object in CMS editor, not persisted separately).

**Schema**:
```typescript
interface ContentEntry {
  contentId: string;       // Unique within page (e.g., "hero-title")
  value: string;           // Current value (text or URL)
  type: 'text' | 'image';  // Content type
  updatedAt?: string;      // ISO 8601 timestamp (optional, for editor UI)
}
```

**Validation Rules**:
- `contentId`: Same as ContentMap key validation
- `value`: Non-empty for text, valid URL for image (client-side validation only)
- `type`: Must be either `'text'` or `'image'`

**Note**: Ephemeral object in CMS state; serialized into ContentMap on save.

---

### 5. FormPageMeta (BWO Tax Forms Specific)

**Description**: Metadata schema for BWO Tax Forms app describing form fields and layout.

**Schema**:
```typescript
interface FormPageMeta {
  pageId: string;                  // Matches Page.id (e.g., "personal-info")
  title: string;                   // Page title (e.g., "Personal Information")
  sections: FormSection[];         // Array of form sections
}

interface FormSection {
  id: string;                      // Section unique ID (e.g., "name-section")
  title: string;                   // Section heading (e.g., "Full Name")
  fields: FormField[];             // Array of fields in this section
}

interface FormField {
  id: string;                      // Field unique ID (e.g., "first-name")
  type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea';
  label: string;                   // Plain text label (fallback)
  contentId?: string;              // Optional: content-id for editable label
  placeholder?: string;            // Optional placeholder text
  required?: boolean;              // Whether field is required
  validation?: FieldValidation;    // Optional validation rules
  options?: SelectOption[];        // For type='select' only
}

interface FieldValidation {
  pattern?: string;                // Regex pattern for input validation
  minLength?: number;              // Minimum length
  maxLength?: number;              // Maximum length
  min?: number;                    // Minimum value (for type='number')
  max?: number;                    // Maximum value (for type='number')
  errorMessage?: string;           // Custom error message
}

interface SelectOption {
  value: string;                   // Option value
  label: string;                   // Option display label
}
```

**File Storage**:
Location: `apps/bwo-tax-forms/src/metadata/{pageId}.json`  

**Validation Rules**:
- `pageId`: Must match a registered Page.id in BWO Tax Forms app
- `fields[].contentId`: If provided, must be used with `<ContentComponent>` for label rendering
- `fields[].options`: Required if `type === 'select'`, otherwise forbidden
- `validation.pattern`: Must be valid JavaScript regex string

---

## SDK Entities

### 6. ContentFlowConfig

**Description**: SDK initialization options.

**Schema**:
```typescript
export interface ContentFlowConfig {
  appId: string;          // E.g., "demo", "bwo-taxforms"
  language: string;       // E.g., "en-US", "es-ES"
  storageUrl: string;     // Base URL to data/ folder or CDN
  pages: string[];        // Page IDs to eagerly fetch
}
```

**Example**:
```typescript
await ContentFlowSDK.initialize({
  appId: 'demo',
  language: 'en-US',
  storageUrl: '/data',
  pages: ['home', 'about', 'contact']
});
```

---

### 7. IContentStorage (Interface)

**Description**: Storage abstraction interface for content read/write operations.

**Schema**:
```typescript
export interface IContentStorage {
  /**
   * Read a content JSON file from storage.
   * @param path Relative path like "demo-home-en-US.json"
   * @returns Promise resolving to flat ContentMap object (without $meta)
   */
  read(path: string): Promise<ContentMap>;

  /**
   * Write a content JSON file to storage.
   * @param path Relative path like "demo-home-en-US.json"
   * @param data Flat ContentMap object
   */
  write(path: string, data: ContentMap): Promise<void>;
}
```

**Implementations**:
- **LocalJsonAdapter** (Phase 1): Fetches from Node.js server
- **AzureBlobAdapter** (Phase 2): Reads/writes to Azure Blob Storage

---

### 8. SDKStore (Zustand)

**Description**: SDK lightweight reactive store for content resolution.

**Schema**:
```typescript
interface ContentFlowStore {
  // State
  config: ContentFlowConfig | null;
  contentMaps: Record<string, ContentMap>; // key: "{appId}-{pageId}-{lang}"
  status: 'loading' | 'ready' | 'error';
  
  // Actions
  initialize: (config: ContentFlowConfig) => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
  getContent: (pageId: string, contentId: string) => string | undefined;
}
```

**State Transitions**:
1. **Initial**: `{ config: null, contentMaps: {}, status: 'loading' }`
2. **Fetching**: `initialize()` called → `status: 'loading'`, fetch all page content files
3. **Fetch Success**: All content loaded → `contentMaps` populated, `status: 'ready'`
4. **Fetch Partial Fail**: Some files 404 → continue with available content, `status: 'ready'`
5. **Fetch Total Fail**: All files error → `status: 'error'`, `contentMaps` empty (fallback to defaults)

---

## CMS State Entities (Redux Toolkit)

### 9. AppsState

**Schema**:
```typescript
interface AppsState {
  apps: App[];
  selectedAppId: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}
```

---

### 10. UIState

**Schema**:
```typescript
interface UIState {
  selectedPageId: string | null;
  selectedLanguage: string;          // Default: "en-US"
  editorPanelOpen: boolean;
  activeContentId: string | null;
  previewMode: 'desktop' | 'mobile';
}
```

---

### 11. ContentState

**Schema**:
```typescript
interface ContentState {
  // Key: "{appId}-{pageId}-{lang}" → ContentMap
  contentCache: Record<string, ContentMap>;
  
  // Dirty state: tracks unsaved changes
  dirtyContent: Record<string, string>; // { [contentId]: newValue }
  
  // Save operation status
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  saveError: string | null;
}
```

**State Transitions**:
1. **Initial**: `{ contentCache: {}, dirtyContent: {}, saveStatus: 'idle', saveError: null }`
2. **Content Loaded**: Fetch content file → stored in `contentCache`
3. **User Edits**: Type in editor → `dirtyContent[contentId] = newValue`
4. **Save Initiated**: Click Save → `saveStatus: 'saving'`
5. **Save Success**: Server 200 → `saveStatus: 'success'`, clear `dirtyContent`, update `contentCache`
6. **Save Failure**: Server error → `saveStatus: 'error'`, set `saveError`, retain `dirtyContent`

---

## PostMessage Protocol Entities

### 12. CMSInitMessage

**Description**: CMS → Consuming App iframe on load.

**Schema**:
```typescript
interface CMSInitMessage {
  type: 'CONTENTFLOW_CMS_INIT';
  appId: string;
  pageId: string;
  language: string;
}
```

**Expected Response** (within 3 seconds):
```typescript
interface CMSAckMessage {
  type: 'CONTENTFLOW_CMS_ACK';
  appId: string;
  pageId: string;
}
```

---

### 13. ContentClickMessage

**Description**: Consuming App → CMS when user clicks editable element.

**Schema**:
```typescript
interface ContentClickMessage {
  type: 'CONTENTFLOW_CONTENT_CLICK';
  contentId: string;
  currentValue: string;
  elementType: 'text' | 'image';
}
```

---

### 14. PreviewUpdateMessage

**Description**: CMS → Consuming App for live preview updates.

**Schema**:
```typescript
interface PreviewUpdateMessage {
  type: 'CONTENTFLOW_PREVIEW_UPDATE';
  contentId: string;
  newValue: string;
}
```

---

## File System Structure

### Content Files

**Location**: `data/`  
**Naming Convention**: `{appId}-{pageId}-{lang}.json`

**Examples**:
- `demo-home-en-US.json`
- `demo-home-es-ES.json`
- `bwo-taxforms-personal-info-en-US.json`

### Image Files

**Location**: `data/images/`  
**Naming Convention**: `{appId}-{contentId}-{timestamp}.{ext}`

**Examples**:
- `demo-hero-image-1709035800.jpg`
- `bwo-taxforms-logo-1709036000.png`

**Constraints**:
- Max file size: 5MB
- Allowed extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`, `.webp`
- Timestamp: Unix epoch in seconds

---

## Entity Relationship Diagram (Textual)

```
App (1) ──< (N) Page
App (1) ──< (N) ContentMap
Page (N) ──> (1) App
Page (1) ──< (N) ContentMap
ContentMap (N) ──> (1) App
ContentMap (N) ──> (1) Page
ContentMap (N) ──> (1) Language

FormPageMeta (1) ──> (1) Page (BWO Tax Forms only)
FormField (N) ──> (0..1) ContentMap.contentId (optional reference)

UIState → selectedAppId references App.id
UIState → selectedPageId references Page.id
UIState → activeContentId references ContentMap key

ContentState.contentCache key = "{App.id}-{Page.id}-{Language}"
ContentState.dirtyContent key = ContentMap key (contentId)

SDKStore.contentMaps key = "{appId}-{pageId}-{lang}"
SDKStore.contentMaps value = ContentMap
```

---

## Phase 1 Data Model Conclusion

All entities defined with schemas, validation rules, relationships, and state transitions. Proceed to **Contracts** definition.
