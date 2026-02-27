# Feature Specification: ContentFlow CMS — Editable Content System

**Feature Branch**: `001-contentflow-cms`  
**Created**: 2026-02-27  
**Status**: Draft  
**Input**: Multi-app editable content management and delivery system with React CMS, framework-agnostic SDK, BWO Tax Forms consuming app, and Demo App.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Content Author: Edit Text on a Page (Priority: P1)

A content editor opens the CMS, selects an app (e.g., "BWO Tax Forms"), selects a page (e.g., "Home"), and sees a live preview of the page. They click on any text element that has a `data-content-id` attribute, type new content in a side panel editor, and save. The updated JSON is written to `data/{appId}-{pageId}-{lang}.json`. When the consuming app next renders, it displays the updated text.

**Why this priority**: This is the core value proposition of the system. Without content editing, nothing else matters.

**Independent Test**: Can be tested end-to-end by (1) running CMS, (2) editing one text field, (3) saving, (4) reloading the consuming demo app and confirming the new text appears.

**Acceptance Scenarios**:

1. **Given** the CMS is open and "Demo App" / "Home" page is selected, **When** the author clicks on an element with `data-content-id="hero-title"` and types "New Headline", **Then** the editor panel shows the field and a Save button becomes active.
2. **Given** the author clicks Save, **When** the write completes, **Then** `data/demo-home-en-US.json` contains `{ "hero-title": "New Headline" }`.
3. **Given** the Demo App renders its Home page, **When** the SDK has loaded the content file, **Then** the `<ContentComponent content-id="hero-title">` displays "New Headline" instead of its `default-text`.

---

### User Story 2 — Developer: Wrap Content with SDK Component (Priority: P1)

A developer integrating the SDK in React or Angular wraps any text/image in `<ContentComponent contentId="hero-title" defaultText="Welcome">`. On app init they call `ContentFlowSDK.initialize({ appId, language, storageUrl })`. The component automatically resolves and renders the correct content.

**Why this priority**: Without SDK integration, consuming apps cannot participate in the content system.

**Independent Test**: Render the Demo App without any CMS saved content. All `<ContentComponent>` elements render their `defaultText`. Then add a JSON file with overrides and reload — overrides appear.

**Acceptance Scenarios**:

1. **Given** no content JSON exists, **When** a `<ContentComponent contentId="x" defaultText="Hello">` renders, **Then** it displays "Hello".
2. **Given** a content JSON exists with `{ "x": "World" }`, **When** the SDK initializes and the component renders, **Then** it displays "World".
3. **Given** SDK is initialized with `language: "es-ES"`, **When** content is fetched, **Then** the file `{appId}-{pageId}-es-ES.json` is fetched preferentially.

---

### User Story 3 — Content Author: Manage Multiple Apps & Languages (Priority: P2)

The CMS shows an App Selector on the dashboard. Selecting an app shows its registered pages. The author can switch language via a dropdown and all editable fields update to show the locale-specific content. Saving writes to the locale-specific file.

**Why this priority**: Multi-app, multi-language support is a key differentiator but not required for initial MVP viability.

**Independent Test**: Register two apps in the CMS. Confirm app switching loads different page lists. Switch to `es-ES`, edit a field, save, confirm `es-ES` JSON is updated without affecting `en-US`.

**Acceptance Scenarios**:

1. **Given** two apps are registered, **When** the author selects App B, **Then** only App B's pages are listed.
2. **Given** language is switched to `es-ES`, **When** the editor panel opens for a field, **Then** it shows the `es-ES` value (or blank if not yet translated).
3. **Given** the author saves `es-ES` content, **When** `data/bwo-taxforms-home-es-ES.json` is written, **Then** the `en-US` file is unchanged.

---

### User Story 4 — BWO Tax Forms: Metadata-Driven Form Rendering (Priority: P2)

The BWO Tax Forms app reads a page metadata JSON describing form fields (labels, types, validations, layout). It renders a responsive, Flexbox-based form. Every label text uses `<ContentComponent>` so content can be overridden from the CMS. Pages are listed in a sidebar; selecting one renders that form.

**Why this priority**: Proves the CMS works with a complex real-world consuming app.

**Independent Test**: Run BWO Tax Forms standalone (mock SDK). All form labels render from `defaultText`. Then run with CMS-saved overrides and confirm labels change.

**Acceptance Scenarios**:

1. **Given** a page metadata JSON with 5 fields, **When** the page renders, **Then** all 5 fields appear with correct input types and labels.
2. **Given** a CMS override for label `bwo-field-first-name`, **When** the form renders, **Then** the label shows the CMS override, not `defaultText`.
3. **Given** form validation rules in metadata, **When** user submits with an invalid field, **Then** an inline error appears.

---

### User Story 5 — Image Content Editing (Priority: P3)

In the CMS, image elements with `data-content-id` can be replaced by uploading a new image URL. The SDK `<ContentComponent type="image">` renders the override URL or the `defaultSrc` prop.

**Why this priority**: Nice-to-have for completeness; text editing delivers the core value.

**Independent Test**: Set an image override URL in CMS, save, reload consuming app — image changes.

**Acceptance Scenarios**:

1. **Given** an image element with `contentId="hero-image"` and `defaultSrc="/img/default.png"`, **When** CMS sets override to `"/img/new.png"`, **Then** the consuming app renders `/img/new.png`.

---

### Edge Cases

- What happens when the content JSON file is malformed? SDK falls back to `defaultText` and logs a warning.
- What happens when two CMS users edit the same page simultaneously? Last write wins (Phase 1). Conflict detection is Phase 2.
- What if a `content-id` exists in JSX but not in the JSON? Render `defaultText` silently.
- What if language file is missing? Fall back to `en-US` file, then to `defaultText`.
- What if the SDK `initialize()` is called after components mount? Components re-render when the store updates.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: CMS MUST display a dashboard with registered apps as selectable cards.
- **FR-002**: CMS MUST list pages for the selected app.
- **FR-003**: CMS MUST render a live preview iframe/panel showing the selected page.
- **FR-004**: CMS MUST highlight elements with `data-content-id` on hover in the preview.
- **FR-005**: CMS MUST provide an editor side panel for the selected content element.
- **FR-006**: CMS MUST support text and image content types.
- **FR-007**: CMS MUST write saved content to `data/{appId}-{pageId}-{lang}.json`.
- **FR-008**: CMS MUST support language switching with per-locale file management.
- **FR-009**: SDK MUST expose `ContentFlowSDK.initialize({ appId, language, storageUrl })`.
- **FR-010**: SDK MUST expose `<ContentComponent contentId defaultText>` for React.
- **FR-011**: SDK MUST expose `<content-component contentId defaultText>` Web Component for Angular.
- **FR-012**: SDK MUST render `defaultText` synchronously before async content loads.
- **FR-013**: SDK MUST support `type="image"` with `defaultSrc` prop.
- **FR-014**: BWO Tax Forms MUST render forms from page metadata JSON.
- **FR-015**: BWO Tax Forms MUST use `<ContentComponent>` for all label text.
- **FR-016**: Demo App MUST have 3+ pages with `<ContentComponent>` elements.
- **FR-017**: All apps MUST be independently runnable on separate ports.

### Key Entities

- **App**: `{ id, name, description, pages[], defaultLanguage }` — registered consuming application.
- **Page**: `{ id, appId, name, url, previewUrl }` — a page within an app.
- **ContentMap**: `{ [contentId: string]: string }` — flat map of content overrides per page/locale.
- **ContentEntry**: `{ contentId, value, type: 'text'|'image', updatedAt }` — single editable item.
- **FormPageMeta**: `{ pageId, title, sections[{ fields[{ id, type, label, contentId, validation }] }] }` — BWO Tax Forms page definition.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Content edit → save → visible in consuming app in under 2 seconds (local JSON, no network).
- **SC-002**: SDK bundle size MUST be under 15KB gzipped.
- **SC-003**: `<ContentComponent>` renders default text with zero layout shift (no blank flash).
- **SC-004**: CMS supports at least 3 registered apps and 5 pages per app without performance degradation.
- **SC-005**: Language switch in CMS updates all editor fields within 200ms.
- **SC-006**: BWO Tax Forms renders a 10-field form from metadata in under 100ms.
- **SC-007**: All three apps (CMS, BWO, Demo) run simultaneously without port conflicts.
- **SC-008**: Adding a new consuming app requires only: register in `apps.config.json` + use SDK — no CMS code changes.
