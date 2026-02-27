# Tasks: ContentFlow CMS — Editable Content System

**Input**: `/specs/001-contentflow-cms/plan.md` + `spec.md`  
**Branch**: `001-contentflow-cms`  
**Date**: 2026-02-27

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks
- **[Story]**: US1=Content Edit, US2=SDK Dev, US3=Multi-App/Lang, US4=BWO Forms, US5=Images

---

## Phase 0: Monorepo Bootstrap

- `T001` [US2] Initialize monorepo root with `package.json` workspaces pointing to `packages/*` and `apps/*`
- `T002` [US2] Add `turbo.json` with `build`, `dev`, `test` pipelines
- `T003` [US2] Add root `tsconfig.base.json` with strict TypeScript settings
- `T004` [US2] Create `data/` directory with `apps.config.json` (Demo App + BWO Tax Forms registered)
- `T005` [P][US2] Create `data/demo-home-en-US.json` with 5 sample content entries
- `T006` [P][US2] Create `data/demo-home-es-ES.json` with Spanish equivalents
- `T007` [P][US4] Create `data/bwo-taxforms-personal-info-en-US.json`

---

## Phase 1: SDK (`packages/sdk`) — US2 (P1)

- `T010` [US2] Scaffold `packages/sdk` with Vite library mode + TypeScript
- `T011` [US2] **TEST FIRST**: Write Vitest tests for `IContentStorage` contract
- `T012` [US2] Define `IContentStorage` interface and `ContentMap` type in `src/adapters/IContentStorage.ts`
- `T013` [US2] **TEST FIRST**: Write Vitest tests for `LocalJsonAdapter` (fetch JSON, return ContentMap, handle 404)
- `T014` [US2] Implement `LocalJsonAdapter` — fetches `{storageUrl}/{appId}-{pageId}-{lang}.json`
- `T015` [US2] Implement Zustand store: `{ contentMaps, language, appId }` + actions `setContent`, `setLanguage`
- `T016` [US2] **TEST FIRST**: Write tests for `ContentFlowSDK.initialize()` — sets store, fetches all page content
- `T017` [US2] Implement `ContentFlowSDK.initialize({ appId, language, storageUrl, pages })` 
- `T018` [US2] **TEST FIRST**: Write React Testing Library tests for `<ContentComponent>` — renders defaultText, renders override, re-renders on language change
- `T019` [US2] Implement `ContentComponent.tsx` — subscribes to Zustand store, renders override or defaultText
- `T020` [US2] Implement `ContentWebComponent.ts` — custom element `<content-component>` wrapping same logic
- `T021` [US2] Export all public API from `src/index.ts`
- `T022` [US2] Build SDK and verify bundle < 15KB gzipped

---

## Phase 2: CMS App (`apps/cms`) — US1 (P1) + US3 (P2)

### Setup
- `T030` [US1] Scaffold `apps/cms` with Vite + React 18 + TypeScript + Tailwind CSS
- `T031` [US1] Set up RTK store with slices: `appsSlice`, `pagesSlice`, `editorSlice`, `languageSlice`
- `T032` [US1] Create Node.js/Express dev server (`cms-server`) for JSON file read/write (in `apps/cms/server/`)
- `T033` [US1] **TEST FIRST**: Test `contentService.ts` — `getContent(appId, pageId, lang)`, `saveContent(...)` 

### App Dashboard (US3)
- `T034` [P][US3] **TEST FIRST**: Test `AppCard` component renders app name and page count
- `T035` [P][US3] Implement App Dashboard page — grid of `AppCard` components from `apps.config.json`
- `T036` [P][US3] Implement `appsSlice` — `fetchApps()` thunk reads `apps.config.json` from server

### Page Selector (US1)
- `T040` [US1] Implement Page Selector sidebar — list of pages for selected app
- `T041` [US1] Implement page preview panel — `<iframe>` pointing to consuming app's page URL with `?cms-mode=true`

### Content Editor (US1)
- `T042` [US1] Implement content element highlighting — CMS injects script into iframe; elements with `data-content-id` get hover highlight ring
- `T043` [US1] Implement postMessage protocol between CMS iframe and consuming app for click events
- `T044` [US1] Implement Editor Side Panel — shows selected `contentId`, current value, editable textarea
- `T045` [US1] **TEST FIRST**: Test save action writes correct JSON structure
- `T046` [US1] Implement Save action — `PATCH` to `cms-server`, updates locale JSON file
- `T047` [US1] Implement unsaved changes indicator and discard dialog

### Language Switcher (US3)
- `T050` [P][US3] Implement language switcher dropdown (en-US, es-ES, fr-FR)
- `T051` [P][US3] On language switch, reload editor panel with locale-specific content values
- `T052` [P][US3] Saving in non-default locale writes to locale-specific file only

### UI Polish
- `T060` [P][US1] Design CMS layout: left sidebar (apps+pages), center preview, right editor panel
- `T061` [P][US1] Add animated transitions between app/page selections (Tailwind CSS)
- `T062` [P][US1] Add empty state illustrations for no-app-selected and no-page-selected states
- `T063` [P][US1] Add toast notifications for save success/error

---

## Phase 3: BWO Tax Forms App (`apps/bwo-tax-forms`) — US4 (P2)

- `T070` [US4] Scaffold `apps/bwo-tax-forms` with Vite + React 18 + TypeScript + Tailwind (port 3001)
- `T071` [US4] Initialize `@contentflow/sdk` in `main.tsx` with `appId: "bwo-taxforms"`
- `T072` [US4] **TEST FIRST**: Test `FormRenderer` renders fields from metadata JSON
- `T073` [US4] Implement `FormRenderer.tsx` — reads `FormPageMeta`, renders sections and fields
- `T074` [US4] Implement form field components: `TextField`, `SelectField`, `DateField`, `PasswordField`
- `T075` [US4] Add client-side validation with inline error messages per validation rules in metadata
- `T076` [US4] Create metadata JSONs for 3 pages: `personal-info.json`, `income.json`, `deductions.json`
- `T077` [US4] Implement sidebar navigation between tax form pages
- `T078` [US4] Apply `data-content-id` attributes to all labels for CMS discoverability
- `T079` [US4] Style with Tailwind: clean government-form aesthetic with Flexbox layout, section cards

---

## Phase 4: Demo App (`apps/demo`) — US2 + US1 Proof

- `T080` [US2] Scaffold `apps/demo` with Vite + React 18 + TypeScript + Tailwind (port 3002)
- `T081` [US2] Initialize `@contentflow/sdk` in `main.tsx`
- `T082` [US2] Create 4 pages: Home, About, Services, Contact — each with 3-5 `<ContentComponent>` elements
- `T083` [US2] Add `data-content-id` attributes for CMS discoverability
- `T084` [US2] Add page navigation with React Router
- `T085` [US2] Support `?lang=es-ES` query param to demo language switching

---

## Phase 5: Image Support — US5 (P3)

- `T090` [P][US5] Extend `ContentComponent` with `type="image"` and `defaultSrc` prop
- `T091` [P][US5] Extend CMS editor panel with image URL input when `type=image`
- `T092` [P][US5] Extend `ContentMap` type to allow image entries: `{ type: "image", value: string }`

---

## Phase 6: Integration & Docs

- `T100` [US1] Write E2E Playwright test: CMS edit → save → Demo App reflects change
- `T101` [US4] Write E2E Playwright test: CMS edit → save → BWO Tax Forms label changes
- `T102` Write root `README.md`: architecture overview, quick start for all 3 apps
- `T103` Write `packages/sdk/README.md`: SDK API reference and integration guide
- `T104` Add `.github/copilot-instructions/copilot-instructions.md` workspace instructions for Copilot

---

## Dependency Order

```
T001-T007 (Bootstrap)
    → T010-T022 (SDK)
        → T030-T063 (CMS) [parallel with T070-T085]
        → T070-T079 (BWO)
        → T080-T085 (Demo)
            → T090-T092 (Images, optional)
                → T100-T104 (Integration)
```
