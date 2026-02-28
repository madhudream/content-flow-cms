# Research: ContentFlow CMS

**Phase**: 0 (Research & Technology Decisions)  
**Date**: 2026-02-27  
**Status**: Complete

## Overview

This document captures the technology decisions, architectural patterns, and best practices research for the ContentFlow CMS implementation. Since the tech stack was pre-decided in the project constitution, this research focuses on validating those choices and documenting implementation patterns.

## Technology Decisions

### 1. Monorepo: Turborepo + npm Workspaces

**Decision**: Use Turborepo for task orchestration with npm workspaces for dependency management.

**Rationale**:
- Turborepo provides intelligent caching and parallel task execution for faster builds
- npm workspaces (native to npm 7+) handles dependency hoisting and linking between packages
- Combined approach: Turborepo for `dev`, `build`, `test` tasks; npm workspaces for dependency resolution
- Avoids complexity of Lerna or Nx while providing sufficient monorepo tooling

**Alternatives Considered**:
- **Lerna**: Deprecated in favor of npm workspaces for dependency management
- **Nx**: More powerful but overkill for 3 apps + 1 library; steeper learning curve
- **pnpm workspaces**: Better dependency isolation but requires team buy-in for new package manager

**Implementation Notes**:
- Root `package.json` defines workspaces: `["packages/*", "apps/*"]`
- `turbo.json` defines pipeline: `build` depends on SDK build, `dev` runs in parallel
- Each workspace has its own `package.json` with SDK referenced as `@contentflow/sdk: "workspace:*"`

---

### 2. Bundler: Vite 5

**Decision**: Vite for all apps and SDK library bundling.

**Rationale**:
- Native ESM in dev mode = instant HMR; esbuild-powered = fast production builds
- Library mode for SDK: easily outputs ESM + CJS bundles with TypeScript definitions
- Zero config for React apps; Tailwind PostCSS integration built-in
- Single bundler across monorepo reduces tooling complexity

**Alternatives Considered**:
- **Webpack 5**: Mature but slower dev server; more complex configuration
- **Rollup**: Better for libraries but less ergonomic for React apps; Vite uses Rollup under the hood for production builds anyway
- **esbuild directly**: Ultra-fast but lacks some bundle optimization features; Vite wraps esbuild with additional optimizations

**Implementation Notes**:
- SDK `vite.config.ts`: Library mode with `lib.entry`, `lib.name`, `rollupOptions.external` for peer dependencies (React, Zustand)
- Apps `vite.config.ts`: Standard SPA config with `@vitejs/plugin-react`
- CMS server runs separately (not bundled by Vite)

---

### 3. State Management: Redux Toolkit (CMS) + Zustand (SDK)

**Decision**: 
- **CMS**: Redux Toolkit (RTK) for global application state
- **SDK**: Zustand for lightweight reactive content store

**Rationale**:
- **CMS needs RTK** because:
  - Complex state (apps registry, page selection, editor panel, language switching)
  - Time-travel debugging useful during development
  - DevTools integration for state inspection
  - Well-established patterns for async thunks (content save operations)
  
- **SDK needs Zustand** because:
  - Lightweight (<1KB) to meet <15KB SDK bundle constraint
  - Simple reactive store without boilerplate
  - Framework-agnostic (React is optional, can be used from vanilla JS)
  - Minimal API surface (`create`, `useStore`, `getState`)

**Alternatives Considered**:
- **Context API (CMS)**: Insufficient for complex state; performance issues with frequent updates
- **Redux in SDK**: Too heavy for bundle size constraint; pulls in React as hard dependency
- **Zustand in CMS**: Could work but RTK DevTools provide better DX for complex workflows

**Implementation Notes**:
- CMS slices: `appsSlice`, `contentSlice`, `uiSlice` (selected app/page/language)
- SDK store: `{ contentMaps: Map<string, ContentMap>, status: 'loading' | 'ready' | 'error' }`
- React hook `useContent(contentId)` subscribes to SDK Zustand store

---

### 4. Styling: Tailwind CSS Only

**Decision**: Tailwind utility-first CSS for all UI. No custom CSS files unless absolutely unavoidable.

**Rationale**:
- Enforced by constitution for consistency across all apps
- Utility classes prevent style drift and duplicate CSS
- JIT compiler keeps bundle size small (unused classes purged)
- State-of-the-art UX requirement met with Tailwind's extensive utility library (animations, transitions, responsive design)

**Alternatives Considered**:
- **CSS Modules**: Allows custom styling but leads to inconsistent design patterns
- **Styled Components**: Runtime CSS-in-JS has performance overhead; increases bundle size
- **Vanilla CSS**: Unmaintainable at scale; no purging mechanism

**Implementation Notes**:
- Shared `tailwind.config.js` preset in root (optional); each app can extend
- Use Tailwind's `group`, `peer`, `data-*` variants for interactive states
- Custom theme colors for brand consistency (defined in each app's config)

---

### 5. Testing Strategy

**Decision**: 
- **Unit Tests**: Vitest (SDK, utilities)
- **Component Tests**: React Testing Library + Vitest (CMS, consuming apps)
- **E2E Tests**: Playwright (root-level, cross-app integration)

**Rationale**:
- **Vitest chosen over Jest**:
  - Native ESM support (aligns with Vite)
  - 5-10x faster test execution (esbuild-powered)
  - Drop-in Jest API compatibility (minimal migration from Jest if needed)
  - Config reuses `vite.config.ts` (reduce duplication)

- **React Testing Library**:
  - Constitution mandates test-first; RTL enforces accessibility and user-centric tests
  - Tests implementation details less (better refactoring confidence)
  - Integrates seamlessly with Vitest

- **Playwright chosen over Cypress**:
  - Multi-browser support (Chrome, Firefox, Safari) out of the box
  - Faster execution, better reliability (auto-waits, actionability checks)
  - API-first design (can test CMS Node.js server directly)
  - Better headless CI/CD performance

**Alternatives Considered**:
- **Jest**: Slower, requires more config for ESM; Vitest is better fit for Vite monorepo
- **Cypress**: Good for single-app E2E but harder to orchestrate multi-app scenarios (CMS → BWO → Demo)
- **Testing Library without Vitest**: Could use with Jest but Vitest is faster

**Implementation Notes**:
- SDK tests: Mock storage adapters, test content resolution logic
- CMS component tests: Mock Redux store, test editor panel interactions
- E2E tests: Start all apps + CMS server, test edit → save → consuming app refresh flow

---

### 6. CMS ↔ Consuming App Communication: postMessage

**Decision**: Use `window.postMessage` API for CMS iframe ↔ parent communication.

**Rationale**:
- Standard browser API, no external dependencies
- Cross-origin safe (CMS on 3000, consuming app on 3001/3002)
- Event-driven, non-blocking communication model
- Simple protocol: `CONTENTFLOW_CMS_INIT`, `CONTENTFLOW_CONTENT_CLICK`, `CONTENTFLOW_PREVIEW_UPDATE`

**Alternatives Considered**:
- **WebSockets**: Overkill for one-to-one iframe communication; requires server infrastructure
- **Polling**: Inefficient; delays in propagating updates
- **Direct DOM manipulation**: Violates iframe sandbox security; brittle across origins

**Implementation Notes**:
- CMS sends `CONTENTFLOW_CMS_INIT` with `?cms-mode=true` query param
- Consuming app listens for `message` events, validates `event.origin`
- Timeout after 3 seconds if no response → show warning banner (FR-020)

---

### 7. Image Upload Strategy: Local File System

**Decision**: Upload images to `data/images/` via Node.js Express server with `multer` middleware.

**Rationale**:
- Keeps Phase 1 simple: no cloud dependencies, no API keys
- Express + multer is standard pattern for file uploads
- Generated path format: `data/images/{appId}-{contentId}-{timestamp}.{ext}` ensures uniqueness
- 5MB file size limit enforced server-side

**Alternatives Considered**:
- **Base64 in JSON**: Bloats content files, slows parsing, no cache optimization
- **Azure Blob (Phase 1)**: Premature; deferred to Phase 2 per spec clarifications
- **URL input only**: Simpler but requires users to host images externally

**Implementation Notes**:
- POST `/api/images` endpoint with `multer({ limits: { fileSize: 5 * 1024 * 1024 } })`
- Accept types: `jpg`, `png`, `gif`, `svg`, `webp`
- Return JSON: `{ path: "/data/images/{appId}-{contentId}-{timestamp}.jpg" }`

---

### 8. Content Loading Strategy: Eager Fetch

**Decision**: SDK fetches all registered page content files on initialization (not lazy-load).

**Rationale**:
- Phase 1 scale is small: 5 pages × 1-2 locales = 5-10 JSON files per app (~2-5KB each)
- Total data: ~20-50KB; negligible on localhost or CDN
- Eager loading eliminates navigation delays (SC-003: zero layout shift)
- Predictable performance; no surprise network requests during user interaction

**Alternatives Considered**:
- **Lazy load per page**: Saves initial bandwidth but adds complexity; delays on first navigation to each page
- **Hybrid (prefetch in background)**: More complex; marginal benefit for <50KB total data

**Implementation Notes**:
- `ContentFlowSDK.initialize({ pages: ['home', 'about', 'contact'] })` fetches:
  - `{appId}-home-{lang}.json`
  - `{appId}-about-{lang}.json`
  - `{appId}-contact-{lang}.json`
- All fetches parallel via `Promise.all()`
- Store in Zustand: `Map<pageId, ContentMap>`

---

### 9. SDK Framework Adapters: React + Web Component

**Decision**: 
- Core SDK is framework-agnostic (TypeScript class + Zustand store)
- React adapter: `<ContentComponent>` functional component + `useContent` hook
- Web Component adapter: Custom element `<content-component>` for Angular

**Rationale**:
- **React**: Primary target (CMS, BWO, Demo all use React in Phase 1)
- **Web Component**: Future-proof for Angular integration (BWO may migrate to Angular)
- Separation of concerns: React code lives in `packages/sdk/src/react/`, imported separately
- Core SDK can be used directly from vanilla JS if needed

**Alternatives Considered**:
- **Angular-specific module**: Not needed yet; Web Components work in Angular without build dependencies
- **Vue adapter**: No Vue apps in Phase 1; defer until needed (YAGNI)
- **React-only SDK**: Violates constitution (library-first = framework-agnostic)

**Implementation Notes**:
- React: Export from `@contentflow/sdk/react` (subpath export in `package.json`)
- Web Component: Export from `@contentflow/sdk/webcomponent`
- Core SDK exports from `@contentflow/sdk` (default)

---

## Best Practices Research

### Content-ID Naming Conventions

**Pattern**: `{scope}-{semantic-name}`

Examples:
- `hero-title` (home page hero section title)
- `nav-logo` (navigation bar logo image)
- `form-submit-button` (form submit button text)
- `footer-copyright` (footer copyright notice)

**Avoid**:
- Generic names like `text1`, `image2` (not semantic)
- Prefixing with page name if content is page-scoped (redundant)
- CamelCase or PascalCase (kebab-case is standard for HTML attributes)

---

### PostMessage Protocol Design

**Messages**:

1. **CMS → Consuming App: `CONTENTFLOW_CMS_INIT`**
   ```json
   {
     "type": "CONTENTFLOW_CMS_INIT",
     "appId": "demo",
     "pageId": "home",
     "language": "en-US"
   }
   ```
   Response expected: Consuming app sends `CONTENTFLOW_CMS_ACK` within 3s.

2. **Consuming App → CMS: `CONTENTFLOW_CONTENT_CLICK`**
   ```json
   {
     "type": "CONTENTFLOW_CONTENT_CLICK",
     "contentId": "hero-title",
     "currentValue": "Welcome to ContentFlow"
   }
   ```
   Triggers: User clicks element with `data-content-id` in preview.

3. **CMS → Consuming App: `CONTENTFLOW_PREVIEW_UPDATE`**
   ```json
   {
     "type": "CONTENTFLOW_PREVIEW_UPDATE",
     "contentId": "hero-title",
     "newValue": "Updated Headline"
   }
   ```
   Triggers: Live preview update as user types in editor panel.

---

### Storage Adapter Interface

```typescript
export interface IContentStorage {
  /**
   * Read a content JSON file from storage.
   * @param path Relative path like "demo-home-en-US.json"
   * @returns Promise resolving to flat ContentMap object
   */
  read(path: string): Promise<ContentMap>;

  /**
   * Write a content JSON file to storage.
   * @param path Relative path like "demo-home-en-US.json"
   * @param data Flat ContentMap object
   */
  write(path: string, data: ContentMap): Promise<void>;
}

export type ContentMap = Record<string, string>; // { [contentId]: value }
```

**LocalJsonAdapter Implementation**:
```typescript
export class LocalJsonAdapter implements IContentStorage {
  constructor(private baseUrl: string) {} // e.g., "http://localhost:3010/api/content"

  async read(path: string): Promise<ContentMap> {
    const res = await fetch(`${this.baseUrl}/${path}`);
    if (!res.ok) throw new Error(`Failed to read ${path}: ${res.statusText}`);
    const json = await res.json();
    // Strip $meta from response
    const { $meta, ...content } = json;
    return content;
  }

  async write(path: string, data: ContentMap): Promise<void> {
    const res = await fetch(`${this.baseUrl}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to write ${path}: ${res.statusText}`);
  }
}
```

---

### Error Handling Patterns

**SDK**:
- Fail gracefully: If fetch fails, log warning and return empty `ContentMap`
- Always render `defaultText` if content is missing or errored
- Expose `status` in store: `'loading' | 'ready' | 'error'`

**CMS**:
- Inline error notifications (toast/banner) for save failures
- Console.error for detailed error logs (debugging)
- Retry button on failed operations (no automatic retry in Phase 1)

**Node.js Server**:
- Return 400 for invalid JSON, 404 for missing files, 500 for file system errors
- CORS headers for localhost origins (3000, 3001, 3002)
- Request validation middleware (file path, file size, content type)

---

## Performance Optimization

### SDK Bundle Size (<15KB gzipped)

**Techniques**:
- Tree-shaking: Zustand and fetch are the only core dependencies (~3KB total)
- No React in core SDK (only in `react/` adapter)
- Minification via Vite rollup (Terser plugin)
- External peer dependencies: React, ReactDOM not bundled

**Measurement**:
```bash
vite build --mode production
gzip -c dist/index.js | wc -c  # Should be <15360 bytes
```

---

### Zero Layout Shift on ContentComponent Render

**Technique**:
1. `<ContentComponent>` renders `defaultText` synchronously (no `useState` init delay)
2. Zustand store populated before first React render (SDK initialized in `main.tsx` before `ReactDOM.render`)
3. If Zustand has content on first render, use it; otherwise use `defaultText`
4. Subsequent updates trigger re-render but no layout shift (text replaces text in same DOM node)

**Implementation**:
```tsx
export const ContentComponent: React.FC<Props> = ({ contentId, defaultText }) => {
  const value = useContent(contentId); // Zustand hook
  return <span data-content-id={contentId}>{value ?? defaultText}</span>;
};
```

On first render, if `value` is `undefined`, renders `defaultText`. No blank state.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Bundle size exceeds 15KB | SDK adoption blocked | Monitor via CI; tree-shake aggressively; defer non-critical features |
| postMessage timeout on slow networks | CMS shows false warning | Increase timeout to 5s; add retry mechanism in Phase 2 |
| Concurrent CMS edits (last write wins) | Data loss | Document limitation; defer conflict detection to Phase 2 |
| Image upload fills disk | Server crashes | Enforce 5MB limit; add cleanup script for old images in Phase 2 |
| Malformed JSON crashes SDK | Consuming app breaks | Try-catch in adapter `read()`; fallback to empty ContentMap |

---

## Phase 0 Conclusion

All technology decisions validated. No NEEDS CLARIFICATION items remain. Proceed to **Phase 1: Design & Contracts**.
