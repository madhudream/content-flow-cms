# SDK Public API Contract

**Package**: `@contentflow/sdk`  
**Version**: 1.0.0  
**Status**: Phase 1  
**Date**: 2026-02-27

---

## Purpose

This contract defines the public API surface of the ContentFlow SDK. Consuming applications (React, Angular, vanilla JS) use these APIs to integrate editable content functionality.

**Breaking Change Policy**: Once published, this API is under semantic versioning. Breaking changes require a major version bump.

---

## Core SDK API

### `ContentFlowSDK.initialize(config: ContentFlowConfig): Promise<void>`

**Description**: Initialize the SDK with app configuration and eagerly fetch all registered page content files.

**Parameters**:
```typescript
interface ContentFlowConfig {
  appId: string;          // Application ID (must match registered app in apps.config.json)
  language: string;       // BCP 47 language tag (e.g., "en-US", "es-ES")
  storageUrl: string;     // Base URL for content files (e.g., "/data" or CDN URL)
  pages: string[];        // Array of page IDs to eagerly fetch
}
```

**Returns**: `Promise<void>` — Resolves when all content files are fetched (or fails gracefully).

**Throws**: Does not throw. Logs errors to console and continues with empty content maps on failure.

**Example**:
```typescript
import { ContentFlowSDK } from '@contentflow/sdk';

await ContentFlowSDK.initialize({
  appId: 'demo',
  language: 'en-US',
  storageUrl: '/data',
  pages: ['home', 'about', 'contact']
});
```

**Side Effects**:
- Fetches `{appId}-{pageId}-{lang}.json` for each page in `pages` array
- Populates internal Zustand store with content maps
- Sets SDK status to `'ready'` or `'error'`

**Idempotency**: Can be called multiple times. Subsequent calls reinitialize the SDK and refetch content.

---

### `ContentFlowSDK.setLanguage(language: string): Promise<void>`

**Description**: Switch the current language and refetch all content files for the new locale.

**Parameters**:
- `language` (string): BCP 47 language tag (e.g., "es-ES")

**Returns**: `Promise<void>` — Resolves when all content files for the new language are fetched.

**Example**:
```typescript
await ContentFlowSDK.setLanguage('es-ES');
```

**Side Effects**:
- Clears existing content maps
- Fetches `{appId}-{pageId}-{newLang}.json` for all registered pages
- Updates internal Zustand store
- Triggers re-render of all `<ContentComponent>` instances

---

### `ContentFlowSDK.getContent(pageId: string, contentId: string): string | undefined`

**Description**: Retrieve content value for a specific page and content ID.

**Parameters**:
- `pageId` (string): Page identifier
- `contentId` (string): Content identifier (kebab-case)

**Returns**: Content value (string) or `undefined` if not found.

**Example**:
```typescript
const heroTitle = ContentFlowSDK.getContent('home', 'hero-title');
// Returns "Welcome to ContentFlow" or undefined
```

**Note**: Most consumers will use React hooks or Web Components instead of calling this directly.

---

## React Adapter API

**Import**: `@contentflow/sdk/react`

### `<ContentComponent>` Component

**Description**: React component for rendering editable text or image content.

**Props**:
```typescript
interface ContentComponentProps {
  contentId: string;           // Required: unique content identifier
  defaultText?: string;        // Required for text: fallback content
  defaultSrc?: string;         // Required for type='image': fallback image URL
  type?: 'text' | 'image';     // Optional: defaults to 'text'
  alt?: string;                // Optional: alt text for images
  className?: string;          // Optional: CSS classes for styling
  
  // Additional HTML attributes
  [key: string]: any;          // Pass-through for data-*, aria-*, etc.
}
```

**Returns**: React element (`<span>` for text, `<img>` for image).

**Behavior**:
1. Reads content from SDK store via `useContent(contentId)` hook
2. Renders `defaultText` or `defaultSrc` if content not found in store
3. Automatically includes `data-content-id={contentId}` attribute for CMS discovery
4. Re-renders when content changes in store (language switch, live preview update)

**Examples**:

**Text Content**:
```tsx
import { ContentComponent } from '@contentflow/sdk/react';

<ContentComponent 
  contentId="hero-title" 
  defaultText="Welcome to ContentFlow"
  className="text-4xl font-bold"
  data-content-id="hero-title"  // Required for CMS
/>
```

**Image Content**:
```tsx
<ContentComponent 
  contentId="hero-image"
  type="image"
  defaultSrc="/images/default-hero.jpg"
  alt="Hero banner"
  className="w-full h-64 object-cover"
  data-content-id="hero-image"  // Required for CMS
/>
```

**Constraints**:
- MUST provide either `defaultText` (for text) or `defaultSrc` (for image)
- MUST include `data-content-id` attribute for CMS highlight functionality
- Content ID MUST be unique within the page

---

### `useContent(contentId: string): string | undefined` Hook

**Description**: React hook for accessing content value from SDK store.

**Parameters**:
- `contentId` (string): Content identifier

**Returns**: Content value (string) or `undefined`.

**Example**:
```typescript
import { useContent } from '@contentflow/sdk/react';

function HeroSection() {
  const title = useContent('hero-title');
  return <h1>{title ?? 'Default Title'}</h1>;
}
```

**Note**: Most consumers should use `<ContentComponent>` instead, which handles default text automatically.

---

## Web Component API

**Import**: `@contentflow/sdk/webcomponent`

### `<content-component>` Custom Element

**Description**: Framework-agnostic Web Component for editable content (for Angular, Vue, or vanilla JS).

**Attributes**:
- `content-id` (required): Content identifier (kebab-case)
- `default-text` (required for text): Fallback text
- `default-src` (required for type='image'): Fallback image URL
- `type` (optional): `"text"` or `"image"` (default: `"text"`)
- `alt` (optional): Alt text for images
- `class` (optional): CSS classes

**Example (Angular)**:
```html
<content-component 
  content-id="hero-title" 
  default-text="Welcome to ContentFlow"
  data-content-id="hero-title"
  class="text-4xl font-bold">
</content-component>
```

**Example (Vanilla JS)**:
```html
<content-component 
  content-id="hero-image" 
  type="image"
  default-src="/images/hero.jpg"
  alt="Hero"
  data-content-id="hero-image">
</content-component>
```

**Registration**: Automatically registers custom element when imported:
```typescript
import '@contentflow/sdk/webcomponent';
```

---

## Advanced API (Storage Adapters)

### `ContentFlowSDK.setStorageAdapter(adapter: IContentStorage): void`

**Description**: Replace the default storage adapter with a custom implementation.

**Parameters**:
```typescript
interface IContentStorage {
  read(path: string): Promise<ContentMap>;
  write(path: string, data: ContentMap): Promise<void>;
}
```

**Example** (Azure Blob Adapter — Phase 2):
```typescript
import { AzureBlobAdapter } from '@contentflow/sdk/adapters/azure';

const azureAdapter = new AzureBlobAdapter({
  accountName: 'myaccount',
  containerName: 'contentflow',
  sasToken: 'sv=2020-08-04&...'
});

ContentFlowSDK.setStorageAdapter(azureAdapter);
```

**Default**: `LocalJsonAdapter` (fetches from `storageUrl` via HTTP GET).

**Use Case**: Phase 2 production deployments with Azure Blob Storage or other cloud storage.

---

## Type Exports

**Import**: `@contentflow/sdk`

```typescript
export type ContentMap = Record<string, string>;

export interface ContentFlowConfig {
  appId: string;
  language: string;
  storageUrl: string;
  pages: string[];
}

export interface IContentStorage {
  read(path: string): Promise<ContentMap>;
  write(path: string, data: ContentMap): Promise<void>;
}

export interface ContentFile {
  $meta: {
    appId: string;
    pageId: string;
    lang: string;
    version: number;
    updatedAt: string;
  };
  [contentId: string]: string;
}
```

---

## Versioning Contract

**Semantic Versioning**:
- **Patch**: Bug fixes, internal optimizations (no API changes)
- **Minor**: New APIs, new optional props (backward compatible)
- **Major**: Breaking changes (rename/remove APIs, change prop requirements)

**Breaking Changes** (require major version):
- Removing or renaming public APIs
- Changing required props on `<ContentComponent>`
- Changing `IContentStorage` interface signature
- Changing content file format (`$meta` structure)

**Non-Breaking Changes** (minor version):
- Adding new optional props to `<ContentComponent>`
- Adding new methods to `ContentFlowSDK`
- Adding new storage adapter implementations

---

## Bundle Size Contract

**Constraint**: SDK core bundle (including Zustand) MUST be <15KB gzipped.

**Measurement**:
```bash
npm run build --workspace=packages/sdk
gzip -c dist/index.js | wc -c  # Must be <15360 bytes
```

**Exclusions**: React and ReactDOM are peer dependencies (not included in bundle size).

---

## Error Handling Contract

**Philosophy**: SDK fails gracefully. Never throw exceptions that break consuming apps.

**Behavior**:
- If `initialize()` fails to fetch content files → Log error to console, resolve Promise, render default text
- If content-id not found in store → Return `undefined`, render default text
- If storage adapter `read()` throws → Catch error, log warning, return empty `ContentMap`

**Example Error Log**:
```
[ContentFlow SDK] Warning: Failed to fetch demo-home-en-US.json: 404 Not Found
[ContentFlow SDK] Falling back to default text for all content on page "home"
```

---

## Phase 1 Contract Summary

This contract defines all public APIs for Phase 1. Changes to this contract require:
1. Update this document
2. Update `packages/sdk/src/index.ts` exports
3. Update version in `packages/sdk/package.json`
4. Add migration guide if breaking change
5. Update consuming apps (CMS, BWO, Demo)

**Next Contract**: [content-schema.md](./content-schema.md) — Content JSON file format specification.
