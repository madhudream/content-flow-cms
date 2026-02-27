# ContentFlow CMS — GitHub Copilot Workspace Instructions

## Project Overview

ContentFlow CMS is a multi-app monorepo for editable content management and delivery. It consists of:

1. **`packages/sdk`** — `@contentflow/sdk`: Framework-agnostic TypeScript SDK for content delivery
2. **`apps/cms`** — React + Tailwind CMS portal for content authoring
3. **`apps/bwo-tax-forms`** — Metadata-driven tax form app (consuming app)
4. **`apps/demo`** — Simple React demo app (consuming app)
5. **`data/`** — Shared local JSON content store

## Architecture Principles (from Constitution)

- **Library-First**: SDK has zero framework imports in its core. All framework-specific code lives in `packages/sdk/src/react/` or `packages/sdk/src/webcomponent/`.
- **Content-ID as Contract**: Never remove or rename a `contentId` once used. Always provide `defaultText` in `<ContentComponent>`.
- **SOLID & KISS**: Single responsibility per module. No abstraction without a concrete use case. Flat JSON over nested.
- **Storage Abstraction**: All storage access goes through `IContentStorage`. Never read/write JSON files directly from components.
- **No Cross-App Imports**: Apps communicate only through the SDK and the `data/` directory. `import` from another app = constitution violation.

## Key Files

| File | Purpose |
|---|---|
| `data/apps.config.json` | App registry — source of truth for registered apps and pages |
| `data/{appId}-{pageId}-{lang}.json` | Content files — one per app/page/locale |
| `packages/sdk/src/index.ts` | SDK public API |
| `packages/sdk/src/adapters/IContentStorage.ts` | Storage interface |
| `apps/cms/server/index.ts` | Node.js server for CMS file read/write |
| `specs/001-contentflow-cms/` | Full spec, plan, tasks, and data model |

## Coding Conventions

### TypeScript
- Strict mode always enabled
- Prefer `interface` over `type` for object shapes
- Use `readonly` for immutable properties
- Export types from a `types.ts` file per module

### React
- Functional components only
- Hooks: `useState`, `useEffect`, `useCallback`, `useMemo` — prefer Zustand selectors in SDK, RTK selectors in CMS
- No class components
- Props interfaces named `{ComponentName}Props`

### Styling
- Tailwind CSS utility classes only in all apps
- No custom CSS files unless Tailwind cannot achieve the requirement
- Use Tailwind `group`, `peer`, and `data-*` variants for interactive states

### Content Components

**React (consuming apps):**
```tsx
import { ContentComponent } from '@contentflow/sdk/react';

<ContentComponent 
  contentId="hero-title" 
  defaultText="Welcome to ContentFlow"
  data-content-id="hero-title"  // required for CMS highlight discovery
/>

// Image:
<ContentComponent 
  contentId="hero-image"
  type="image"
  defaultSrc="/images/hero.jpg"
  alt="Hero banner"
  data-content-id="hero-image"
/>
```

**SDK Initialization (in app `main.tsx`):**
```ts
import { ContentFlowSDK } from '@contentflow/sdk';

await ContentFlowSDK.initialize({
  appId: 'demo',
  language: 'en-US',
  storageUrl: '/data',       // local dev; replace with CDN URL in production
  pages: ['home', 'about', 'contact']
});
```

**Angular (Web Component):**
```html
<content-component 
  content-id="hero-title" 
  default-text="Welcome"
  data-content-id="hero-title">
</content-component>
```

### Content JSON Files
File path: `data/{appId}-{pageId}-{lang}.json`

```json
{
  "$meta": {
    "appId": "demo",
    "pageId": "home",
    "lang": "en-US",
    "version": 1,
    "updatedAt": "2026-02-27T00:00:00Z"
  },
  "hero-title": "Welcome to ContentFlow",
  "hero-subtitle": "Edit content without code",
  "cta-button": "Get Started"
}
```

### BWO Tax Forms Metadata
File path: `apps/bwo-tax-forms/src/metadata/{pageId}.json`

See `specs/001-contentflow-cms/data-model.md` for the `FormPageMeta` type.

## Development Ports
- CMS App: `http://localhost:3000`
- BWO Tax Forms: `http://localhost:3001`
- Demo App: `http://localhost:3002`
- CMS Server (file API): `http://localhost:3010`

## Running the Project

```bash
# Install all dependencies
npm install

# Run everything concurrently
npm run dev

# Run individual apps
npm run dev --workspace=apps/cms
npm run dev --workspace=apps/bwo-tax-forms
npm run dev --workspace=apps/demo

# Build SDK
npm run build --workspace=packages/sdk

# Run tests
npm run test
```

## CMS ↔ Consuming App Communication

The CMS renders consuming app pages in an `<iframe>`. Communication uses `postMessage`:

1. CMS sends `CONTENTFLOW_CMS_INIT` → iframe enables highlight mode
2. User clicks element → iframe sends `CONTENTFLOW_CONTENT_CLICK` with `contentId`
3. CMS shows editor panel for that `contentId`
4. CMS sends `CONTENTFLOW_PREVIEW_UPDATE` → iframe updates live preview

Consuming apps must listen for these messages when `?cms-mode=true` is in the URL.

## Testing Strategy

- **SDK**: Vitest unit tests for all adapters and `ContentComponent`
- **CMS**: React Testing Library for UI components; MSW for API mocking
- **Integration**: Playwright E2E — edit in CMS → verify in Demo App and BWO

## Spec-Kit Commands (GitHub Copilot / Claude Code)

```bash
/speckit.constitution   # Update project principles
/speckit.specify        # Create a new feature spec
/speckit.plan           # Create implementation plan for a spec  
/speckit.tasks          # Break plan into actionable tasks
/speckit.implement      # Execute tasks
```

Specs live in `specs/{###-feature-name}/`.

## Phase 2 (Future)
- Azure Blob Storage adapter (`AzureBlobAdapter implements IContentStorage`)
- CDN publish workflow
- Real-time collaboration with conflict detection
- Visual diff between locale versions
