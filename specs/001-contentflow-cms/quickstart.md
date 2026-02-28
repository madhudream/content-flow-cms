# ContentFlow CMS — Quickstart Guide

**Version**: 1.0.0  
**Target Audience**: Developers integrating ContentFlow SDK or contributing to the CMS  
**Time to Complete**: 15 minutes  
**Date**: 2026-02-27

---

## Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher (comes with Node.js 18+)
- **Git**: For cloning the repository
- **Code Editor**: VS Code recommended (GitHub Copilot instructions included)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/content-flow.git
cd content-flow
```

### 2. Install Dependencies

```bash
npm install
```

This installs all dependencies for the monorepo (SDK, CMS, BWO Tax Forms, Demo App).

**What Happens**:
- npm workspaces links packages locally
- Turborepo installs dev dependencies
- PostCSS, Tailwind, Vite ready to go

---

## Running the System

### Option A: Run Everything (Recommended for First-Time Setup)

```bash
npm run dev
```

**This starts**:
1. **CMS Node.js Server** (port 3010) — File read/write API
2. **CMS Portal** (port 3000) — Content management UI
3. **BWO Tax Forms** (port 3001) — Consuming app
4. **Demo App** (port 3002) — Consuming app

**Open in Browser**:
- CMS Portal: http://localhost:3000
- BWO Tax Forms: http://localhost:3001
- Demo App: http://localhost:3002

**Wait for**: All apps show "ready" in terminal (usually 5-10 seconds).

---

### Option B: Run Individual Apps

```bash
# CMS Portal (includes Node.js server)
npm run dev --workspace=apps/cms

# BWO Tax Forms
npm run dev --workspace=apps/bwo-tax-forms

# Demo App
npm run dev --workspace=apps/demo

# SDK (build library)
npm run build --workspace=packages/sdk
```

---

## First Steps: Using the CMS

### 1. Open CMS Portal

Navigate to http://localhost:3000

**You should see**:
- Dashboard with registered apps (Demo App, BWO Tax Forms)
- No authentication (Phase 1 is local dev only)

### 2. Select an App

Click on **"Demo App"** card.

**You should see**:
- List of pages (Home, About, Contact)
- Preview panel showing the selected page in an iframe

### 3. Edit Content

1. Click on any text element in the preview panel
2. Editor panel opens on the right
3. Type new content
4. Click **"Save"** button

**You should see**:
- Success notification
- Content updates in preview immediately
- JSON file written to `data/demo-home-en-US.json`

### 4. Verify Changes Persisted

1. Refresh the Demo App at http://localhost:3002
2. Navigate to the Home page
3. Your edited content should appear

**Success!** You've completed a full CMS edit → save → render cycle.

---

## First Steps: Integrating the SDK

### 1. Create a New React App (Optional)

```bash
cd apps
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
```

### 2. Install the SDK

```bash
npm install @contentflow/sdk --workspace=apps/my-app
```

**Note**: In the monorepo, the SDK is referenced as `"workspace:*"` in `package.json`.

### 3. Initialize SDK in `main.tsx`

```typescript
// apps/my-app/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ContentFlowSDK } from '@contentflow/sdk';

// Initialize SDK before rendering
await ContentFlowSDK.initialize({
  appId: 'my-app',
  language: 'en-US',
  storageUrl: 'http://localhost:3010/api/content',
  pages: ['home', 'about']
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### 4. Add ContentComponent to Your Page

```tsx
// apps/my-app/src/pages/Home.tsx

import { ContentComponent } from '@contentflow/sdk/react';

export default function Home() {
  return (
    <div className="p-8">
      <ContentComponent 
        contentId="hero-title" 
        defaultText="Welcome to My App"
        className="text-4xl font-bold mb-4"
        data-content-id="hero-title"
      />
      
      <ContentComponent 
        contentId="hero-subtitle" 
        defaultText="This is editable content."
        className="text-xl text-gray-600"
        data-content-id="hero-subtitle"
      />
      
      <ContentComponent 
        contentId="hero-image"
        type="image"
        defaultSrc="/placeholder.jpg"
        alt="Hero banner"
        className="w-full h-64 object-cover mt-4"
        data-content-id="hero-image"
      />
    </div>
  );
}
```

**CRITICAL**: Always include `data-content-id` attribute for CMS to discover editable elements.

### 5. Register Your App in CMS

Edit `data/apps.config.json`:

```json
{
  "apps": [
    {
      "id": "my-app",
      "name": "My App",
      "description": "My custom application",
      "baseUrl": "http://localhost:3003",
      "pages": [
        { "id": "home", "name": "Home", "path": "/" },
        { "id": "about", "name": "About", "path": "/about" }
      ],
      "defaultLanguage": "en-US"
    }
  ]
}
```

### 6. Enable CMS Mode

```typescript
// apps/my-app/src/services/cmsMode.ts

export function initCMSMode() {
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has('cms-mode')) return;

  window.addEventListener('message', (event) => {
    // Validate origin
    if (event.origin !== 'http://localhost:3000') return;

    if (event.data.type === 'CONTENTFLOW_CMS_INIT') {
      // Send ACK
      window.parent.postMessage(
        {
          type: 'CONTENTFLOW_CMS_ACK',
          appId: event.data.appId,
          pageId: event.data.pageId
        },
        event.origin
      );

      // Add click handlers
      document.querySelectorAll('[data-content-id]').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          window.parent.postMessage(
            {
              type: 'CONTENTFLOW_CONTENT_CLICK',
              contentId: el.getAttribute('data-content-id'),
              currentValue: el.textContent || '',
              elementType: 'text'
            },
            'http://localhost:3000'
          );
        });
      });
    }

    if (event.data.type === 'CONTENTFLOW_PREVIEW_UPDATE') {
      const el = document.querySelector(`[data-content-id="${event.data.contentId}"]`);
      if (el) el.textContent = event.data.newValue;
    }
  });
}
```

Call `initCMSMode()` in `main.tsx` after SDK initialization.

### 7. Create Content File

Create `data/my-app-home-en-US.json`:

```json
{
  "$meta": {
    "appId": "my-app",
    "pageId": "home",
    "lang": "en-US",
    "version": 1,
    "updatedAt": "2026-02-27T10:00:00Z"
  },
  "hero-title": "Welcome to My App",
  "hero-subtitle": "This is editable content.",
  "hero-image": "/placeholder.jpg"
}
```

### 8. Test Integration

1. Run your app: `npm run dev` (on port 3003)
2. Open CMS: http://localhost:3000
3. Select "My App" → "Home"
4. Edit content and save

**Success!** Your app is now integrated with ContentFlow CMS.

---

## Project Structure Overview

```
content-flow/
├── packages/
│   └── sdk/                  # @contentflow/sdk library
│       ├── src/
│       │   ├── index.ts      # Public API exports
│       │   ├── core/         # Framework-agnostic core
│       │   ├── adapters/     # Storage adapters
│       │   ├── react/        # React <ContentComponent>
│       │   └── webcomponent/ # Web Component for Angular
│       └── tests/
├── apps/
│   ├── cms/                  # CMS Portal (React + Node.js server)
│   │   ├── src/              # React app
│   │   └── server/           # Express server (port 3010)
│   ├── bwo-tax-forms/        # BWO Tax Forms app
│   └── demo/                 # Demo app
├── data/                     # Shared content storage
│   ├── apps.config.json      # App registry
│   ├── demo-home-en-US.json  # Content files
│   └── images/               # Uploaded images
├── tests/
│   └── e2e/                  # Playwright E2E tests
├── specs/                    # Feature specifications
│   └── 001-contentflow-cms/
│       ├── spec.md
│       ├── plan.md
│       ├── data-model.md
│       ├── research.md
│       ├── contracts/
│       └── tasks.md
├── turbo.json                # Turborepo config
├── package.json              # Root workspace config
└── README.md
```

---

## Common Commands

### Development

```bash
# Run all apps
npm run dev

# Run specific app
npm run dev --workspace=apps/cms
npm run dev --workspace=apps/demo

# Build SDK
npm run build --workspace=packages/sdk
```

### Testing

```bash
# Run all tests
npm run test

# Run SDK tests only
npm run test --workspace=packages/sdk

# Run E2E tests
npm run test:e2e
```

### Linting & Formatting

```bash
# Lint all workspaces
npm run lint

# Format code
npm run format
```

---

## Troubleshooting

### Issue: "Module not found: @contentflow/sdk"

**Solution**: Build the SDK first.

```bash
npm run build --workspace=packages/sdk
```

---

### Issue: CMS shows "This app does not support CMS mode"

**Solution**: Verify the consuming app:
1. Has `?cms-mode=true` query param detection
2. Sends `CONTENTFLOW_CMS_ACK` within 3 seconds
3. Listens for `message` events on `window`

**Debug**:
```javascript
// In consuming app
window.addEventListener('message', (event) => {
  console.log('[DEBUG] Received message:', event.data);
});
```

---

### Issue: Content not updating after save

**Solution**: 
1. Check browser console for errors
2. Verify JSON file written to `data/` directory
3. Hard refresh the consuming app (Cmd+Shift+R)
4. Check SDK initialization in `main.tsx`

---

### Issue: Port already in use

**Solution**: Kill the process using the port.

```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Next Steps

### For Developers

1. **Read the Constitution**: `.specify/memory/constitution.md` — Project principles
2. **Review Data Model**: `specs/001-contentflow-cms/data-model.md`
3. **Check Contracts**: `specs/001-contentflow-cms/contracts/`
4. **Browse Tasks**: `specs/001-contentflow-cms/tasks.md` (implementation tasks)

### For Content Authors

1. **Open CMS**: http://localhost:3000
2. **Select App**: Choose from registered apps
3. **Edit Content**: Click, type, save
4. **Switch Language**: Use language dropdown to manage translations

---

## Key Concepts

### Content ID Immutability

**Rule**: Once a `contentId` is used in production, **NEVER rename or delete it**.

**Why**: Breaks the contract between CMS and consuming apps.

**If you must change**:
1. Create a new `contentId` with the new name
2. Update consuming app to use new ID
3. Migrate content in JSON files
4. Deprecate old ID (keep for backward compatibility)

---

### Default Text/Image Required

**Rule**: ALWAYS provide `defaultText` (for text) or `defaultSrc` (for images).

**Why**: 
- SDK may not have content loaded yet (async fetch)
- Content file may be missing
- Zero layout shift guarantee (SC-003)

---

### Storage Abstraction

**Rule**: NEVER read/write JSON files directly from components.

**Correct**:
```typescript
// Use SDK API
const content = ContentFlowSDK.getContent('home', 'hero-title');
```

**Incorrect**:
```typescript
// Direct file access ❌
const data = await fetch('/data/demo-home-en-US.json');
```

**Why**: Storage may change (Azure Blob in Phase 2). Abstraction via `IContentStorage` interface decouples consumers from storage implementation.

---

## Resources

- **Specification**: `specs/001-contentflow-cms/spec.md`
- **Implementation Plan**: `specs/001-contentflow-cms/plan.md`
- **API Contract**: `specs/001-contentflow-cms/contracts/sdk-api.md`
- **Schema Contract**: `specs/001-contentflow-cms/contracts/content-schema.md`
- **PostMessage Protocol**: `specs/001-contentflow-cms/contracts/postmessage-protocol.md`

---

## Getting Help

1. **Check specs**: `specs/001-contentflow-cms/` for detailed documentation
2. **Read constitution**: `.specify/memory/constitution.md` for architectural principles
3. **Review GitHub Copilot instructions**: `.github/copilot-instructions.md` for AI assistance
4. **Open an issue**: If you find a bug or need a feature

---

**Ready to build?** Choose one of the [Next Steps](#next-steps) above and start coding!
