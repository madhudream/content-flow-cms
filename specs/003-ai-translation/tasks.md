# Implementation Tasks: AI-Powered Translation

**Feature**: 003-ai-translation  
**Status**: Not Started  
**Created**: 2026-02-28  
**Based on**: [spec.md](spec.md), [plan.md](plan.md)

---

## Task Overview

| Phase | Tasks | Status | Est. Time |
|-------|-------|--------|-----------|
| Phase 1: Batch Translation Service | 7 | Not Started | 3 days |
| Phase 2: API Endpoints | 4 | Not Started | 1.5 days |
| Phase 3: Cost Tracking | 4 | Not Started | 1.5 days |
| Phase 4: SDK Language Support | 4 | Not Started | 1 day |
| Phase 5: CMS UI Components | 5 | Not Started | 2.5 days |
| Phase 6: Glossary Management | 4 | Not Started | 1.5 days |
| Phase 7: Testing | 5 | Not Started | 2 days |
| Phase 8: Documentation | 3 | Not Started | 1 day |
| **Total** | **36** | **0/36** | **~14 days** |

---

## Phase 1: Batch Translation Service (Story 1)

### S1.T1: Set up OpenAI Batch API integration
- [ ] **Status**: Not Started
- **Files**: `apps/server/package.json`, `apps/server/src/services/TranslationService.ts`
- **Description**:
  - Install `openai` npm package (v4.x)
  - Create `TranslationService.ts` with OpenAI client initialization
  - Add environment variables: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_TEMPERATURE`
  - Test connection with OpenAI Batch API
- **Dependencies**: None
- **Acceptance Criteria**:
  - OpenAI client successfully initializes with API key
  - Can access Batch API endpoints
  - Environment variables documented in `.env.example`
- **Effort**: 2 hours

### S1.T2: Implement batch preparation (JSONL format)
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/utils/batchPreparer.ts`, `apps/server/src/services/TranslationService.ts`
- **Description**:
  - Create utility to scan all content files
  - Build JSONL batch file with translation requests
  - Each request includes: custom_id, method, url, body (messages, model, temperature)
  - Support filtering by appId
  - Include glossary in prompts
- **Dependencies**: S1.T1
- **Acceptance Criteria**:
  - Can scan 11 content files and generate 44 translation requests (4 languages)
  - JSONL file format is valid per OpenAI spec
  - Custom IDs follow pattern: `{appId}-{pageId}-{lang}`
  - Glossary properly injected into prompts
- **Effort**: 4 hours

### S1.T3: Implement batch upload and job creation
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/services/TranslationService.ts`
- **Description**:
  - Upload JSONL file to OpenAI Files API
  - Create batch job with uploaded file ID
  - Set completion_window to '24h'
  - Store batch metadata in blob storage
  - Return batch ID to caller
- **Dependencies**: S1.T2
- **Acceptance Criteria**:
  - Can upload batch file successfully
  - Batch job is created with correct endpoint and completion window
  - Batch metadata stored: `translation-batches/{batchId}.json`
  - Returns batch ID for status tracking
- **Effort**: 3 hours

### S1.T4: Implement batch status polling
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/services/TranslationService.ts`
- **Description**:
  - Create method to retrieve batch status from OpenAI
  - Parse status: validating, in_progress, finalizing, completed, failed
  - Extract progress: total, completed, failed request counts
  - Return structured status response
- **Dependencies**: S1.T3
- **Acceptance Criteria**:
  - Can poll batch status by ID
  - Returns all status fields: status, progress, createdAt, completedAt
  - Handles all batch statuses correctly
- **Effort**: 2 hours

### S1.T5: Implement batch results processing
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/services/TranslationService.ts`
- **Description**:
  - Download output file from completed batch
  - Parse JSONL output (one result per line)
  - Extract custom_id and translated content
  - Validate each translation
  - Save translated files to storage
  - Handle failed translations gracefully
- **Dependencies**: S1.T4
- **Acceptance Criteria**:
  - Can download and parse batch output file
  - Saves valid translations to: `{appId}-{pageId}-{lang}.json`
  - Logs failures without stopping processing
  - Returns summary: files translated, files failed
- **Effort**: 4 hours

### S1.T6: Implement cost calculation from usage data
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/services/TranslationService.ts`, `apps/server/src/services/CostTrackingService.ts`
- **Description**:
  - Extract token usage from batch results
  - Calculate cost with Batch API pricing (50% discount)
  - Input: $0.075 per 1M tokens
  - Output: $0.300 per 1M tokens
  - Return detailed cost breakdown
- **Dependencies**: S1.T5
- **Acceptance Criteria**:
  - Accurately calculates input and output token costs
  - Applies 50% Batch API discount
  - Returns: inputTokens, outputTokens, totalCost, costPerFile
- **Effort**: 2 hours

### S1.T7: Add translation validation
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/utils/validateTranslation.ts`
- **Description**:
  - Create validation utility to check translated content
  - Verify all source keys exist in translation
  - Check for empty translations
  - Detect potentially untranslated content (same as source)
  - Return structured validation result with errors/warnings
- **Dependencies**: S1.T5
- **Acceptance Criteria**:
  - Detects missing keys
  - Flags empty string translations
  - Warns about identical source/translation (except brand names)
  - Returns `{ valid: boolean, errors: string[], warnings: string[] }`
- **Effort**: 2 hours

---

## Phase 2: API Endpoints (Story 2)

### S2.T1: Create POST /api/translate/bulk endpoint
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/routes/translate.ts`
- **Description**:
  - Create new `/api/translate/bulk` route
  - Accept POST request with: `{ sourceLang, targetLangs, appIds? }`
  - Validate request body
  - Trigger batch preparation and upload
  - Return batch ID and estimated cost
- **Dependencies**: S1.T3
- **Acceptance Criteria**:
  - Returns 200 with `{ batchId, status: "validating", totalRequests, estimatedCost }`
  - Returns 400 for invalid request
  - Batch is created in OpenAI
  - Batch metadata saved to storage
- **Effort**: 2 hours

### S2.T2: Create GET /api/translate/batch/:batchId endpoint
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/routes/translate.ts`
- **Description**:
  - Accept GET request with batch ID
  - Query batch status from OpenAI
  - If completed, process results and calculate costs
  - Return progress and results
  - Handle batch not found (404)
- **Dependencies**: S2.T1, S1.T4, S1.T5
- **Acceptance Criteria**:
  - Returns 200 with batch status: `{ status, progress: { total, completed, failed }, createdAt, completedAt?, totalCost? }`
  - Returns 404 if batch ID not found
  - Automatically processes results when status is "completed"
  - Updates in real-time as batch progresses
- **Effort**: 2.5 hours

### S2.T3: Create GET /api/translate/batches endpoint (list recent)
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/routes/translate.ts`
- **Description**:
  - List recent batch jobs with metadata
  - Support limit query parameter (default: 10)
  - Return batch summary: ID, status, files translated, cost
  - Sort by creation date (newest first)
- **Dependencies**: S2.T1
- **Acceptance Criteria**:
  - Returns 200 with array of batches
  - Supports ?limit=N parameter
  - Data sorted by timestamp (newest first)
  - Includes all key fields: batchId, status, createdAt, completedAt, filesTranslated, totalCost
- **Effort**: 1.5 hours

### S2.T4: Add CORS and rate limiting for translation endpoints
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/index.ts`, `apps/server/src/routes/translate.ts`
- **Description**:
  - Ensure CORS allows CMS origin for translation endpoints
  - Add rate limiting: max 5 bulk translation requests per hour per IP
  - Add API key authentication (optional, future-proof)
- **Dependencies**: S2.T1, S2.T2
- **Acceptance Criteria**:
  - CORS headers present on all translation endpoints
  - Rate limiting returns 429 after 5 requests/hour
  - Rate limit resets after 60 minutes
- **Effort**: 1.5 hours

---

## Phase 3: Cost Tracking (Story 3)

### S3.T1: Create cost tracking storage structure
- [ ] **Status**: Not Started
- **Files**: `apps/server/content/costs/`, `apps/server/src/services/IContentStorage.ts`
- **Description**:
  - Create `costs/` directory in content storage
  - Define cost log JSON structure: `{ batchId, timestamp, filesTranslated, inputTokens, outputTokens, cost, costPerFile }`
  - Add cost CRUD methods to `IContentStorage` interface
  - Implement in LocalStorageService and AzureStorageService
- **Dependencies**: None
- **Acceptance Criteria**:
  - Can read/write cost data: `costs/translation-costs.json`
  - Cost log is an array of cost entries
  - Works in both local and Azure storage
- **Effort**: 2 hours

### S3.T2: Create CostTrackingService
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/services/CostTrackingService.ts`
- **Description**:
  - Create service for cost tracking operations
  - Methods: `saveCostData()`, `getCostSummary()`, `getCostHistory()`, `getCostByLanguage()`, `getCostByApp()`
  - Calculate aggregations: total cost, monthly cost, avg per batch
  - Support filtering by date range
- **Dependencies**: S4.T1
- **Acceptance Criteria**:
  - Can save cost data for a batch
  - Can retrieve cost summary with aggregations
  - Can get cost history with pagination
  - Can break down costs by language and app
- **Effort**: 3 hours

### S3.T3: Create cost tracking API endpoints
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/routes/costs.ts`
- **Description**:
  - GET `/api/costs/summary` - overall cost summary
  - GET `/api/costs/history?limit=50` - cost history
  - GET `/api/costs/by-language` - breakdown by language
  - GET `/api/costs/by-app` - breakdown by app
- **Dependencies**: S4.T2
- **Acceptance Criteria**:
  - All endpoints return proper HTTP status codes
  - Summary includes: totalCost, thisMonth, lastMonth, avgPerBatch
  - History supports limit parameter
  - Breakdowns calculate totals correctly
- **Effort**: 2 hours

### S3.T4: Integrate cost tracking into batch results processing
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/services/TranslationService.ts`
- **Description**:
  - After processing batch results, calculate total cost
  - Call CostTrackingService.saveCostData() with batch data
  - Include: batchId, timestamp, files translated, tokens, cost
  - Log cost data for debugging
- **Dependencies**: S1.T6, S3.T2
- **Acceptance Criteria**:
  - Cost data saved automatically after batch completion
  - Cost log persists to storage
  - Cost appears in cost history API
- **Effort**: 1.5 hours

---

## Phase 4: SDK Language Support (Story 4)

### S4.T1: Add language config to SDK
- [ ] **Status**: Not Started
- **Files**: `packages/sdk/src/config.ts`, `packages/sdk/src/index.ts`
- **Description**:
  - Extend `ContentFlowConfig` interface with language fields
  - Add: `language`, `fallbackLanguage`, `availableLanguages`
  - Update `initialize()` to accept language config
  - Store current language in SDK state
- **Dependencies**: None
- **Acceptance Criteria**:
  - Can initialize SDK with `language: 'es-ES'`
  - SDK loads content from `{appId}-{pageId}-es-ES.json`
  - Falls back to English if translation file missing (optional)
- **Effort**: 2 hours

### S4.T2: Implement setLanguage() method
- [ ] **Status**: Not Started
- **Files**: `packages/sdk/src/index.ts`
- **Description**:
  - Create `ContentFlowSDK.setLanguage(lang: string)` method
  - Reload all content for new language
  - Update all rendered components
  - Trigger re-render in React components
- **Dependencies**: S4.T1
- **Acceptance Criteria**:
  - Calling `setLanguage('es-ES')` loads Spanish content
  - All `<ContentComponent>` instances update automatically
  - New language persisted to localStorage (optional)
- **Effort**: 2 hours

### S4.T3: Add language prop to ContentComponent (optional)
- [ ] **Status**: Not Started
- **Files**: `packages/sdk/src/react/ContentComponent.tsx`
- **Description**:
  - Add optional `lang` prop to override global language
  - Useful for side-by-side comparisons
  - Example: `<ContentComponent contentId="hero" lang="es-ES" />`
- **Dependencies**: S4.T1
- **Acceptance Criteria**:
  - Can render content in specific language via prop
  - Prop overrides global SDK language setting
  - Falls back to default text if translation missing
- **Effort**: 1.5 hours
- **Note**: Optional, can be deferred

### S4.T4: Update consuming apps to support language switching
- [ ] **Status**: Not Started
- **Files**: `apps/demo/src/main.tsx`, `apps/bwo-tax-forms/src/main.tsx`, `apps/customer-portal/src/main.tsx`
- **Description**:
  - Add language dropdown to app header
  - Call `ContentFlowSDK.setLanguage()` on selection
  - Persist language choice to localStorage
  - Load persisted language on initialization
- **Dependencies**: S4.T2
- **Acceptance Criteria**:
  - Language dropdown visible in all 3 consuming apps
  - Selecting language reloads content immediately
  - Language persists across page refreshes
- **Effort**: 2 hours per app (6 hours total)

---

## Phase 5: CMS UI Components (Story 5)

### S5.T1: Create LanguageDropdown component
- [ ] **Status**: Not Started
- **Files**: `apps/cms/src/components/LanguageDropdown.tsx`, `apps/cms/src/App.tsx`
- **Description**:
  - Create dropdown component with flag emojis for each language
  - Fetch available languages from apps.config.json (future: API)
  - Add to CMS header
  - Store selected language in Redux state
- **Dependencies**: None
- **Acceptance Criteria**:
  - Dropdown shows all configured languages (en-US, es-ES, fr-FR, de-DE, ja-JP)
  - Selecting language updates CMS state
  - CMS loads content for selected language
- **Effort**: 2 hours

### S5.T2: Create TranslateAllButton component
- [ ] **Status**: Not Started
- **Files**: `apps/cms/src/components/TranslateAllButton.tsx`, `apps/cms/src/App.tsx`
- **Description**:
  - Create button component: "Translate All"
  - Trigger bulk translation via POST /api/translate/bulk
  - Show confirmation dialog with estimated cost
  - Display batch ID after triggering
  - Add to CMS header/toolbar
- **Dependencies**: None
- **Acceptance Criteria**:
  - Button visible in CMS header
  - Clicking button shows confirmation with cost estimate
  - Triggers bulk translation on confirm
  - Shows batch progress after starting
- **Effort**: 2 hours

### S5.T3: Create BatchProgress component
- [ ] **Status**: Not Started
- **Files**: `apps/cms/src/components/BatchProgress.tsx`
- **Description**:
  - Create modal/toast component to show batch translation progress
  - Poll `/api/translate/batch/:batchId` every 10s
  - Show progress bar with file count: "Translating 28/44 files"
  - Display batch status: validating, in_progress, finalizing, completed
  - Show cost when completed
  - Auto-dismiss when complete
- **Dependencies**: S2.T2, S5.T2
- **Acceptance Criteria**:
  - Appears after clicking TranslateAllButton
  - Shows real-time batch progress
  - Displays estimated/actual cost
  - Dismisses automatically after 5s when complete
  - Allows manual dismissal
- **Effort**: 3 hours

### S5.T4: Create CostDashboard component
- [ ] **Status**: Not Started
- **Files**: `apps/cms/src/components/CostDashboard.tsx`
- **Description**:
  - Create dashboard view for translation costs
  - Display summary cards: total cost, this month, avg per batch, files translated
  - Show recent batches table with: date, files, tokens, cost, status
  - Support filtering by date range (future)
  - Add route: /cms/costs
- **Dependencies**: S3.T3
- **Acceptance Criteria**:
  - Dashboard shows summary statistics
  - Recent batches table displays all cost data
  - Cost values formatted correctly (4 decimal places)
  - Responsive layout (Tailwind grid)
- **Effort**: 4 hours

### S5.T5: Create QualityReview component (side-by-side view)
- [ ] **Status**: Not Started
- **Files**: `apps/cms/src/components/LanguageDropdown.tsx`, `apps/cms/src/App.tsx`
- **Description**:
  - Create dropdown component with flag emojis for each language
  - Fetch available languages from apps.config.json (future: API)
  - Add to CMS header
  - Store selected language in Redux state
- **Dependencies**: None
- **Acceptance Criteria**:
  - Dropdown shows all configured languages (en-US, es-ES, fr-FR, de-DE, ja-JP)
  - Selecting language updates CMS state
  - CMS loads content for selected language
- **Effort**: 2 hours

### S4.T2: Add auto-translate toggle in settings
- [ ] **Status**: Not Started
- **Files**: `apps/cms/src/components/Settings.tsx`
- **Description**:
  - Add toggle switch: "Auto-translate on save"
  - Store preference in localStorage
  - Pass flag to content save API
- **Dependencies**: None
- **Acceptance Criteria**:
  - Toggle visible in settings panel
  - Default: ON
  - Preference persists across sessions
- **Effort**: 1 hour

### S4.T3: Create TranslationProgress component
- [ ] **Status**: Not Started
- **Files**: `apps/cms/src/components/TranslationProgress.tsx`
- **Description**:
  - Create toast/modal component to show translation progress
  - Poll `/api/translate/status/:jobId` every 1s
  - Show progress bar: "Translating 3/5 languages"
  - Auto-dismiss when complete
  - Show error if translation fails
- **Dependencies**: S2.T2
- **Acceptance Criteria**:
  - Appears after content save (if auto-translate ON)
  - Shows real-time progress
  - Dismisses automatically after 3s when complete
  - Allows manual dismissal
- **Effort**: 3 hours

### S4.T4: Add "Translate Now" button to editor
- [ ] **Status**: Not Started
- **Files**: `apps/cms/src/components/Editor.tsx`
- **Description**:
  - Add button next to "Save" button
  - Triggers manual translation for all languages
  - Shows progress indicator
  - Disabled during translation
- **Dependencies**: S2.T1, S4.T3
- **Acceptance Criteria**:
  - Button visible in editor toolbar
  - Clicking button triggers translation
  - Button disabled and shows spinner during translation
  - Re-enabled when translation complete
- **Effort**: 2 hours

### S4.T5: Create QualityReview component (side-by-side view)
- [ ] **Status**: Not Started
- **Files**: `apps/cms/src/components/QualityReview.tsx`
- **Description**:
  - Create split-screen view: source on left, translation on right
  - Load source (English) and target language content
  - Allow inline editing of translated values
  - Save button to update translation file
  - Highlight changed fields
- **Dependencies**: S4.T1
- **Acceptance Criteria**:
  - Can view English and Spanish side-by-side
  - Can edit translated values inline
  - Save updates translation file without re-translating
  - Supports all content types (text, markdown, URLs)
- **Effort**: 4 hours

### S4.T6: Add translation status badges to page list
- [ ] **Status**: Not Started
- **Files**: `apps/cms/src/components/PageList.tsx`
- **Description**:
  - Show badges for each page: "en ✓ es ✓ fr ⚠ de ✗"
  - Green checkmark: translation exists and is up-to-date
  - Yellow warning: translation exists but source modified
  - Red X: translation missing
  - Fetch translation status from API (future: versioning)
- **Dependencies**: None (basic version: just check file existence)
- **Acceptance Criteria**:
  - Badges visible next to each page in CMS sidebar
  - Clicking badge opens QualityReview for that language
  - Status updates after translation completes
- **Effort**: 3 hours

---

## Phase 6: Glossary Management (Story 6)

### S6.T1: Create glossary storage structure
- [ ] **Status**: Not Started
- **Files**: `apps/server/content/glossaries/`, `apps/server/src/services/IContentStorage.ts`
- **Description**:
  - Create `glossaries/` directory in content storage
  - Define glossary JSON structure: `{ $meta, terms: Record<string, string> }`
  - Add glossary CRUD methods to `IContentStorage` interface
  - Implement in LocalStorageService and AzureStorageService
- **Dependencies**: None
- **Acceptance Criteria**:
  - Can read/write glossary files: `glossaries/{appId}-{lang}.json`
  - Glossary files follow standard $meta structure
  - Works in both local and Azure storage
- **Effort**: 2 hours

### S6.T2: Create GlossaryService
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/services/GlossaryService.ts`
- **Description**:
  - Create service for glossary CRUD operations
  - Methods: `getGlossary(appId, lang)`, `updateTerm()`, `deleteTerm()`, `listGlossaries(appId)`
  - Validate glossary format on save
- **Dependencies**: S5.T1
- **Acceptance Criteria**:
  - Can get glossary for an app/language
  - Can add/update/delete individual terms
  - Can list all glossaries for an app
- **Effort**: 2 hours

### S6.T3: Create glossary API endpoints
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/routes/glossaries.ts`
- **Description**:
  - GET `/api/glossaries?appId=demo` - list glossaries
  - GET `/api/glossaries/:appId/:lang` - get glossary
  - POST `/api/glossaries/:appId/:lang` - update glossary
  - DELETE `/api/glossaries/:appId/:lang/:term` - delete term
- **Dependencies**: S5.T2
- **Acceptance Criteria**:
  - All endpoints return proper HTTP status codes
  - Input validation for glossary terms
  - CORS enabled for CMS
- **Effort**: 2 hours

### S6. T4: Create GlossaryManager UI component
- [ ] **Status**: Not Started
- **Files**: `apps/cms/src/components/GlossaryManager.tsx`
- **Description**:
  - Create table view of glossary terms
  - Add form to add new terms
  - Delete buttons for each term
  - Filter/search functionality
  - Sort alphabetically
- **Dependencies**: S5.T3
- **Acceptance Criteria**:
  - Can view all glossary terms for selected app/language
  - Can add new term with English + translation
  - Can delete term
  - Can search terms
- **Effort**: 4 hours

---

## Phase 7: Testing (Story 7)

### S7.T1: Unit tests for TranslationService
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/services/TranslationService.test.ts`
- **Description**:
  - Mock OpenAI API responses
  - Test successful translation
  - Test API error handling and retries
  - Test prompt construction with glossary
  - Test incremental translation (changed keys only)
- **Dependencies**: S1.T2, S1.T4
- **Acceptance Criteria**:
  - >80% code coverage for TranslationService
  - All edge cases tested (empty content, API errors, timeouts)
  - Uses Vitest with mocked OpenAI client
- **Effort**: 3 hours

### S7.T2: Integration tests for translation API
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/routes/translate.test.ts`
- **Description**:
  - Test POST /api/translate endpoint
  - Test GET /api/translate/status/:jobId
  - Test auto-translate integration in content save
  - Use test OpenAI API key (or mock)
- **Dependencies**: S2.T1, S2.T2, S2.T3
- **Acceptance Criteria**:
  - Can trigger translation and get job ID
  - Can poll status and get results
  - Auto-translate triggers correctly on content save
- **Effort**: 3 hours

### S7.T3: Unit tests for GlossaryService
- [ ] **Status**: Not Started
- **Files**: `apps/server/src/services/GlossaryService.test.ts`
- **Description**:
  - Test CRUD operations
  - Test glossary validation
  - Test term lookup
  - Mock storage layer
- **Dependencies**: S5.T2
- **Acceptance Criteria**:
  - >80% code coverage
  - All CRUD operations tested
- **Effort**: 2 hours

### S7.T4: E2E tests for CMS translation workflow
- [ ] **Status**: Not Started
- **Files**: `apps/cms/tests/translation.spec.ts`
- **Description**:
  - Test full workflow: edit content → save → auto-translate → view translated
  - Test manual translation trigger
  - Test glossary manager CRUD
  - Test quality review side-by-side editing
- **Dependencies**: S4.T1-S4.T6, S5.T4
- **Acceptance Criteria**:
  - Can edit English content and see Spanish translation appear
  - Can manually trigger translation
  - Can add glossary term and verify it's used in translation
  - Uses Playwright
- **Effort**: 4 hours

### S7.T5: Load testing for translation API
- [ ] **Status**: Not Started
- **Files**: `apps/server/tests/load/translation.k6.js`
- **Description**:
  - Simulate 10 concurrent translation requests
  - Test queue concurrency limits
  - Measure response times
  - Test OpenAI rate limits
- **Dependencies**: S2.T1, S1.T6
- **Acceptance Criteria**:
  - Can handle 10 concurrent requests without errors
  - Queue respects concurrency limit (max 3 active)
  - Average response time <5s per language
- **Effort**: 2 hours

---

## Phase 8: Documentation (Story 8)

### S8.T1: Update SDK documentation
- [ ] **Status**: Not Started
- **Files**: `packages/sdk/README.md`
- **Description**:
  - Document language config options
  - Document `setLanguage()` method
  - Add examples for multi-language apps
  - Document fallback behavior
- **Dependencies**: S4.T1, S3.T2
- **Acceptance Criteria**:
  - README has "Multi-Language Support" section
  - Code examples for initialization and language switching
  - API reference updated
- **Effort**: 1.5 hours

### S8.T2: Create translation user guide
- [ ] **Status**: Not Started
- **Files**: `docs/translation-guide.md`
- **Description**:
  - How to enable auto-translate
  - How to manually trigger translation
  - How to review and edit translations
  - How to manage glossaries
  - Best practices for content authoring
- **Dependencies**: All S4 tasks
- **Acceptance Criteria**:
  - Step-by-step guide with screenshots
  - Covers all translation workflows
  - Includes troubleshooting section
- **Effort**: 2 hours

### S8.T3: Update Copilot instructions
- [ ] **Status**: Not Started
- **Files**: `.github/copilot-instructions.md`
- **Description**:
  - Add translation service architecture
  - Document OpenAI integration patterns
  - Add glossary management conventions
  - Update API endpoint list
- **Dependencies**: None
- **Acceptance Criteria**:
  - Copilot instructions include translation section
  - Architecture diagrams updated
  - API reference complete
- **Effort**: 1 hour

---

## Implementation Status Summary

**Total Tasks**: 36  
**Completed**: 0  
**In Progress**: 0  
**Not Started**: 36  
**Completion**: 0%

### By Story
- **Story 1** (Batch Translation Service): 0/7 tasks
- **Story 2** (API Endpoints): 0/4 tasks
- **Story 3** (Cost Tracking): 0/4 tasks
- **Story 4** (SDK Language Support): 0/4 tasks
- **Story 5** (CMS UI Components): 0/5 tasks
- **Story 6** (Glossary Management): 0/4 tasks
- **Story 7** (Testing): 0/5 tasks
- **Story 8** (Documentation): 0/3 tasks

### Critical Path
1. S1.T1 → S1.T2 → S1.T3 → S1.T4 → S1.T5 → S1.T6 (Batch translation foundation)
2. S2.T1 → S2.T2 (API endpoints)
3. S3.T1 → S3.T2 → S3.T3 → S3.T4 (Cost tracking)
4. S4.T1 → S4.T2 (SDK language support)
5. S5.T1 → S5.T2 → S5.T3 → S5.T4 (CMS UI)
6. S6.T1 → S6.T2 → S6.T3 → S6.T4 (Glossary)
7. S7.T1-S7.T5 (Testing - can run in parallel)
8. S8.T1-S8.T3 (Documentation - can run in parallel)

### Estimated Timeline
- **Week 1**: Phase 1 (7 tasks) + Phase 2 (4 tasks) = 11 tasks (~4.5 days)
- **Week 2**: Phase 3 (4 tasks) + Phase 4 (4 tasks) + Phase 5 (5 tasks) = 13 tasks (~5 days)
- **Week 3**: Phase 6 (4 tasks) + Phase 7 (5 tasks) + Phase 8 (3 tasks) = 12 tasks (~4.5 days)

**Total**: ~3 weeks (14 working days)

---

## Dependencies

### External APIs
- OpenAI API (GPT-4o-mini) - requires API key
- Azure OpenAI (optional alternative)

### Internal Dependencies
- Spec 001: ContentFlow SDK (language config)
- Spec 002: Unified Bun Server (add new routes)
- Existing storage abstraction (LocalStorageService, AzureStorageService)

### Environment Requirements
```bash
# Required
OPENAI_API_KEY=sk-...

# Optional
AUTO_TRANSLATE_ENABLED=true
TRANSLATION_QUEUE_CONCURRENCY=3
SUPPORTED_LANGUAGES=en-US,es-ES,fr-FR,de-DE,ja-JP
DEFAULT_SOURCE_LANGUAGE=en-US
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAI API rate limits | High | Implement queue with concurrency control, add retry logic |
| Translation quality issues | Medium | Add glossary support, manual review UI, validation |
| Cost overruns | Low | Incremental translation (changed keys only), cost tracking |
| API key security | High | Server-side only, Azure Key Vault for production |

---

## Success Criteria

- ✅ Auto-translate triggers on content save
- ✅ Manual translation button works
- ✅ Supports 5+ languages simultaneously
- ✅ Glossary management UI functional
- ✅ Quality review side-by-side view working
- ✅ Cost < $0.02 per save operation
- ✅ Translation latency < 10s for 5 languages
- ✅ >80% test coverage
- ✅ Documentation complete

---

**Next Steps**: Begin Phase 1 (Translation Service Core) with S1.T1
