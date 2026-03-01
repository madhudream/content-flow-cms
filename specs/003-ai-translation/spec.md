# Feature Specification: AI-Powered Content Translation

**Feature ID**: 003  
**Branch**: `003-ai-translation`  
**Date**: 2026-02-28  
**Status**: Planning

## Overview

Automatically translate all content JSON files across multiple languages using OpenAI's API. When a content editor saves changes to any language version, the system intelligently translates only the modified text content to all configured target languages, preserving metadata, keys, and structure. All consuming apps (CMS, Demo, BWO, Customer Portal) include a language dropdown for instant locale switching.

## Business Goals

### Primary Goals
1. **Reduce Translation Costs**: Eliminate manual translation work (~95% cost savings)
2. **Instant Multi-Language Support**: New content available in all languages within seconds
3. **Consistent Quality**: AI ensures consistent terminology and tone across languages
4. **Developer-Friendly**: Zero code changes in consuming apps to add new languages

### Success Metrics
- Translation accuracy: >90% (human evaluation)
- Translation speed: <3 seconds per file (5-10 content items)
- Cost per translation: <$0.02 per JSON file
- Language coverage: Support 50+ languages via OpenAI

## User Stories

### US-001: Automatic Translation on Save
**As a** content editor  
**I want** my changes automatically translated to all languages  
**So that** I don't need to manually edit 10+ locale files

**Acceptance Criteria**:
- Edit content in en-US → Save
- System detects changed keys and sends only changes to OpenAI
- All target languages (es-ES, fr-FR, de-DE, etc.) updated within 3 seconds
- Notification shows "Translated to 5 languages" with status
- Failed translations don't block save (fallback to source text with warning)

**Example Flow**:
```
1. Editor changes "hero-title" from "Welcome" to "Welcome Back" in en-US
2. Save triggers translation service
3. Service calls OpenAI API with:
   - Source: en-US
   - Targets: [es-ES, fr-FR, de-DE, ja-JP, zh-CN]
   - Changed keys: { "hero-title": "Welcome Back" }
   - Context: Existing translations for tone matching
4. Responses saved to respective JSON files:
   - demo-home-es-ES.json: "hero-title" = "Bienvenido de Nuevo"
   - demo-home-fr-FR.json: "hero-title" = "Bon Retour"
   - demo-home-de-DE.json: "hero-title" = "Willkommen Zurück"
5. CMS shows success toast with translation summary
```

---

### US-002: Smart Incremental Translation
**As a** system administrator  
**I want** only changed content translated  
**So that** we minimize API costs and processing time

**Acceptance Criteria**:
- Compare saved JSON with previous version
- Extract only modified keys (ignore unchanged text)
- Send delta to OpenAI (not entire file)
- Update only translated keys in target files (preserve rest)
- Track translation metadata ($meta.lastTranslated, translatedBy)

**Cost Optimization**:
```
Scenario: Edit 2 fields out of 20 in demo-home-en-US.json
- Without optimization: Translate 20 fields × 5 languages = 100 translations
- With optimization: Translate 2 fields × 5 languages = 10 translations
- Cost savings: 90% reduction in API calls
```

---

### US-003: Language Dropdown in All Apps
**As a** end user  
**I want** to switch languages instantly  
**So that** I can view content in my preferred language

**Acceptance Criteria**:
- Header component with language selector (flag icon + dropdown)
- Dropdown lists all languages from apps.config.json
- Selecting language calls `ContentFlowSDK.setLanguage('es-ES')`
- All `<ContentComponent>` elements update within 100ms
- Choice persisted in localStorage
- URL updates with ?lang=es-ES query param

**UI Mockup**:
```
┌──────────────────────────────────────┐
│  🌐 English (US) ▼                   │
│  ├─ 🇺🇸 English (US)                │
│  ├─ 🇪🇸 Español                     │
│  ├─ 🇫🇷 Français                    │
│  ├─ 🇩🇪 Deutsch                     │
│  ├─ 🇯🇵 日本語                       │
│  └─ 🇨🇳 中文                         │
└──────────────────────────────────────┘
```

---

### US-004: Translation History & Rollback
**As a** content editor  
**I want** to see translation history  
**So that** I can rollback bad translations

**Acceptance Criteria**:
- CMS sidebar shows "Translation History" tab
- Lists all translations with timestamp, source, target languages
- Click translation → shows diff (before/after)
- "Rollback" button reverts to previous version
- History stored for 30 days (max 100 versions per file)

---

### US-005: Custom Translation Rules
**As a** brand manager  
**I want** to define untranslatable terms  
**So that** brand names and product codes remain consistent

**Acceptance Criteria**:
- CMS settings page for "Translation Rules"
- Add terms to glossary: `{"ContentFlow": "ContentFlow", "BWO-2024": "BWO-2024"}`
- OpenAI prompt includes glossary: "Do not translate: ContentFlow, BWO-2024"
- Glossary applied to all translation requests
- Support regex patterns: `/BWO-\d{4}/` → preserve all BWO codes

**Glossary Format** (`data/translation-glossary.json`):
```json
{
  "version": 1,
  "rules": [
    {
      "type": "preserve",
      "term": "ContentFlow",
      "description": "Product name"
    },
    {
      "type": "preserve",
      "pattern": "BWO-\\d{4}",
      "description": "Tax form codes"
    },
    {
      "type": "custom",
      "source": "tax deduction",
      "targets": {
        "es-ES": "deducción fiscal",
        "fr-FR": "déduction fiscale"
      },
      "description": "Legal terminology requires specific translation"
    }
  ]
}
```

---

### US-006: Translation Quality Review
**As a** content editor  
**I want** to review and edit AI translations  
**So that** I can fix inaccuracies before publishing

**Acceptance Criteria**:
- CMS preview mode shows side-by-side comparison (source + translated)
- Click translated text → inline editor appears
- Edit translation → saves without re-translating
- Mark translation as "Reviewed" (adds $meta.reviewed = true)
- Bulk review UI: Table with all translations, mark multiple as reviewed

---

## Technical Specification

### Architecture Diagram

```
┌────────────────────────────────────────────────────────────┐
│  CMS Editor                                                 │
│  User edits demo-home-en-US.json → Clicks Save             │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   ↓ POST /api/content/save
┌────────────────────────────────────────────────────────────┐
│  Translation Service (apps/cms/server/services/)           │
│                                                              │
│  1. Diff Detector                                           │
│     ├─ Load previous version from disk/blob                │
│     ├─ Compare old vs new (deep diff)                      │
│     └─ Extract changed keys: ["hero-title", "cta-button"]  │
│                                                              │
│  2. Translation Queue                                       │
│     ├─ Get target languages from apps.config.json          │
│     ├─ Load glossary rules: translation-glossary.json      │
│     ├─ Build prompt for OpenAI with context                │
│     └─ Enqueue translation jobs (parallel)                 │
│                                                              │
│  3. OpenAI Client                                           │
│     ├─ POST https://api.openai.com/v1/chat/completions     │
│     ├─ Model: gpt-4o-mini (fast, cheap, good quality)      │
│     ├─ Prompt: "Translate these UI strings from en-US      │
│     │          to es-ES, maintain tone and context"        │
│     ├─ Request JSON mode: {"hero-title": "...", ...}       │
│     └─ Retry logic: 3 attempts with exponential backoff    │
│                                                              │
│  4. Translation Writer                                      │
│     ├─ Load target JSON file (demo-home-es-ES.json)        │
│     ├─ Merge translated keys (preserve other keys)         │
│     ├─ Update $meta: version++, lastTranslated, cost       │
│     └─ Write to disk/blob storage                          │
│                                                              │
│  5. History Logger                                          │
│     └─ Append to data/translation-history.jsonl            │
└────────────────────────────────────────────────────────────┘
                   │
                   ↓ Response
┌────────────────────────────────────────────────────────────┐
│  CMS UI                                                     │
│  ✓ Saved successfully                                       │
│  ✓ Translated to 5 languages (es-ES, fr-FR, de-DE...)     │
│  💰 Cost: $0.015                                           │
└────────────────────────────────────────────────────────────┘
```

### File Structure

```
apps/
├── cms/
│   ├── server/
│   │   ├── services/
│   │   │   ├── translation/
│   │   │   │   ├── TranslationService.ts        # Main orchestrator
│   │   │   │   ├── DiffDetector.ts             # Compare old vs new JSON
│   │   │   │   ├── OpenAIClient.ts             # API wrapper
│   │   │   │   ├── TranslationQueue.ts         # Async job queue
│   │   │   │   ├── GlossaryService.ts          # Load/apply rules
│   │   │   │   └── HistoryLogger.ts            # JSONL event log
│   │   │   └── storage/
│   │   │       └── IContentStorage.ts          # (existing)
│   │   └── routes/
│   │       ├── translation.ts                   # GET /api/translation/history
│   │       │                                    # POST /api/translation/review
│   │       │                                    # GET /api/translation/glossary
│   │       │                                    # POST /api/translation/glossary
│   │       └── content.ts                       # (existing, add translation trigger)
│   └── src/
│       ├── components/
│       │   ├── LanguageSelector.tsx            # Dropdown with flags
│       │   ├── TranslationHistory.tsx          # History sidebar tab
│       │   └── TranslationReview.tsx           # Side-by-side review UI
│       └── store/
│           └── translationSlice.ts             # Redux state for translation
│
├── demo/
│   └── src/
│       ├── components/
│       │   └── LanguageSelector.tsx            # Reusable component
│       └── App.tsx                              # Add selector to header
│
├── bwo-tax-forms/
│   └── src/
│       ├── components/
│       │   └── LanguageSelector.tsx
│       └── App.tsx
│
└── customer-portal/
    └── src/
        ├── components/
        │   └── LanguageSelector.tsx
        └── App.tsx

packages/
└── sdk/
    └── src/
        ├── index.ts
        │   └── export function setLanguage(lang: string)  # NEW
        ├── core/
        │   └── store.ts
        │       └── Add language state + setLanguage action
        └── react/
            └── LanguageSelector.tsx            # Optional pre-built component

data/
├── apps.config.json                            # Add supportedLanguages array
├── translation-glossary.json                   # NEW: Glossary rules
└── translation-history.jsonl                   # NEW: Event log (append-only)
```

### Data Models

#### apps.config.json (Extended)
```json
{
  "version": 1,
  "apps": [
    {
      "id": "demo",
      "name": "Demo App",
      "baseUrl": "http://localhost:3002",
      "pages": ["home", "about", "contact"],
      "supportedLanguages": [
        { "code": "en-US", "name": "English", "flag": "🇺🇸", "default": true },
        { "code": "es-ES", "name": "Español", "flag": "🇪🇸" },
        { "code": "fr-FR", "name": "Français", "flag": "🇫🇷" },
        { "code": "de-DE", "name": "Deutsch", "flag": "🇩🇪" },
        { "code": "ja-JP", "name": "日本語", "flag": "🇯🇵" },
        { "code": "zh-CN", "name": "中文", "flag": "🇨🇳" }
      ]
    }
  ]
}
```

#### Content JSON with Translation Metadata
```json
{
  "$meta": {
    "appId": "demo",
    "pageId": "home",
    "lang": "es-ES",
    "version": 3,
    "updatedAt": "2026-02-28T10:30:00Z",
    "translatedFrom": "en-US",
    "translatedAt": "2026-02-28T10:30:02Z",
    "translationModel": "gpt-4o-mini",
    "translationCost": 0.0015,
    "reviewed": false
  },
  "hero-title": "Bienvenido de Nuevo",
  "hero-subtitle": "Edita contenido sin código",
  "cta-button": "Comenzar"
}
```

#### Translation History (JSONL Event Log)
```jsonl
{"timestamp":"2026-02-28T10:30:00Z","action":"translate","source":"en-US","targets":["es-ES","fr-FR"],"keys":["hero-title"],"cost":0.0015,"duration":1250,"status":"success"}
{"timestamp":"2026-02-28T10:35:00Z","action":"translate","source":"en-US","targets":["es-ES"],"keys":["cta-button"],"cost":0.0008,"duration":980,"status":"success"}
{"timestamp":"2026-02-28T10:40:00Z","action":"review","lang":"es-ES","key":"hero-title","reviewer":"editor@example.com","changes":{"before":"Bienvenido","after":"Bienvenido de Nuevo"}}
```

### OpenAI Integration

#### Prompt Template
```typescript
const systemPrompt = `You are a professional translator for UI content.
Translate the provided JSON content from {sourceLang} to {targetLang}.

RULES:
1. Maintain the same JSON structure (keys unchanged, translate only values)
2. Preserve HTML tags, placeholders like {{variable}}, and special characters
3. Match the tone and formality of the context provided
4. Do NOT translate terms in the glossary: {glossaryTerms}
5. Keep translations concise (UI strings should be brief)
6. Return valid JSON only, no explanation text

CONTEXT (existing translations for tone matching):
{contextTranslations}

GLOSSARY (do not translate):
{glossary}
`;

const userPrompt = `Translate these keys from ${sourceLang} to ${targetLang}:

${JSON.stringify(contentToTranslate, null, 2)}
`;
```

#### API Call Example
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function translateContent(
  content: Record<string, string>,
  sourceLang: string,
  targetLang: string,
  context?: Record<string, string>,
  glossary?: string[]
): Promise<Record<string, string>> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(sourceLang, targetLang, glossary),
      },
      {
        role: 'user',
        content: JSON.stringify(content),
      },
    ],
    response_format: { type: 'json_object' }, // Ensures valid JSON response
    temperature: 0.3, // Lower = more consistent translations
    max_tokens: 2000,
  });

  const translated = JSON.parse(response.choices[0].message.content);
  return translated;
}
```

#### Cost Estimation (gpt-4o-mini)
- Input: $0.150 per 1M tokens
- Output: $0.600 per 1M tokens
- Average UI string: ~10 tokens
- Cost per file (20 strings × 5 languages):
  - Input: 200 tokens × $0.150/1M = $0.00003
  - Output: 200 tokens × $0.600/1M = $0.00012
  - **Total: ~$0.0015 per save operation**

### SDK Language Switching

```typescript
// packages/sdk/src/index.ts
export class ContentFlowSDK {
  static async setLanguage(lang: string): Promise<void> {
    const store = getStore();
    const currentAppId = store.getState().config.appId;
    
    // Update store
    store.getState().setLanguage(lang);
    
    // Reload content for new language
    const config = store.getState().config;
    await loadContent(currentAppId, config.pages, lang, config.storageUrl);
    
    // Save to localStorage
    localStorage.setItem('contentflow-language', lang);
    
    // Update URL query param
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
  }
  
  static getCurrentLanguage(): string {
    return getStore().getState().config.language || 'en-US';
  }
  
  static getSupportedLanguages(): LanguageConfig[] {
    return getStore().getState().config.supportedLanguages || [];
  }
}
```

### LanguageSelector Component (Reusable)

```tsx
// packages/sdk/src/react/LanguageSelector.tsx
import React from 'react';
import { ContentFlowSDK } from '../index';

export function LanguageSelector() {
  const languages = ContentFlowSDK.getSupportedLanguages();
  const current = ContentFlowSDK.getCurrentLanguage();
  
  const handleChange = async (lang: string) => {
    await ContentFlowSDK.setLanguage(lang);
  };
  
  return (
    <div className="relative">
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="px-3 py-2 border rounded-md focus:ring-2"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## Non-Functional Requirements

### Performance
- Translation latency: <3 seconds for 5 languages
- Language switch: <100ms (cached content)
- Diff detection: <50ms per file
- Batch translations: Support 100+ files in parallel

### Cost
- Target: <$0.02 per save operation (5 languages)
- Monthly budget: <$50 for 2500 saves
- Optimize by translating only changed keys (90% cost reduction)

### Reliability
- OpenAI rate limits: 500 requests/min (gpt-4o-mini)
- Retry failed translations: 3 attempts with exponential backoff
- Fallback: If translation fails, use source text (no blocking errors)
- Queue processing: Handle 50 concurrent translation jobs

### Security
- OpenAI API key stored in environment variable (never in code)
- Content encrypted in transit (HTTPS only)
- Translation history access restricted to authenticated users
- No PII sent to OpenAI (content only)

### Quality
- Translation accuracy: >90% (human review required for legal/medical content)
- Consistency: Use glossary to maintain brand terminology
- Context preservation: Send surrounding content for better translations
- Tone matching: Analyze source language style and replicate

## Out of Scope (Future Enhancements)
- Human-in-the-loop approval workflow
- Translation memory (TM) integration
- Neural machine translation (NMT) fallback
- A/B testing different translation models
- Custom fine-tuned models per industry
- Real-time collaborative translation editing
- Translation quality scoring (BLEU/METEOR metrics)

## Testing Strategy

### Unit Tests
- DiffDetector: Detect changed keys, ignore unchanged
- OpenAIClient: Mock API calls, test retry logic
- GlossaryService: Apply rules correctly
- TranslationService: Orchestration logic

### Integration Tests
- Save content → verify all target languages updated
- Translation failure → verify fallback behavior
- Glossary enforcement → verify terms not translated
- Cost tracking → verify metadata updated

### E2E Tests
- CMS: Edit en-US → Save → Check es-ES file updated
- Demo App: Switch language dropdown → Verify content changes
- History: View translation history → Rollback → Verify old version restored

### Manual QA
- Human review of translations in 5 languages
- Edge cases: Special characters, HTML tags, placeholders
- Glossary enforcement: Brand names preserved
- UI/UX: Language selector usability across all apps

## Rollout Plan

### Phase 1: Translation Service (Week 1)
- Implement DiffDetector to find changed keys
- Create OpenAI client with retry logic
- Build TranslationService orchestrator
- Add translation trigger to content save endpoint
- Test with 2-3 languages initially

### Phase 2: SDK Language Switching (Week 1)
- Add `setLanguage()` method to SDK
- Implement language state in Zustand store
- Handle content reloading on language change
- Save language preference to localStorage

### Phase 3: Language Selector UI (Week 2)
- Create reusable LanguageSelector component
- Add to CMS header
- Add to Demo App header
- Add to BWO Tax Forms header
- Add to Customer Portal header
- Test language switching across all apps

### Phase 4: Glossary & Rules (Week 2)
- Create translation-glossary.json schema
- Implement GlossaryService
- Add CMS UI for glossary management
- Test with brand names and product codes

### Phase 5: History & Review (Week 3)
- Implement HistoryLogger (JSONL)
- Create TranslationHistory UI component
- Add side-by-side review interface
- Implement rollback functionality

### Phase 6: Optimization & Polish (Week 3)
- Add batch translation support
- Optimize API calls (parallel requests)
- Implement cost tracking dashboard
- Add translation quality metrics
- Performance testing and tuning

## Success Criteria
✅ Save in en-US → All target languages updated within 3 seconds  
✅ Translation cost < $0.02 per save (5 languages)  
✅ Language dropdown in all apps (CMS, Demo, BWO, Portal)  
✅ Glossary enforces untranslatable terms  
✅ Translation history viewable with rollback  
✅ 90%+ accuracy on human review  
✅ Zero breaking changes to existing apps  

## Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...                   # OpenAI API key
OPENAI_MODEL=gpt-4o-mini                     # Model name
OPENAI_MAX_RETRIES=3                          # Retry failed requests
OPENAI_TIMEOUT=30000                          # Request timeout (ms)

# Translation Configuration
TRANSLATION_ENABLED=true                      # Feature flag
TRANSLATION_DEFAULT_LANG=en-US               # Default language
TRANSLATION_BATCH_SIZE=10                     # Max parallel jobs
TRANSLATION_CACHE_TTL=3600                    # Cache translations (seconds)

# Cost Limits
TRANSLATION_DAILY_BUDGET=5.00                # Max daily spend (USD)
TRANSLATION_ALERT_THRESHOLD=4.00             # Alert at 80% of budget
```

## Questions & Decisions

### Q1: Which OpenAI model?
**Decision**: `gpt-4o-mini` — Best balance of speed, cost, and quality for UI translations

### Q2: Real-time or batch translation?
**Decision**: Real-time for immediate feedback, batch option for bulk content imports

### Q3: How to handle translation failures?
**Decision**: Non-blocking errors, fallback to source text, retry up to 3 times

### Q4: Store translations in separate files or merged?
**Decision**: Separate files per locale (existing pattern), easier for CDN caching

### Q5: Language detection for user?
**Decision**: Use browser's `navigator.language` on first visit, then localStorage

### Q6: Support for right-to-left (RTL) languages?
**Decision**: Phase 2 — Add RTL support for Arabic, Hebrew (requires CSS changes)

---

## Dependencies

- **OpenAI SDK**: `npm install openai` (official Node.js client)
- **Diff Library**: `npm install fast-json-patch` (JSON diff/patch)
- **Flag Emojis**: Built-in Unicode (no library needed)
- **Existing**: ContentFlow SDK, CMS server, storage abstraction

## Migration Path

For existing installations:
1. Add `supportedLanguages` to apps.config.json
2. Run migration script: `node scripts/create-default-locale-files.js`
   - Copies en-US content to all target languages
   - Adds $meta.translatedFrom = 'en-US'
3. Set `OPENAI_API_KEY` environment variable
4. Deploy updated CMS and apps
5. Enable translation via CMS settings toggle

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| OpenAI API downtime | High | Fallback to source text, queue for later |
| Poor translation quality | Medium | Glossary + context + human review workflow |
| High costs | Medium | Daily budget limits + alerts + incremental translation |
| Rate limiting | Low | Batch requests, implement exponential backoff |
| Large files timeout | Low | Split files >50KB into chunks |

---

**Next Steps**:
1. Review and approve this spec
2. Run `/speckit.plan` to generate implementation plan
3. Run `/speckit.tasks` to break down into actionable tasks
4. Implement following TDD approach
