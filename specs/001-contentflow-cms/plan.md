# Implementation Plan: ContentFlow CMS — Editable Content System

**Branch**: `001-contentflow-cms` | **Date**: 2026-02-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-contentflow-cms/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a multi-app editable content management and delivery system consisting of:
1. **Framework-agnostic SDK** (`@contentflow/sdk`) for content delivery with React and Web Component wrappers
2. **CMS Portal** (React + Tailwind) for visual content editing via iframe preview with postMessage communication
3. **Node.js file server** (port 3010) for local JSON and image file operations
4. **BWO Tax Forms app** (React, metadata-driven form rendering) as primary consuming app
5. **Demo App** (React, 3+ pages) as secondary consuming app

Content is stored as flat JSON files (`data/{appId}-{pageId}-{lang}.json`) and accessed via storage abstraction interface. CMS highlights elements with `data-content-id`, provides side-panel editor, and updates content files in real-time. SDK eagerly fetches all registered page content on initialization for zero-latency navigation.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode enabled (all apps and SDK)  
**Primary Dependencies**: React 18, Vite 5, Tailwind CSS 3, Redux Toolkit (CMS state), Zustand (SDK state), Express (Node.js file server)  
**Storage**: Local JSON files via Node.js Express server on port 3010 (Phase 1). Azure Blob Storage with CDN (Phase 2).  
**Testing**: Vitest (unit tests), React Testing Library (component tests), Playwright (E2E tests)  
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)  
**Project Type**: Turborepo monorepo with 1 library package (`@contentflow/sdk`) + 3 web applications (CMS portal, BWO Tax Forms, Demo App)  
**Performance Goals**: 
  - SDK bundle <15KB gzipped
  - Content save → visible in consuming app <2s
  - Zero layout shift on ContentComponent render
  - Language switch in CMS <200ms
  - Node.js file read <50ms, image upload <500ms (2MB)
  - SDK initialization with 5 pages <300ms (local JSON)
  
**Constraints**:
  - Zero framework dependencies in SDK core (React/Angular adapters in separate modules)
  - Flat JSON content schema (no nesting)
  - All cross-app communication via SDK + data/ directory only
  - Tailwind-only styling (no custom CSS files)
  - Content-ID immutability (never rename/remove once published)
  - Default text/image props required on all ContentComponent instances
  
**Scale/Scope**: 3 applications, 5 pages per app, 2 languages (en-US + es-ES), ~15 total JSON content files during Phase 1 development

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Evidence/Notes |
|-----------|------------|----------------|
| **I. Library-First** | ✅ PASS | SDK (`@contentflow/sdk`) is framework-agnostic. Core logic has zero framework imports. React adapter in `packages/sdk/src/react/`. Web Component adapter in `packages/sdk/src/webcomponent/`. |
| **II. Content-ID as Contract** | ✅ PASS | All editable content requires `contentId` prop. Spec mandates `defaultText`/`defaultSrc` fallback on every usage. Immutability of content-IDs documented in constitution. |
| **III. SOLID & KISS** | ✅ PASS | Storage abstraction via `IContentStorage` interface (Liskov substitution). Flat JSON schema (KISS). Single responsibility: SDK resolves content, CMS manages content, apps consume content. |
| **IV. Multi-Tenancy by App & Page** | ✅ PASS | Content scoped as `{appId}-{pageId}-{lang}.json`. Apps registered in `apps.config.json`. SDK initializes per-app with `{ appId, language, storageUrl }`. |
| **V. Internationalization First** | ✅ PASS | Language-scoped content files (`en-US`, `es-ES`). Fallback to `en-US` if locale missing. Language switching without page reload (FR-008). |
| **VI. Test-First** | ✅ PASS | Spec includes acceptance scenarios for each user story. Testing strategy defined: Vitest (SDK unit), RTL (CMS components), Playwright (E2E round-trip). |
| **VII. Progressive Enhancement** | ✅ PASS | `<ContentComponent>` renders `defaultText` synchronously (FR-012). No layout shift (SC-003). Content from storage replaces defaults after hydration. |
| **VIII. Storage Abstraction** | ✅ PASS | All storage ops via `IContentStorage` interface. Local JSON adapter (Phase 1). Azure Blob adapter (Phase 2). Swappable without changing consumers. |
| **Architecture Boundaries** | ✅ PASS | 3 web apps (CMS, BWO, Demo) + 1 SDK library + 1 data directory. No cross-app imports—communication via SDK and `data/` only. Apps run on separate ports (3000, 3001, 3002). CMS server on 3010. |

**Gate Result**: ✅ **PASS** — All constitution principles satisfied. No violations. No complexity justification required. Proceed to Phase 0.

---

### Post-Design Re-Check (After Phase 1)

**Date**: 2026-02-27  
**Status**: ✅ **PASS**

All Phase 1 design artifacts reviewed:
- **data-model.md**: Flat JSON schema (KISS), proper entity separation (SOLID)
- **contracts/sdk-api.md**: Framework-agnostic core with separate React/WebComponent adapters (Library-First)
- **contracts/content-schema.md**: Content-ID immutability enforced, flat key-value structure (KISS)
- **contracts/postmessage-protocol.md**: Clean protocol definition, origin validation (security)
- **quickstart.md**: Developer guide with proper SDK usage patterns

**No new violations introduced.** Design adheres to all constitution principles. Ready for Phase 2 (Task Breakdown).

## Project Structure

### Documentation (this feature)

```text
specs/001-contentflow-cms/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── sdk-api.md       # SDK public API contract
│   ├── content-schema.md # Content JSON schema
│   └── postmessage-protocol.md # CMS ↔ iframe communication contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Turborepo monorepo structure

packages/
└── sdk/                              # @contentflow/sdk library
    ├── src/
    │   ├── index.ts                  # Public API exports
    │   ├── core/                     # Framework-agnostic core
    │   │   ├── ContentFlowSDK.ts     # SDK initialization
    │   │   ├── ContentResolver.ts    # Content resolution logic
    │   │   └── store.ts              # Zustand state management
    │   ├── adapters/                 # Storage abstraction
    │   │   ├── IContentStorage.ts    # Storage interface
    │   │   ├── LocalJsonAdapter.ts   # Phase 1: fetch from /data
    │   │   └── AzureBlobAdapter.ts   # Phase 2: Azure Blob
    │   ├── react/                    # React-specific exports
    │   │   ├── ContentComponent.tsx  # React wrapper component
    │   │   └── hooks.ts              # React hooks (useContent, etc.)
    │   └── webcomponent/             # Web Component exports
    │       └── ContentElement.ts     # Custom element for Angular
    ├── tests/
    │   ├── unit/                     # Vitest unit tests
    │   └── integration/              # Adapter integration tests
    ├── package.json
    ├── vite.config.ts                # Vite library mode build
    └── tsconfig.json

apps/
├── cms/                              # CMS Portal (React + Tailwind)
│   ├── src/
│   │   ├── main.tsx                  # Vite entry point
│   │   ├── App.tsx                   # Root component
│   │   ├── components/               # UI components
│   │   │   ├── Dashboard.tsx         # App selector dashboard
│   │   │   ├── PageSelector.tsx      # Page list for selected app
│   │   │   ├── PreviewPanel.tsx      # Iframe preview with postMessage
│   │   │   ├── EditorPanel.tsx       # Side panel for content editing
│   │   │   └── LanguageSwitcher.tsx  # Language dropdown
│   │   ├── store/                    # Redux Toolkit state
│   │   │   ├── store.ts              # RTK store configuration
│   │   │   ├── appsSlice.ts          # Apps registry state
│   │   │   ├── contentSlice.ts       # Active content state
│   │   │   └── uiSlice.ts            # UI state (selected app/page/lang)
│   │   ├── services/                 # API communication
│   │   │   └── contentApi.ts         # Fetch/save content via Node server
│   │   └── types.ts                  # TypeScript types
│   ├── server/                       # Node.js Express server (port 3010)
│   │   ├── index.ts                  # Server entry point
│   │   ├── routes/
│   │   │   ├── content.ts            # GET/POST /api/content/:file
│   │   │   └── images.ts             # POST /api/images (upload)
│   │   └── middleware/
│   │       └── cors.ts               # CORS config for localhost
│   ├── tests/
│   │   ├── components/               # React Testing Library tests
│   │   └── e2e/                      # Placeholder (Playwright in root)
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js

├── bwo-tax-forms/                    # BWO Tax Forms App (React + Tailwind)
│   ├── src/
│   │   ├── main.tsx                  # Vite entry, SDK initialization
│   │   ├── App.tsx                   # Root with sidebar navigation
│   │   ├── components/
│   │   │   ├── FormPage.tsx          # Metadata-driven form renderer
│   │   │   ├── FormField.tsx         # Single field component
│   │   │   ├── PageSidebar.tsx       # Page navigation sidebar
│   │   │   └── ValidationError.tsx   # Inline error display
│   │   ├── metadata/                 # Page metadata JSON files
│   │   │   ├── home.json             # FormPageMeta for home page
│   │   │   ├── personal-info.json
│   │   │   └── income.json
│   │   ├── services/
│   │   │   └── cmsMode.ts            # postMessage listener for CMS
│   │   └── types.ts                  # FormPageMeta types
│   ├── tests/
│   │   └── components/
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js

└── demo/                             # Demo App (React + Tailwind)
    ├── src/
    │   ├── main.tsx                  # Vite entry, SDK initialization
    │   ├── App.tsx                   # Root with router
    │   ├── pages/                    # Page components
    │   │   ├── Home.tsx              # /home
    │   │   ├── About.tsx             # /about
    │   │   └── Contact.tsx           # /contact
    │   ├── services/
    │   │   └── cmsMode.ts            # postMessage listener for CMS
    │   └── types.ts
    ├── tests/
    │   └── pages/
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js

data/                                 # Shared content storage
├── apps.config.json                  # App registry
├── demo-home-en-US.json              # Content files
├── demo-home-es-ES.json
├── bwo-taxforms-home-en-US.json
└── images/                           # Uploaded images
    └── {appId}-{contentId}-{timestamp}.{ext}

tests/                                # Root-level E2E tests
└── e2e/
    ├── cms-edit-flow.spec.ts         # Playwright: Edit in CMS → verify in Demo
    └── bwo-integration.spec.ts       # Playwright: CMS → BWO round-trip

.specify/                             # Spec-kit templates and scripts
├── memory/
│   └── constitution.md               # Project constitution
├── scripts/
│   └── bash/
│       ├── setup-plan.sh
│       └── update-agent-context.sh
└── templates/
    └── plan-template.md

.github/
├── copilot-instructions.md           # GitHub Copilot context
└── prompts/                          # Spec-kit prompts
```

**Structure Decision**: This is a **Turborepo monorepo** with npm workspaces. The SDK is a library package consumed by all apps. The CMS includes a Node.js server for local file operations. Apps communicate only via the SDK and shared `data/` directory—no direct imports between apps. Each app runs independently on its own port. Playwright E2E tests at the root validate cross-app integration.

## Complexity Tracking

**No violations.** All constitution principles are satisfied. No complexity justification required.

---

## Implementation Plan Summary

### Phase 0: Research & Technology Decisions ✅ COMPLETE

**Deliverable**: [research.md](research.md)

**Key Research Findings**:
- Monorepo: Turborepo + npm workspaces validated
- Bundler: Vite 5 for all apps and SDK library mode
- State: Redux Toolkit (CMS), Zustand (SDK) for bundle size constraint
- Styling: Tailwind CSS only (no custom CSS files)
- Testing: Vitest + React Testing Library + Playwright
- CMS Communication: postMessage protocol (standard browser API)
- Image Upload: Local file system (`data/images/`) via Node.js multer
- Content Loading: Eager fetch (all pages on SDK init)

**No NEEDS CLARIFICATION items remain.** All technology choices justified and documented.

---

### Phase 1: Design & Contracts ✅ COMPLETE

**Deliverables**:
- [data-model.md](data-model.md) — All entities, schemas, validation rules, state transitions
- [contracts/sdk-api.md](contracts/sdk-api.md) — SDK public API contract (React, Web Component, storage adapters)
- [contracts/content-schema.md](contracts/content-schema.md) — Content JSON file format specification
- [contracts/postmessage-protocol.md](contracts/postmessage-protocol.md) — CMS ↔ iframe communication protocol
- [quickstart.md](quickstart.md) — Developer onboarding guide

**Post-Design Constitution Re-Check**: ✅ **PASS** (no violations introduced)

**Agent Context Update**: ✅ GitHub Copilot instructions updated with project tech stack

---

### Phase 2: Task Breakdown 🔜 NEXT

**Command**: `/speckit.tasks` (run separately, not part of `/speckit.plan`)

**What Happens Next**:
1. Break down the implementation into concrete, actionable tasks
2. Organize tasks into logical work streams (SDK, CMS, Apps, E2E)
3. Define task dependencies and acceptance criteria
4. Estimate effort and identify risks
5. Generate `tasks.md` for execution tracking

**Prerequisites**: ✅ All complete (spec clarified, plan defined, contracts written)

---

## Branch & Artifact Status

**Branch**: `001-contentflow-cms`  
**Feature Spec**: [spec.md](spec.md) (clarified with 5 Q&A sessions)  
**Implementation Plan**: This file ([plan.md](plan.md))

**Artifacts Generated**:
- ✅ `research.md` — Technology decisions and best practices
- ✅ `data-model.md` — Entity schemas and relationships
- ✅ `contracts/sdk-api.md` — SDK public API contract
- ✅ `contracts/content-schema.md` — Content JSON schema  
- ✅ `contracts/postmessage-protocol.md` — CMS ↔ iframe protocol
- ✅ `quickstart.md` — Developer quickstart guide
- ⏳ `tasks.md` — To be generated by `/speckit.tasks`

**Ready for**: Task breakdown and implementation (Phase 2).
