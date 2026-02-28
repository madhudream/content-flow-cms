# Tasks: ContentFlow CMS — Editable Content System

**Feature**: `001-contentflow-cms`  
**Status**: Ready for Implementation  
**Created**: 2026-02-27  
**Input**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [contracts/](contracts/)

---

## Task Format

Every task follows the checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **TaskID**: Sequential number (T001, T002, T003...)
- **[P]**: OPTIONAL marker if task can run in parallel (different files, no dependencies)
- **[Story]**: REQUIRED for user story tasks only (e.g., [US1], [US2])
  - Setup/Foundational/Polish phases: NO story label
  - User Story phases: MUST have story label
- **Description**: Clear action with exact file path

**Legend**:
- **[US1]**: User Story 1 — Content Author: Edit Text on a Page (P1)
- **[US2]**: User Story 2 — Developer: SDK Integration (P1)
- **[US3]**: User Story 3 — Multi-App & Multi-Language Support (P2)
- **[US4]**: User Story 4 — BWO Tax Forms Metadata-Driven Rendering (P2)
- **[US5]**: User Story 5 — Image Content Editing (P3)

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize Turborepo monorepo structure and basic tooling

- [x] T001 Create root `package.json` with workspaces `["packages/*", "apps/*"]` and Turborepo dev dependency
- [x] T002 Create `turbo.json` with pipelines for `build`, `dev`, `test` tasks
- [x] T003 [P] Create root `tsconfig.base.json` with TypeScript strict mode configuration
- [x] T004 [P] Create `.gitignore` for node_modules, dist, .DS_Store, .env files
- [x] T005 [P] Create `README.md` at repository root with project overview and architecture diagram
- [x] T006 Create `data/` directory for content storage
- [x] T007 Create `data/apps.config.json` with initial app registry (Demo App, BWO Tax Forms)
- [x] T008 [P] Create `data/images/` directory for uploaded images
- [x] T009 [P] Create `data/.gitkeep` to ensure directory is tracked
- [x] T010 [P] Add Prettier configuration (`.prettierrc.json`) for consistent formatting
- [x] T011 [P] Add ESLint configuration (`.eslintrc.json`) for TypeScript and React

**Checkpoint**: Basic monorepo structure ready. No build/compile yet. Can commit and push.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core SDK and shared infrastructure that BLOCKS all user stories

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete

### SDK Package Structure

- [x] T012 Create `packages/sdk/` directory structure
- [x] T013 Create `packages/sdk/package.json` with name `@contentflow/sdk`, version `1.0.0`, Vite and Zustand dependencies
- [x] T014 Create `packages/sdk/tsconfig.json` extending root tsconfig with lib mode settings
- [x] T015 Create `packages/sdk/vite.config.ts` for library mode build (ESM + CJS outputs)
- [x] T016 [P] Create `packages/sdk/src/index.ts` as public API entry point (empty for now)
- [x] T017 [P] Create `packages/sdk/src/types.ts` for TypeScript type definitions
- [x] T018 [P] Create `packages/sdk/vitest.config.ts` for unit testing configuration

### SDK Core Types & Interfaces

- [x] T019 Define `ContentMap` type in `packages/sdk/src/types.ts` as `Record<string, string>`
- [x] T020 Define `ContentFlowConfig` interface in `packages/sdk/src/types.ts` with appId, language, storageUrl, pages fields
- [x] T021 Define `IContentStorage` interface in `packages/sdk/src/adapters/IContentStorage.ts` with `read()` and `write()` methods
- [x] T022 Define `ContentFile` interface in `packages/sdk/src/types.ts` with `$meta` and content entries

### SDK Storage Adapter

- [x] T023 Create `packages/sdk/src/adapters/LocalJsonAdapter.ts` file
- [x] T024 Implement `LocalJsonAdapter.read(path)` method to fetch JSON via HTTP GET from storageUrl
- [x] T025 Implement error handling in `LocalJsonAdapter.read()` to return empty ContentMap on 404
- [x] T026 Implement `$meta` stripping in `LocalJsonAdapter.read()` before returning ContentMap
- [x] T027 Implement `LocalJsonAdapter.write(path, data)` method (placeholder for Phase 1, used by CMS server)

### SDK Zustand Store

- [x] T028 Create `packages/sdk/src/core/store.ts` file
- [x] T029 Define Zustand store schema with `config`, `contentMaps`, `status` state fields
- [x] T030 Implement `initialize` action in store to set config and trigger content fetching
- [x] T031 Implement `setLanguage` action in store to update language and refetch content
- [x] T032 Implement `getContent(pageId, contentId)` selector in store
- [x] T033 [P] Add error state handling for fetch failures in store

### SDK Initialization Logic

- [x] T034 Create `packages/sdk/src/core/ContentFlowSDK.ts` file
- [x] T035 Implement `ContentFlowSDK.initialize(config)` to populate store and eagerly fetch all page content files
- [x] T036 Implement parallel fetch logic using `Promise.all()` for all pages in config
- [x] T037 Implement graceful fallback for missing content files (log warning, continue)
- [x] T038 Export `ContentFlowSDK` from `packages/sdk/src/index.ts`

**Checkpoint**: SDK core ready (no UI components yet). Foundation complete. User story work can now begin.

---

## Phase 3: User Story 2 — Developer: Wrap Content with SDK Component (Priority: P1)

**Goal**: Enable developers to integrate ContentFlow SDK in React/Angular apps with zero-friction component wrapping

**Independent Test**: Render Demo App without CMS. All `<ContentComponent>` elements show `defaultText`. Add content JSON, reload — overrides appear.

### SDK React Adapter

- [x] T039 [P] [US2] Create `packages/sdk/src/react/` directory for React-specific exports
- [x] T040 [US2] Create `packages/sdk/src/react/ContentComponent.tsx` file
- [x] T041 [US2] Implement `useContent(contentId)` hook in `packages/sdk/src/react/hooks.ts` to subscribe to Zustand store
- [x] T042 [US2] Implement `ContentComponent` props interface with contentId, defaultText, defaultSrc, type, className, alt
- [x] T043 [US2] Implement `ContentComponent` render logic to show override or defaultText synchronously (no blank flash)
- [x] T044 [US2] Add `data-content-id` attribute automatically to rendered element in `ContentComponent`
- [x] T045 [US2] Implement image rendering when `type="image"` with `defaultSrc` fallback in `ContentComponent`
- [x] T046 [US2] Export `ContentComponent` and `useContent` from `packages/sdk/src/react/index.ts`
- [x] T047 [US2] Add React as peer dependency in `packages/sdk/package.json`

### SDK Web Component Adapter

- [x] T048 [P] [US2] Create `packages/sdk/src/webcomponent/` directory
- [x] T049 [US2] Create `packages/sdk/src/webcomponent/ContentElement.ts` custom element class
- [x] T050 [US2] Implement `<content-component>` custom element with observed attributes (content-id, default-text, type)
- [x] T051 [US2] Register custom element in `packages/sdk/src/webcomponent/index.ts`
- [x] T052 [US2] Implement content subscription and rendering in custom element lifecycle

### SDK Build & Bundle Size Validation

- [x] T053 [US2] Configure Vite library mode to output ESM and CJS bundles in `packages/sdk/vite.config.ts`
- [x] T054 [US2] Add build script to `packages/sdk/package.json`: `"build": "vite build"`
- [x] T055 [US2] Run `npm run build --workspace=packages/sdk` and verify dist/ folder created
- [x] T056 [US2] Measure bundle size with `gzip -c dist/index.js | wc -c` and confirm <15KB (SC-002)
- [ ] T057 [US2] Add bundle size check to CI pipeline (fail if >15KB gzipped) — DEFERRED to Phase 9 with T237

**Checkpoint**: SDK fully functional with React and Web Component adapters. Ready for consuming apps.

---

## Phase 4: User Story 2 (continued) — Demo App Integration

**Goal**: Prove SDK works in a real React app with multiple pages and content overrides

### Demo App Setup

- [x] T058 [US2] Create `apps/demo/` directory
- [x] T059 [US2] Initialize Vite React TypeScript project in `apps/demo/` with `npm create vite@latest`
- [x] T060 [US2] Add `@contentflow/sdk` workspace dependency in `apps/demo/package.json`
- [x] T061 [US2] Add Tailwind CSS to `apps/demo/` with config file
- [x] T062 [US2] Configure Vite dev server to run on port 3002 in `apps/demo/vite.config.ts`

### Demo App Pages

- [x] T063 [P] [US2] Create `apps/demo/src/pages/Home.tsx` with 5+ ContentComponent elements
- [x] T064 [P] [US2] Create `apps/demo/src/pages/About.tsx` with 3+ ContentComponent elements
- [x] T065 [P] [US2] Create `apps/demo/src/pages/Contact.tsx` with 3+ ContentComponent elements
- [x] T066 [US2] Add React Router in `apps/demo/src/App.tsx` with routes for Home, About, Contact
- [x] T067 [US2] Create navigation header component in `apps/demo/src/components/Header.tsx` with links

### Demo App SDK Integration

- [x] T068 [US2] Initialize SDK in `apps/demo/src/main.tsx` with `ContentFlowSDK.initialize()` before ReactDOM.render
- [x] T069 [US2] Configure SDK with `appId: 'demo'`, `language: 'en-US'`, `storageUrl: '/data'`, `pages: ['home', 'about', 'contact']`
- [x] T070 [US2] Ensure all `<ContentComponent>` elements in pages have `data-content-id` attributes
- [x] T071 [US2] Test rendering with no content JSON files — verify defaultText appears (Acceptance Scenario 1)
- [x] T072 [US2] Create `data/demo-home-en-US.json` with content overrides
- [x] T073 [US2] Create `data/demo-about-en-US.json` with content overrides
- [x] T074 [US2] Create `data/demo-contact-en-US.json` with content overrides
- [x] T075 [US2] Test rendering with content JSON files — verify overrides appear (Acceptance Scenario 2)
- [x] T076 [US2] Create `data/demo-home-es-ES.json` for Spanish locale
- [x] T077 [US2] Test rendering with `language: 'es-ES'` config — verify Spanish file fetched (Acceptance Scenario 3)

### Demo App CMS Mode Support

- [x] T078 [US2] Create `apps/demo/src/services/cmsMode.ts` file
- [x] T079 [US2] Implement postMessage listener for `CONTENTFLOW_CMS_INIT` in cmsMode.ts
- [x] T080 [US2] Send `CONTENTFLOW_CMS_ACK` response on initialization
- [x] T081 [US2] Add click handlers to all `[data-content-id]` elements on CMS init
- [x] T082 [US2] Send `CONTENTFLOW_CONTENT_CLICK` message on element click
- [x] T083 [US2] Implement `CONTENTFLOW_PREVIEW_UPDATE` handler for live preview
- [x] T084 [US2] Call `initCMSMode()` from `apps/demo/src/main.tsx` when `?cms-mode=true` query param present

**Checkpoint**: Demo App fully functional standalone and CMS-ready. US2 acceptance scenarios all passing.

---

## Phase 5: User Story 1 — Content Author: Edit Text on a Page (Priority: P1)

**Goal**: Enable content authors to visually edit text content through CMS UI

**Independent Test**: Run CMS, edit text field, save, reload Demo App — new text appears

### CMS App Setup

- [x] T085 [US1] Create `apps/cms/` directory
- [x] T086 [US1] Initialize Vite React TypeScript project in `apps/cms/`
- [x] T087 [US1] Add Redux Toolkit and React Redux dependencies in `apps/cms/package.json`
- [x] T088 [US1] Add Tailwind CSS to `apps/cms/` with custom theme colors
- [x] T089 [US1] Configure Vite dev server to run on port 3000 in `apps/cms/vite.config.ts`

### CMS Redux Store

- [x] T090 [US1] Create `apps/cms/src/store/store.ts` and configure RTK store
- [x] T091 [P] [US1] Create `apps/cms/src/store/appsSlice.ts` with apps registry state
- [x] T092 [P] [US1] Create `apps/cms/src/store/uiSlice.ts` with selectedAppId, selectedPageId, selectedLanguage
- [x] T093 [P] [US1] Create `apps/cms/src/store/contentSlice.ts` with contentCache, dirtyContent, saveStatus
- [x] T094 [US1] Implement `fetchApps` thunk in appsSlice to load `apps.config.json` from server
- [x] T095 [US1] Implement `fetchContent` thunk in contentSlice to load page content JSON
- [x] T096 [US1] Implement `saveContent` thunk in contentSlice to POST content to server

### CMS Node.js Server

- [x] T097 [US1] Create `apps/cms/server/` directory for Express server
- [x] T098 [US1] Create `apps/cms/server/index.ts` with Express app on port 3010
- [x] T099 [US1] Add CORS middleware in `apps/cms/server/middleware/cors.ts` for localhost origins
- [x] T100 [US1] Create `apps/cms/server/routes/content.ts` file
- [x] T101 [US1] Implement `GET /api/content/:filename` endpoint to read JSON files from `data/` directory
- [x] T102 [US1] Implement `POST /api/content/:filename` endpoint to write JSON files to `data/` directory
- [x] T103 [US1] Implement `$meta` auto-generation (version increment, updatedAt timestamp) in POST handler
- [x] T104 [US1] Implement filename validation (kebab-case, matches $meta fields) in POST handler
- [x] T105 [US1] Implement content key validation (kebab-case, 3-100 chars, no `$meta` key) in POST handler
- [x] T106 [US1] Add error handling for malformed JSON, missing files, file system errors
- [x] T107 [US1] Add `GET /api/apps` endpoint to serve `apps.config.json`
- [x] T108 [US1] Update `apps/cms/package.json` with server start script: `"server": "tsx watch server/index.ts"`

### CMS UI Components - Dashboard

- [x] T109 [US1] Create `apps/cms/src/components/Dashboard.tsx` component
- [x] T110 [US1] Implement app cards grid in Dashboard component (fetches from appsSlice)
- [x] T111 [US1] Add click handler to select app (dispatches action to uiSlice)
- [x] T112 [US1] Style Dashboard with Tailwind grid layout and hover effects

### CMS UI Components - Page Selector

- [x] T113 [US1] Create `apps/cms/src/components/PageSelector.tsx` sidebar component
- [x] T114 [US1] Render list of pages for selectedAppId from appsSlice
- [x] T115 [US1] Add click handler to select page (dispatches action to uiSlice)
- [x] T116 [US1] Highlight active page in list
- [x] T117 [US1] Style PageSelector with Tailwind sidebar layout

### CMS UI Components - Preview Panel

- [x] T118 [US1] Create `apps/cms/src/components/PreviewPanel.tsx` component
- [x] T119 [US1] Render `<iframe>` with src = `{app.baseUrl}{page.path}?cms-mode=true`
- [x] T120 [US1] Send `CONTENTFLOW_CMS_INIT` postMessage to iframe on load
- [x] T121 [US1] Listen for `CONTENTFLOW_CMS_ACK` with 3-second timeout
- [x] T122 [US1] Display warning banner if ACK not received: "This app does not support CMS mode. Preview only." (FR-021)
- [x] T123 [US1] Listen for `CONTENTFLOW_CONTENT_CLICK` messages from iframe
- [x] T124 [US1] Dispatch action to open EditorPanel with clicked contentId and currentValue
- [x] T125 [US1] Implement desktop/mobile preview toggle (viewportMode state)
- [x] T126 [US1] Style iframe with responsive width based on viewportMode

### CMS UI Components - Editor Panel

- [x] T127 [US1] Create `apps/cms/src/components/EditorPanel.tsx` side panel component
- [x] T128 [US1] Render contentId label and textarea for text editing
- [x] T129 [US1] Implement controlled input with local state + debounced update to dirtyContent
- [x] T130 [US1] Send `CONTENTFLOW_PREVIEW_UPDATE` postMessage on input change (debounced 300ms)
- [x] T131 [US1] Implement Save button (disabled if no dirty content)
- [x] T132 [US1] Dispatch `saveContent` thunk on Save click
- [x] T133 [US1] Show inline success notification on save complete (SC-001: <2s)
- [x] T134 [US1] Show inline error notification on save failure with error message (FR-020)
- [x] T135 [US1] Implement Discard button to reset dirty content
- [x] T136 [US1] Style EditorPanel with Tailwind slide-in animation

### CMS App Layout & Routing

- [x] T137 [US1] Create `apps/cms/src/App.tsx` with three-column layout: PageSelector (left), PreviewPanel (center), EditorPanel (right)
- [x] T138 [US1] Render Dashboard when no app selected, Layout when app selected
- [x] T139 [US1] Add Redux Provider in `apps/cms/src/main.tsx`
- [x] T140 [US1] Add concurrent start script in root `package.json`: `"dev": "turbo run dev"`
- [x] T141 [US1] Test full edit flow: Open CMS → Select Demo App → Select Home → Click element → Edit → Save (Acceptance Scenarios 1-3)

**Checkpoint**: User Story 1 fully functional. Can edit text content end-to-end. MVP READY! 🎯

---

## Phase 6: User Story 3 — Content Author: Manage Multiple Apps & Languages (Priority: P2)

**Goal**: Enable content authors to manage content for multiple apps and locales

**Independent Test**: Register two apps in CMS, confirm app switching loads different page lists. Switch to es-ES, edit, save, confirm es-ES JSON updated without affecting en-US.

### Multi-App Support

- [x] T142 [US3] Update Dashboard to show all registered apps from `apps.config.json` (already implemented in T110)
- [x] T143 [US3] Test app switching: Select App A → verify pages list updates → Select App B → verify different pages list (Acceptance Scenario 1)
- [x] T144 [US3] Ensure contentCache in contentSlice is keyed by `${appId}-${pageId}-${lang}` to separate app content

### Language Switcher

- [x] T145 [US3] Create `apps/cms/src/components/LanguageSwitcher.tsx` dropdown component
- [x] T146 [US3] Populate dropdown with supported languages: en-US, es-ES (from config or hardcoded Phase 1)
- [x] T147 [US3] Add LanguageSwitcher to CMS header/toolbar area
- [x] T148 [US3] Dispatch `setLanguage` action in uiSlice on language selection
- [x] T149 [US3] Trigger `fetchContent` thunk with new language when language changes
- [x] T150 [US3] Update EditorPanel to show es-ES content values when language=es-ES (Acceptance Scenario 2)
- [x] T151 [US3] Verify language switch updates all editor fields within 200ms (SC-005)

### Locale-Specific Saves

- [x] T152 [US3] Update `saveContent` thunk to write to correct locale file: `${appId}-${pageId}-${lang}.json`
- [x] T153 [US3] Test: Switch to es-ES, edit content, save, verify `demo-home-es-ES.json` updated but `demo-home-en-US.json` unchanged (Acceptance Scenario 3)
- [x] T154 [US3] Handle missing locale files gracefully (show blank values in editor, create new file on first save)

**Checkpoint**: User Story 3 complete. Multi-app and multi-language support functional.

---

## Phase 7: User Story 4 — BWO Tax Forms: Metadata-Driven Form Rendering (Priority: P2)

**Goal**: Prove CMS works with complex metadata-driven consuming app

**Independent Test**: Run BWO Tax Forms standalone. All form labels show defaultText. Run with CMS overrides — labels change.

### BWO Tax Forms Setup

- [x] T155 [US4] Create `apps/bwo-tax-forms/` directory
- [x] T156 [US4] Initialize Vite React TypeScript project in `apps/bwo-tax-forms/`
- [x] T157 [US4] Add `@contentflow/sdk` workspace dependency in `apps/bwo-tax-forms/package.json`
- [x] T158 [US4] Add Tailwind CSS with custom government-form theme
- [x] T159 [US4] Configure Vite dev server to run on port 3001 in `apps/bwo-tax-forms/vite.config.ts`

### Form Metadata

- [x] T160 [P] [US4] Create `apps/bwo-tax-forms/src/metadata/` directory
- [x] T161 [P] [US4] Create `apps/bwo-tax-forms/src/metadata/home.json` with FormPageMeta schema
- [x] T162 [P] [US4] Create `apps/bwo-tax-forms/src/metadata/personal-info.json` with 5+ form fields
- [x] T163 [P] [US4] Create `apps/bwo-tax-forms/src/metadata/income.json` with 5+ form fields
- [x] T164 [US4] Define `FormPageMeta`, `FormSection`, `FormField` TypeScript types in `apps/bwo-tax-forms/src/types.ts`

### Form Rendering Components

- [x] T165 [US4] Create `apps/bwo-tax-forms/src/components/FormPage.tsx` component
- [x] T166 [US4] Implement metadata loader to import JSON files in FormPage component
- [x] T167 [US4] Render form sections with Flexbox layout and section cards
- [x] T168 [P] [US4] Create `apps/bwo-tax-forms/src/components/FormField.tsx` component
- [x] T169 [US4] Implement field type rendering (text, email, tel, number, select, textarea) in FormField
- [x] T170 [US4] Render labels using `<ContentComponent>` with `contentId` from metadata and `defaultText` from label field
- [x] T171 [US4] Add `data-content-id` attributes to all label elements (Acceptance Scenario 2)
- [x] T172 [US4] Implement client-side validation based on metadata validation rules
- [x] T173 [US4] Create `apps/bwo-tax-forms/src/components/ValidationError.tsx` for inline error display
- [x] T174 [US4] Test form submission with invalid field — verify inline error appears (Acceptance Scenario 3)
- [x] T175 [US4] Verify 10-field form renders in <100ms (SC-006)

### BWO App Navigation

- [x] T176 [US4] Create `apps/bwo-tax-forms/src/components/PageSidebar.tsx` navigation component
- [x] T177 [US4] List all pages from metadata directory in sidebar
- [x] T178 [US4] Add routing with React Router to switch between form pages
- [x] T179 [US4] Style with Tailwind: clean government aesthetic, responsive Flexbox

### BWO SDK Integration

- [x] T180 [US4] Initialize SDK in `apps/bwo-tax-forms/src/main.tsx` with `appId: 'bwo-taxforms'`
- [x] T181 [US4] Configure SDK with pages: `['home', 'personal-info', 'income']`
- [x] T182 [US4] Create `data/bwo-taxforms-home-en-US.json` content file
- [x] T183 [US4] Create `data/bwo-taxforms-personal-info-en-US.json` content file
- [x] T184 [US4] Create `data/bwo-taxforms-income-en-US.json` content file
- [x] T185 [US4] Test standalone rendering — all labels show defaultText (Acceptance Scenario 1)
- [x] T186 [US4] Add CMS override for `bwo-field-first-name` in personal-info JSON
- [x] T187 [US4] Test with CMS override — label shows override not defaultText (Acceptance Scenario 2)

### BWO CMS Mode Support

- [x] T188 [US4] Create `apps/bwo-tax-forms/src/services/cmsMode.ts` (copy from Demo App)
- [x] T189 [US4] Implement postMessage protocol handlers for CMS integration
- [x] T190 [US4] Call `initCMSMode()` from main.tsx when `?cms-mode=true` present
- [x] T191 [US4] Register BWO Tax Forms in `data/apps.config.json` with baseUrl `http://localhost:3001`

**Checkpoint**: User Story 4 complete. BWO Tax Forms fully integrated with CMS.

---

## Phase 8: User Story 5 — Image Content Editing (Priority: P3)

**Goal**: Enable image upload and replacement through CMS

**Independent Test**: Upload image in CMS, save, reload Demo App — uploaded image appears

### SDK Image Support

- [x] T192 [P] [US5] Extend `ContentComponent` to handle `type="image"` prop in `packages/sdk/src/react/ContentComponent.tsx`
- [x] T193 [P] [US5] Render `<img>` element when type=image with src from store or defaultSrc fallback
- [x] T194 [P] [US5] Add optional `alt` prop to ContentComponent for image accessibility

### CMS Image Upload UI

- [x] T195 [US5] Update EditorPanel to detect when `elementType === 'image'` from CONTENTFLOW_CONTENT_CLICK message
- [x] T196 [US5] Render file upload input instead of textarea when editing image content
- [x] T197 [US5] Show current image preview in EditorPanel when image selected
- [x] T198 [US5] Implement file validation: check file type (jpg, png, gif, svg, webp) and size (<5MB)
- [x] T199 [US5] Display error notification for invalid file type or oversized file

### CMS Image Upload Server

- [x] T200 [US5] Add `multer` dependency to `apps/cms/server/package.json` for multipart file uploads
- [x] T201 [US5] Create `apps/cms/server/routes/images.ts` file
- [x] T202 [US5] Implement `POST /api/images` endpoint with multer middleware
- [x] T203 [US5] Configure multer with file size limit (5MB) and allowed types
- [x] T204 [US5] Generate unique filename: `${appId}-${contentId}-${timestamp}.${ext}` in upload handler
- [x] T205 [US5] Save uploaded file to `data/images/` directory
- [x] T206 [US5] Return JSON response with generated path: `{ path: "/data/images/..." }`
- [x] T207 [US5] Handle upload errors (disk space, permissions) with 500 response

### Image Upload Flow Integration

- [x] T208 [US5] Implement file upload in EditorPanel: POST to `/api/images` on file selection
- [x] T209 [US5] Update dirtyContent with returned image path after successful upload
- [x] T210 [US5] Send CONTENTFLOW_PREVIEW_UPDATE with new image path for live preview
- [x] T211 [US5] Save content JSON with image path on Save button click
- [x] T212 [US5] Verify image upload completes within 500ms for 2MB file (SC-010)

### Demo App Image Content

- [x] T213 [US5] Add image ContentComponent to `apps/demo/src/pages/Home.tsx` with hero-image contentId
- [x] T214 [US5] Test image upload flow: CMS → Upload image → Save → Demo App shows uploaded image (Acceptance Scenarios)

**Checkpoint**: User Story 5 complete. Image editing fully functional.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final touches, documentation, and E2E validation

### Testing

- [ ] T215 [P] Add Vitest unit tests for `LocalJsonAdapter` in `packages/sdk/tests/unit/adapters.test.ts`
- [ ] T216 [P] Add Vitest unit tests for Zustand store in `packages/sdk/tests/unit/store.test.ts`
- [ ] T217 [P] Add Vitest unit tests for `ContentFlowSDK.initialize()` in `packages/sdk/tests/unit/sdk.test.ts`
- [ ] T218 [P] Add React Testing Library tests for `<ContentComponent>` in `packages/sdk/tests/unit/react.test.tsx`
- [ ] T219 [P] Add React Testing Library tests for CMS Dashboard component in `apps/cms/tests/components/Dashboard.test.tsx`
- [ ] T220 [P] Add React Testing Library tests for EditorPanel component in `apps/cms/tests/components/EditorPanel.test.tsx`

### E2E Tests

- [ ] T221 Install Playwright in root with `npm install -D @playwright/test`
- [ ] T222 Create `tests/e2e/` directory and configure `playwright.config.ts`
- [ ] T223 Create `tests/e2e/cms-edit-flow.spec.ts` file
- [ ] T224 Implement E2E test: Start all apps → Open CMS → Select Demo/Home → Click element → Edit text → Save → Reload Demo App → Verify new text appears
- [ ] T225 Create `tests/e2e/bwo-integration.spec.ts` file
- [ ] T226 Implement E2E test: CMS edit BWO label → Save → Reload BWO → Verify label changed
- [ ] T227 Run E2E tests and verify all pass

### Documentation

- [ ] T228 [P] Update root README.md with project overview, architecture diagram, quick start
- [ ] T229 [P] Create `packages/sdk/README.md` with SDK API reference and integration guide (based on contracts/sdk-api.md)
- [ ] T230 [P] Create `apps/cms/README.md` with CMS user guide and server API docs
- [ ] T231 [P] Create `apps/demo/README.md` with Demo App structure explanation
- [ ] T232 [P] Create `apps/bwo-tax-forms/README.md` with metadata schema docs
- [ ] T233 [P] Verify [quickstart.md](quickstart.md) instructions work end-to-end

### Code Quality

- [ ] T234 [P] Run ESLint across all workspaces and fix violations
- [ ] T235 [P] Run Prettier across all workspaces for consistent formatting
- [ ] T236 [P] Add husky pre-commit hook for linting and formatting
- [ ] T237 [P] Configure CI/CD pipeline (GitHub Actions) for build, test, lint

### Performance Validation

- [ ] T238 Verify SC-001: Content edit → save → visible in consuming app <2s (measure with timer)
- [ ] T239 Verify SC-002: SDK bundle size <15KB gzipped (already checked in T056)
- [ ] T240 Verify SC-003: ContentComponent renders default text with zero layout shift (visual inspection)
- [ ] T241 Verify SC-004: CMS supports 3 apps × 5 pages without performance degradation (load test)
- [ ] T242 Verify SC-005: Language switch in CMS updates fields <200ms (measure with timer)
- [ ] T243 Verify SC-006: BWO renders 10-field form <100ms (already checked in T175)
- [ ] T244 Verify SC-007: All apps run simultaneously without port conflicts (start all, check no errors)
- [ ] T245 Verify SC-008: Add new app requires only apps.config.json + SDK integration (manual test)
- [ ] T246 Verify SC-009: Node server responds to GET <50ms (measure with curl/Postman)
- [ ] T247 Verify SC-011: SDK initialization with 5 pages <300ms (measure in browser DevTools)

### Edge Cases

- [ ] T248 Test malformed JSON file handling — verify SDK falls back to defaultText and logs warning
- [ ] T249 Test CMS save failure — verify inline error notification appears with error message
- [ ] T250 Test image upload failure (oversized, wrong type) — verify error notification
- [ ] T251 Test consuming app without CMS mode support — verify warning banner appears after 3s timeout
- [ ] T252 Test concurrent edits (two browser tabs) — verify last write wins behavior
- [ ] T253 Test missing language file — verify fallback to en-US then defaultText
- [ ] T254 Test SDK initialize called after components mount — verify components re-render with content

**Checkpoint**: All polish tasks complete. System fully tested and documented.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS everything below
    ↓
Phase 3 (US2 - SDK Components) ← Must complete before consuming apps
    ↓
Phase 4 (US2 - Demo App) [can parallelize with Phase 5]
Phase 5 (US1 - CMS App)  [can parallelize with Phase 4]
    ↓
Phase 6 (US3 - Multi-App/Lang) [enhances CMS]
Phase 7 (US4 - BWO Tax Forms)  [independent app]
Phase 8 (US5 - Image Upload)   [enhances CMS + SDK]
    ↓
Phase 9 (Polish & Testing)
```

### User Story Dependencies

- **US2 (SDK Integration) - P1**: BLOCKS all consuming apps (Demo, BWO). Must complete Phase 2-3 first.
- **US1 (Content Edit) - P1**: Can start after Phase 2. Parallel with US2 Phase 4. Requires CMS server + UI.
- **US3 (Multi-App/Lang) - P2**: Depends on US1 complete (enhances existing CMS).
- **US4 (BWO Tax Forms) - P2**: Depends on US2 complete. Independent of US1/US3.
- **US5 (Image Upload) - P3**: Depends on US1 + US2 complete. Extends both CMS and SDK.

### Parallel Opportunities

**Within Phase 2 (Foundational)**:
- T016 [P], T017 [P], T018 [P] can run in parallel (different SDK files)
- T033 [P] can run parallel with other store tasks

**Within Phase 3 (US2 React Adapter)**:
- T039 [P] and T048 [P] can run in parallel (React vs Web Component)

**Within Phase 4 (US2 Demo Pages)**:
- T063 [P], T064 [P], T065 [P] can run in parallel (different pages)

**Within Phase 5 (CMS Redux)**:
- T091 [P], T092 [P], T093 [P] can run in parallel (different slices)

**Within Phase 7 (BWO Metadata)**:
- T160 [P], T161 [P], T162 [P], T163 [P] can run in parallel (different metadata files)
- T168 [P] can run parallel with FormPage work

**Within Phase 8 (Image Support)**:
- T192 [P], T193 [P], T194 [P] can run in parallel (SDK image work)

**Across Phases**:
- Phase 4 (Demo App) and Phase 5 (CMS App) can run in parallel after Phase 3 complete
- Phase 6 (US3) and Phase 7 (US4) can run in parallel after Phase 5 complete

**Within Phase 9 (Polish)**:
- All test tasks (T215 [P] - T220 [P]) can run in parallel
- All documentation tasks (T228 [P] - T233 [P]) can run in parallel
- All code quality tasks (T234 [P] - T237 [P]) can run in parallel

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

**Fastest Path to Demonstrable Value**:

1. ✅ Phase 1: Setup (T001-T011)
2. ✅ Phase 2: Foundational (T012-T038) — SDK core ready
3. ✅ Phase 3: US2 React Adapter (T039-T057) — SDK components ready
4. ✅ Phase 4: US2 Demo App (T058-T084) — Can render content with SDK
5. ✅ Phase 5: US1 CMS App (T085-T141) — Can edit content visually
6. **STOP and VALIDATE**: Full edit flow works: CMS → Edit → Save → Demo shows change
7. Deploy/demo if ready

**MVP Scope**: Delivers User Stories 1 & 2 (both P1). Core value proposition proven.

**Estimated Effort**: ~40-60 developer hours for MVP (T001-T141)

### Incremental Delivery

1. **Milestone 1 (MVP)**: Complete US1 + US2 → Working CMS + Demo App
   - Deliverable: Can edit text content in one app, one language
   - Test: E2E test T224 passes

2. **Milestone 2**: Add US3 (Multi-App/Lang) → T142-T154
   - Deliverable: Can manage 2+ apps, switch languages
   - Test: Manual validation T143, T153

3. **Milestone 3**: Add US4 (BWO Tax Forms) → T155-T191
   - Deliverable: Complex consuming app integrated
   - Test: E2E test T226 passes

4. **Milestone 4**: Add US5 (Image Upload) → T192-T214
   - Deliverable: Full text + image editing
   - Test: Image upload flow T214

5. **Milestone 5 (Production Ready)**: Polish → T215-T254
   - Deliverable: Tested, documented, performance-validated
   - Test: All SC criteria validated (T238-T247)

### Parallel Team Strategy

**With 3 developers**:

1. **Week 1**: All devs collaborate on Phase 1-2 (Setup + Foundational)
2. **Week 2**: 
   - Dev A: Phase 3 (SDK React Adapter)
   - Dev B: Phase 4 (Demo App setup)
   - Dev C: Phase 5 (CMS App setup + server)
3. **Week 3**:
   - Dev A: Phase 5 (CMS UI components)
   - Dev B: Phase 4 (Demo pages + CMS mode)
   - Dev C: Phase 6 (Multi-app/lang)
4. **Week 4**:
   - Dev A: Phase 7 (BWO Tax Forms)
   - Dev B: Phase 8 (Image upload)
   - Dev C: Phase 9 (Testing)
5. **Week 5**: All devs on Phase 9 (Polish + E2E + Docs)

---

## Task Summary

| Phase | Task Range | Count | Parallelizable | Estimated Hours |
|-------|------------|-------|----------------|-----------------|
| **Phase 1: Setup** | T001-T011 | 11 | 4 | 4-6h |
| **Phase 2: Foundational** | T012-T038 | 27 | 3 | 16-24h |
| **Phase 3: US2 SDK Components** | T039-T057 | 19 | 6 | 12-18h |
| **Phase 4: US2 Demo App** | T058-T084 | 27 | 3 | 16-24h |
| **Phase 5: US1 CMS App** | T085-T141 | 57 | 6 | 32-48h |
| **Phase 6: US3 Multi-App/Lang** | T142-T154 | 13 | 0 | 6-10h |
| **Phase 7: US4 BWO Tax Forms** | T155-T191 | 37 | 7 | 20-30h |
| **Phase 8: US5 Image Upload** | T192-T214 | 23 | 3 | 12-18h |
| **Phase 9: Polish** | T215-T254 | 40 | 12 | 20-30h |
| **TOTAL** | T001-T254 | **254 tasks** | **44 parallel** | **138-208 hours** |

**MVP Scope (US1+US2)**: T001-T141 = 141 tasks, 40-60 hours

**Parallel Efficiency**: With 3 developers, estimated delivery time reduced by ~40-50% in parallelizable phases.

---

## Notes

- **[P] Tasks**: Different files or independent work. Can run in parallel if team capacity allows.
- **[Story] Labels**: US1-US5 map to user stories from spec.md. Critical for traceability.
- **Acceptance Scenarios**: Referenced in task descriptions. Verify after implementation.
- **Constitution Compliance**: All tasks designed to comply with project principles (library-first, SOLID, KISS, test-first).
- **Tests are OPTIONAL**: Test tasks included per spec requirements. Skip if not needed for your workflow.
- **Commit Strategy**: Commit after each task or logical task group (e.g., all metadata files).
- **Stop at Checkpoints**: Validate story completion at each checkpoint before proceeding.

---

**Ready for Task Execution**: Use this document to track progress. Mark tasks complete with `- [x]` as you go. Celebrate at each checkpoint! 🎉
