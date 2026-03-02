# Implementation Tasks: AI-Powered Tooltips

## Phase 1: SDK Core (Tooltip Component)

### Task 1.1: Create TypeScript Types
**Files:**
- `packages/sdk/src/core/types.ts`

**Actions:**
- [X] Add `TooltipContent` interface
- [X] Add `TooltipConfig` interface
- [X] Export new types from `packages/sdk/src/index.ts`

**Acceptance:**
- Types compile without errors
- Types exported from SDK package

---

### Task 1.2: Extend Zustand Store
**Files:**
- `packages/sdk/src/core/store.ts`

**Actions:**
- [X] Add `tooltips: Record<string, TooltipContent>` to store state
- [X] Implement `loadTooltips(appId, pageId, language)` action
- [X] Implement `getTooltip(tooltipId)` selector
- [X] Update SDK initialization to call `loadTooltips()` 

**Acceptance:**
- Store compiles without errors
- Tooltips loaded on SDK init
- `getTooltip` returns correct tooltip or undefined

---

### Task 1.3: Create useTooltip Hook
**Files:**
- `packages/sdk/src/react/useTooltip.ts`

**Actions:**
- [X] Create `useTooltip(tooltipId)` hook
- [X] Use Zustand store selector
- [X] Return tooltip content or undefined
- [X] Export from `packages/sdk/src/react/index.ts`

**Acceptance:**
- Hook returns tooltip data from store
- Hook updates when language changes

---

### Task 1.4: Create TooltipComponent
**Files:**
- `packages/sdk/src/react/TooltipComponent.tsx`

**Actions:**
- [X] Create `TooltipComponent` with props interface
- [X] Implement tooltip toggle logic (useState)
- [X] Add info icon (ℹ️ or SVG)
- [X] Add tooltip popup with positioning (card/panel style)
- [X] Support `position` prop (left/right)
- [X] Add `data-tooltip-id` attribute
- [X] Handle click outside to close
- [X] Return null if `enabled === false`
- [X] Removed fallback message (content from CMS only)

**Styling:**
- [X] Use Tailwind classes
- [X] White background, shadow-2xl
- [X] Card/panel design (w-80 max-w-sm)
- [X] Responsive positioning

**Acceptance:**
- Component renders tooltip icon
- Clicking icon toggles tooltip
- Clicking outside closes tooltip
- Tooltip shows correct message

---

### Task 1.5: Build and Test SDK
**Files:**
- `packages/sdk/package.json`

**Actions:**
- [X] Run `npm run build --workspace=packages/sdk`
- [X] Verify dist files include new components
- [X] Check bundle size (~2KB expected)

**Acceptance:**
- SDK builds without errors
- TooltipComponent exported correctly
- Types available for consumers

---

## Phase 2: Content Files (Tooltip Data)

### Task 2.1: Create Tooltip Content Files
**Files:**
- `apps/server/content/bwo-taxforms/en-US/tooltips.json`
- `apps/server/content/bwo-taxforms/es-ES/tooltips.json`
- `apps/server/content/bwo-taxforms/fr-FR/tooltips.json`
- `apps/server/content/bwo-taxforms/de-DE/tooltips.json`
- `apps/server/content/bwo-taxforms/ja-JP/tooltips.json`

**Actions:**
- [X] Create inputHelp in content files with 5+ field tooltips:
  - ssn-help
  - firstName-help
  - lastName-help
  - wages-help
  - federal-tax-help, etc.
- [X] Add `$meta` object to each file
- [X] Add structure to all locales (translated text)

**Acceptance:**
- All 5 locale files updated
- Each has valid JSON structure
- Includes $meta with correct appId/lang

---

### Task 2.2: Upload Tooltip Files to Azure
**Files:**
- Azure Blob Storage

**Actions:**
- [ ] Upload `tooltips.json` files to Azure Blob:
  - `content/bwo-taxforms/en-US/tooltips.json`
  - `content/bwo-taxforms/es-ES/tooltips.json`
  - (and other locales)
- [ ] Verify files accessible via blob URL

**Acceptance:**
- Files uploaded to correct path
- Accessible via HTTPS

---

## Phase 3: BWO Tax Forms Integration

### Task 3.1: Update FormField Metadata Interface
**Files:**
- `apps/bwo-tax-forms/src/types/index.ts`

**Actions:**
- [X] Add `inputHelpId?: string` to `FormFieldType` interface
- [X] Removed inputHelpMessage (content from CMS only)

**Acceptance:**
- Types compile without errors
- FormField interface includes tooltip fields

---

### Task 3.2: Update Form Metadata JSON
**Files:**
- `apps/bwo-tax-forms/src/metadata/personal-info.json`
- `apps/bwo-tax-forms/src/metadata/income.json`

**Actions:**
- [X] Add `inputHelpId` to 5 fields in personal-info.json:
  - firstName → "firstName-help"
  - lastName → "lastName-help"
  - ssn → "ssn-help"
  - email → "email-help"
  - phone → "phone-help"
- [X] Add `inputHelpId` to 4 fields in income.json:
  - wages → "wages-help"
  - federalTax → "federal-tax-help"
  - interestIncome → "interest-income-help"
  - selfEmployment → "self-employment-help"

**Acceptance:**
- Metadata JSON valid
- Fields reference correct tooltip IDs

---

### Task 3.3: Update FormField Component
**Files:**
- `apps/bwo-tax-forms/src/components/FormField.tsx`

**Actions:**
- [X] Import `InputHelpComponent` from SDK
- [X] Add InputHelpComponent next to input field
- [X] Pass `inputHelpId`, `data-input-help-id`
- [X] Set `position="right"` for form tooltips
- [X] Conditionally render only if `field.inputHelpId` exists

**Acceptance:**
- FormField renders with tooltip icon
- Tooltip appears when clicked
- No errors in console

---

### Task 3.4: Update SDK Initialization
**Files:**
- `apps/bwo-tax-forms/src/main.tsx`

**Actions:**
- [X] Verify SDK init includes tooltip loading
- [X] No code changes needed (handled by SDK)

**Acceptance:**
- Tooltips load on app initialization
- No console errors

---

### Task 3.5: Build BWO Tax Forms
**Files:**
- `apps/bwo-tax-forms/`

**Actions:**
- [X] Run `npm run build --workspace=apps/bwo-tax-forms`
- [X] Verify no TypeScript errors
- [X] Check bundle size impact

**Acceptance:**
- App builds successfully
- No compilation errors

---

## Phase 4: CMS Integration

### Task 4.1: Extend uiSlice for Input Help Editor
**Files:**
- `apps/cms/src/store/uiSlice.ts`

**Actions:**
- [ ] Add `selectedInputHelpId: string | null` to UiState
- [ ] Add `inputHelpEditorOpen: boolean` to UiState
- [ ] Create `openInputHelpEditor` action
- [ ] Create `closeInputHelpEditor` action

**Acceptance:**
- uiSlice compiles without errors
- State includes input help editor fields

---

### Task 4.2: Create InputHelpEditorPanel Component
**Files:**
- `apps/cms/src/components/InputHelpEditorPanel.tsx`

**Actions:**
- [ ] Create InputHelpEditorPanel component following EditorPanel pattern
- [ ] Add enable/disable toggle
- [ ] Add icon type selector (info/exclamation)
- [ ] Add message textarea
- [ ] Add save/cancel buttons
- [ ] Connect to Redux store (uiSlice + contentSlice)
- [ ] Style with Tailwind (match EditorPanel design)

**Acceptance:**
- Component renders when inputHelpEditorOpen === true
- All form controls work correctly
- Styling matches existing CMS design

---

### Task 4.3: Update contentSlice for Input Help Saves
**Files:**
- `apps/cms/src/store/contentSlice.ts`

**Actions:**
- [ ] Add `inputHelpData: Record<string, InputHelpContent>` to state
- [ ] Create `updateInputHelpContent` action
- [ ] Update `saveContent` to handle inputHelp saves
- [ ] Update content cache to include inputHelp

**Acceptance:**
- contentSlice compiles without errors
- Input help data saves to content files
- Preview updates with new input help

---

### Task 4.4: Update PreviewPanel for Input Help Scanning
**Files:**
- `apps/cms/src/components/PreviewPanel.tsx`

**Actions:**
- [ ] Add listener for CONTENTFLOW_INPUTHELP_CLICK messages
- [ ] Dispatch openInputHelpEditor when input help clicked
- [ ] Send CONTENTFLOW_INPUTHELP_UPDATE on save
- [ ] Add input help data to preview initialization

**Acceptance:**
- PreviewPanel listens for input help clicks
- Input help editor opens on click
- Preview updates when input help saved

---

### Task 4.5: Update BWO App for CMS Mode Input Help
**Files:**
- `packages/sdk/src/react/InputHelpComponent.tsx`

**Actions:**
- [ ] Add CMS mode detection (?cms-mode=true)
- [ ] Send CONTENTFLOW_INPUTHELP_CLICK on icon click in CMS mode
- [ ] Add hover highlight effect in CMS mode
- [ ] Add pencil/gear icon overlay in CMS mode

**Acceptance:**
- Input help icons clickable in CMS mode
- Clicking sends postMessage to parent
- Hover shows pencil icon overlay

---

### Task 4.6: Wire Up InputHelpEditorPanel in CMS
**Files:**
- `apps/cms/src/pages/Editor.tsx` (or main CMS layout)

**Actions:**
- [ ] Import InputHelpEditorPanel
- [ ] Render alongside EditorPanel
- [ ] Ensure only one editor panel open at a time

**Acceptance:**
- InputHelpEditorPanel visible in CMS
- Opens/closes correctly
- Does not conflict with EditorPanel

---

### Task 4.7: Build and Test CMS
**Files:**
- `apps/cms/`

**Actions:**
- [ ] Run `npm run build --workspace=apps/cms`
- [ ] Test locally: open CMS, navigate to BWO form
- [ ] Hover over input with help → verify pencil icon
- [ ] Click pencil → verify editor opens
- [ ] Edit help message → save → verify preview updates
- [ ] Test all form controls (toggle, icon type, message)

**Acceptance:**
- CMS builds successfully
- Input help editing workflow works end-to-end
- No console errors

---

## Phase 5: Deployment & Verification

### Task 5.1: Build All Apps
**Files:**
- Root workspace

**Actions:**
- [ ] Run `npm run build:deploy` from root
- [ ] Verify all apps build:
  - SDK
  - CMS
  - BWO Tax Forms
  - Demo
  - Customer Portal

**Acceptance:**
- All builds complete successfully
- Built files copied to `apps/server/public/`

---

### Task 5.2: Test Locally
**Files:**
- Local development server

**Actions:**
- [ ] Start local server: `cd apps/server && bun run dev`
- [ ] Navigate to CMS: `http://localhost:3000`
- [ ] Load BWO Tax Forms in iframe
- [ ] Hover over inputs → verify pencil icons
- [ ] Click pencil → verify input help editor opens
- [ ] Edit help message → save → verify preview updates
- [ ] Test all 5 locales (EN, ES, FR, DE, JA)

**Acceptance:**
- Tooltips visible in all forms
- CMS editor workflow works
- Language switching works
- No console errors

---

### Task 5.3: Deploy to Azure
**Files:**
- Azure Container Apps

**Actions:**
- [ ] Run `cd pulumi && pulumi up --yes`
- [ ] Wait for deployment (Docker build + push)
- [ ] Verify Container App restarted

**Acceptance:**
- Deployment completes without errors
- Container App running new image

---

### Task 5.4: Test Production
**Files:**
- Production environment

**Actions:**
- [ ] Navigate to production CMS
- [ ] Verify input help editing works
- [ ] Test language switching
- [ ] Verify input help saves to Azure Blob

**Acceptance:**
- Input help editing functional in production
- No console errors
- All locales work

---

## Task Summary

**Total Tasks:** 21
**Estimated Time:** 5-6 hours

**Breakdown:**
- SDK Core (5 tasks): ~90 min
- Content Files (2 tasks): ~20 min
- BWO Integration (5 tasks): ~60 min
- CMS Integration (7 tasks): ~120 min
- Deployment (4 tasks): ~30 min

## Dependencies

- Existing ContentFlow SDK must be functional
- Azure Blob Storage must be accessible
- BWO Tax Forms metadata structure must be stable

## Success Criteria

- [ ] TooltipComponent renders in BWO Tax Forms
- [ ] At least 5 fields have functional tooltips
- [ ] Tooltips work in all 5 languages
- [ ] Production deployment successful
- [ ] No breaking changes to existing functionality
- [ ] Bundle size increase < 5KB
