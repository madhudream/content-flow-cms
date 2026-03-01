# Implementation Plan: AI-Powered Translation

**Feature ID**: 003  
**Status**: Planning Complete - Ready for Implementation  
**Created**: 2026-02-28  
**Based on**: [spec.md](spec.md)  
**Dependencies**: Spec 001 (ContentFlow SDK), Spec 002 (Unified Server)

---

## Overview

Add AI-powered bulk translation to ContentFlow CMS using OpenAI's Batch API. Content editors trigger translation via a "Translate All" button that processes all content JSON files in bulk with OpenAI's asynchronous Batch API, achieving up to 50% cost savings. The system tracks all translation costs and displays them in the CMS dashboard.

**Cost Target**: ~$0.01 per file with Batch API (50% discount)  
**User Experience**: Manual trigger with progress tracking and cost transparency

---

## Technical Stack

### AI & Translation
- **AI Provider**: OpenAI Batch API with GPT-4o-mini (50% cost savings)
- **SDK**: `openai` npm package (v4.x)
- **Alternative**: Azure OpenAI Service (for enterprise deployments)
- **Prompt Engineering**: Few-shot learning with glossary support
- **Context Strategy**: Content ID + default text for disambiguation
- **Processing**: Asynchronous batch processing (24-hour completion window)

### Backend
- **Server**: Bun server (existing) with new /api/translate routes
- **Translation Service**: `TranslationService.ts` with OpenAI Batch API integration
- **Glossary Storage**: `glossaries/{appId}-{lang}.json` in blob storage
- **Cost Tracking**: `translation-costs.json` in blob storage with per-operation logs
- **Batch Processing**: OpenAI Batch API with status polling

### Frontend (CMS Portal)
- **Language Dropdown**: New component in CMS header
- **Translate All Button**: Manual trigger for bulk translation
- **Progress Indicator**: Real-time batch status with file count and progress
- **Cost Dashboard**: Display total translation costs and per-operation breakdown
- **Quality Review**: Side-by-side view with edit capabilities
- **Glossary Manager**: CRUD interface for custom terms

### Storage
- **Content Files**: Existing `{appId}-{pageId}-{lang}.json` structure
- **Glossaries**: New `glossaries/{appId}-{lang}.json` files
- **Cost Tracking**: `translation-costs.json` with detailed cost logs
- **Batch Jobs**: `translation-batches/{batchId}.json` for batch status tracking

---

## Architecture

### Bulk Translation Flow (OpenAI Batch API)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Editor Clicks "Translate All" Button in CMS            │
│    CMS sends: POST /api/translate/bulk                     │
│    Body: {                                                  │
│      sourceLang: "en-US",                                   │
│      targetLangs: ["es-ES", "fr-FR", "de-DE", "ja-JP"],    │
│      appIds?: ["demo", "bwo-taxforms"] // optional filter  │
│    }                                                        │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Server Prepares Batch Request                          │
│    TranslationService.prepareBulkTranslation()              │
│    - Scan all content files (11+ files)                    │
│    - For each file + target language combination:          │
│      * Load source content (en-US)                         │
│      * Load glossary for target language                   │
│      * Create translation request in JSONL format:         │
│        {                                                    │
│          "custom_id": "demo-home-es-ES",                   │
│          "method": "POST",                                 │
│          "url": "/v1/chat/completions",                    │
│          "body": {                                         │
│            "model": "gpt-4o-mini",                         │
│            "messages": [...],                              │
│            "temperature": 0.3                              │
│          }                                                  │
│        }                                                    │
│    - Write all requests to batch.jsonl file                │
│    - Total requests: 11 files × 4 languages = 44 requests │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Upload Batch to OpenAI                                  │
│    - Upload batch.jsonl to OpenAI Files API                │
│    - Create batch job with file ID                         │
│    - OpenAI returns batchId                                │
│    - Store batch metadata in blob storage:                 │
│      translation-batches/{batchId}.json                     │
│    - Return to client: { batchId, status: "validating" }  │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CMS Polls Batch Status                                  │
│    GET /api/translate/batch/:batchId every 10s             │
│    Server checks OpenAI Batch API:                         │
│    - Status: validating → in_progress → finalizing         │
│      → completed (or failed)                               │
│    - Progress: request_counts { total, completed, failed } │
│    - ETA: Up to 24 hours (typically 30 min - 2 hours)      │
│                                                             │
│    Response: {                                              │
│      batchId: "batch_abc123",                              │
│      status: "in_progress",                                │
│      progress: {                                            │
│        total: 44,                                           │
│        completed: 28,                                       │
│        failed: 0                                            │
│      },                                                     │
│      estimatedCost: 0.12,                                  │
│      createdAt: "2026-02-28T10:00:00Z"                     │
│    }                                                        │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Batch Processing Complete                               │
│    - OpenAI marks batch as "completed"                     │
│    - Server downloads output file (batch-output.jsonl)     │
│    - Parse each response:                                  │
│      * Extract custom_id (e.g., "demo-home-es-ES")         │
│      * Parse translated JSON from response                 │
│      * Validate translation                                │
│      * Save to storage: demo-home-es-ES.json               │
│    - Calculate actual cost from usage data                 │
│    - Update translation-costs.json:                        │
│      {                                                      │
│        "batchId": "batch_abc123",                          │
│        "timestamp": "2026-02-28T12:00:00Z",                │
│        "filesTranslated": 44,                              │
│        "inputTokens": 15000,                               │
│        "outputTokens": 12000,                              │
│        "cost": 0.0945,  // 50% discount applied            │
│        "costPerFile": 0.00215                              │
│      }                                                      │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. CMS Displays Results                                    │
│    - Show success toast: "44 files translated!"            │
│    - Update cost dashboard: "Total cost: $0.09"            │
│    - Update language badges: all green checkmarks          │
│    - Log any failures for manual review                    │
└─────────────────────────────────────────────────────────────┘


Cost Dashboard View:
┌─────────────────────────────────────────────────────────────┐
│ Translation Costs (This Month)                             │
│                                                             │
│ Total: $0.32                                                │
│                                                             │
│ Recent Batches:                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Feb 28, 2026 12:00 PM  │ 44 files │ $0.09 │ ✓       │   │
│ │ Feb 25, 2026 03:15 PM  │ 22 files │ $0.05 │ ✓       │   │
│ │ Feb 20, 2026 10:30 AM  │ 44 files │ $0.10 │ ✓       │   │
│ │ Feb 15, 2026 02:00 PM  │ 11 files │ $0.03 │ ✓       │   │
│ │ Feb 10, 2026 09:45 AM  │ 33 files │ $0.05 │ ⚠ 2 fails│   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Breakdown by Language:                                      │
│ - Spanish (es-ES):  11 files × 3 batches = $0.12          │
│ - French (fr-FR):   11 files × 3 batches = $0.10          │
│ - German (de-DE):   11 files × 2 batches = $0.06          │
│ - Japanese (ja-JP): 11 files × 2 batches = $0.04          │
└─────────────────────────────────────────────────────────────┘
```

### OpenAI Batch API Integration

```typescript
// apps/server/src/services/TranslationService.ts

import OpenAI from 'openai';
import { createReadStream, writeFileSync } from 'fs';

interface BulkTranslationRequest {
  sourceLang: string;
  targetLangs: string[];
  appIds?: string[];  // Optional filter
}

interface BatchRequest {
  custom_id: string;  // e.g., "demo-home-es-ES"
  method: "POST";
  url: "/v1/chat/completions";
  body: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature: number;
    response_format: { type: "json_object" };
  };
}

class TranslationService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async prepareBulkTranslation(req: BulkTranslationRequest): Promise<string> {
    // 1. Scan all content files
    const contentFiles = await this.storage.listContent();
    const sourceFiles = contentFiles.filter(f => f.endsWith(`-${req.sourceLang}.json`));
    
    // 2. Build batch requests
    const batchRequests: BatchRequest[] = [];
    
    for (const sourceFile of sourceFiles) {
      const [appId, pageId] = this.parseFilename(sourceFile);
      
      // Apply appId filter if provided
      if (req.appIds && !req.appIds.includes(appId)) continue;
      
      const sourceContent = await this.storage.readContent(sourceFile);
      const glossary = await this.loadGlossary(appId, req.sourceLang);
      
      for (const targetLang of req.targetLangs) {
        const targetGlossary = await this.loadGlossary(appId, targetLang);
        const customId = `${appId}-${pageId}-${targetLang}`;
        
        batchRequests.push({
          custom_id: customId,
          method: "POST",
          url: "/v1/chat/completions",
          body: {
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a professional translator. Translate JSON content from ${req.sourceLang} to ${targetLang}. Return ONLY valid JSON with the same keys. Preserve content IDs. Use the glossary for specific terms.`
              },
              {
                role: "user",
                content: this.buildPrompt(sourceContent, targetLang, targetGlossary, { appId, pageId })
              }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
          }
        });
      }
    }
    
    // 3. Write batch file in JSONL format
    const batchFilePath = `/tmp/batch-${Date.now()}.jsonl`;
    const lines = batchRequests.map(req => JSON.stringify(req)).join('\n');
    writeFileSync(batchFilePath, lines);
    
    // 4. Upload to OpenAI
    const file = await this.openai.files.create({
      file: createReadStream(batchFilePath),
      purpose: 'batch'
    });
    
    // 5. Create batch job
    const batch = await this.openai.batches.create({
      input_file_id: file.id,
      endpoint: '/v1/chat/completions',
      completion_window: '24h',
      metadata: {
        sourceLang: req.sourceLang,
        targetLangs: req.targetLangs.join(','),
        fileCount: String(batchRequests.length)
      }
    });
    
    // 6. Store batch metadata
    await this.storage.saveBatchMetadata(batch.id, {
      batchId: batch.id,
      status: batch.status,
      sourceLang: req.sourceLang,
      targetLangs: req.targetLangs,
      totalRequests: batchRequests.length,
      createdAt: new Date().toISOString(),
      files: batchRequests.map(r => r.custom_id)
    });
    
    return batch.id;
  }

  async checkBatchStatus(batchId: string) {
    const batch = await this.openai.batches.retrieve(batchId);
    
    return {
      batchId: batch.id,
      status: batch.status,  // validating, in_progress, finalizing, completed, failed
      progress: {
        total: batch.request_counts.total,
        completed: batch.request_counts.completed,
        failed: batch.request_counts.failed
      },
      createdAt: new Date(batch.created_at * 1000).toISOString(),
      completedAt: batch.completed_at ? new Date(batch.completed_at * 1000).toISOString() : null,
      outputFileId: batch.output_file_id,
      errorFileId: batch.error_file_id
    };
  }

  async processBatchResults(batchId: string) {
    const batch = await this.openai.batches.retrieve(batchId);
    
    if (batch.status !== 'completed') {
      throw new Error(`Batch not completed yet: ${batch.status}`);
    }
    
    // Download output file
    const outputFile = await this.openai.files.content(batch.output_file_id);
    const outputText = await outputFile.text();
    const results = outputText.split('\n').filter(Boolean).map(line => JSON.parse(line));
    
    let totalCost = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    const savedFiles: string[] = [];
    
    for (const result of results) {
      const customId = result.custom_id;  // e.g., "demo-home-es-ES"
      
      if (result.response.status_code === 200) {
        const translated = JSON.parse(result.response.body.choices[0].message.content);
        const [appId, pageId, lang] = customId.split('-');
        
        // Validate and save
        const validation = this.validateTranslation(translated);
        if (validation.valid) {
          const filename = `${appId}-${pageId}-${lang}.json`;
          await this.storage.writeContent(filename, JSON.stringify(translated, null, 2));
          savedFiles.push(filename);
        }
        
        // Accumulate costs
        const usage = result.response.body.usage;
        inputTokens += usage.prompt_tokens;
        outputTokens += usage.completion_tokens;
      }
    }
    
    // Calculate cost (Batch API = 50% discount)
    // GPT-4o-mini: Input $0.150/1M, Output $0.600/1M (standard)
    // Batch: Input $0.075/1M, Output $0.300/1M (50% off)
    const inputCost = (inputTokens / 1_000_000) * 0.075;
    const outputCost = (outputTokens / 1_000_000) * 0.300;
    totalCost = inputCost + outputCost;
    
    // Save cost data
    await this.saveCostData({
      batchId,
      timestamp: new Date().toISOString(),
      filesTranslated: savedFiles.length,
      inputTokens,
      outputTokens,
      cost: totalCost,
      costPerFile: totalCost / savedFiles.length
    });
    
    return {
      filesTranslated: savedFiles.length,
      totalCost,
      costPerFile: totalCost / savedFiles.length,
      savedFiles
    };
  }

  private buildPrompt(sourceContent: any, targetLang: string, glossary: any, context: any): string {
    let prompt = `Translate the following web content:\n\n`;
    prompt += `Target Language: ${targetLang}\n`;
    prompt += `Context: ${context.appId} - ${context.pageId} page\n\n`;

    if (glossary?.terms && Object.keys(glossary.terms).length > 0) {
      prompt += `Glossary (use these exact translations):\n`;
      prompt += JSON.stringify(glossary.terms, null, 2) + '\n\n';
    }

    prompt += `Source Content:\n`;
    prompt += JSON.stringify(sourceContent, null, 2) + '\n\n';
    prompt += `Return translated content as JSON with the same keys.`;

    return prompt;
  }
}
```

### Glossary Structure

```json
// glossaries/demo-es-ES.json
{
  "$meta": {
    "appId": "demo",
    "lang": "es-ES",
    "version": 1,
    "updatedAt": "2026-02-28T10:00:00Z"
  },
  "terms": {
    "ContentFlow": "ContentFlow",        // Brand name (no translation)
    "Dashboard": "Panel de Control",     // Custom translation
    "Get Started": "Comenzar",           // Preferred over "Empezar"
    "Sign Up": "Registrarse",
    "Log In": "Iniciar sesión"
  }
}
```

---

## File Structure

```
apps/server/
├── src/
│   ├── services/
│   │   ├── TranslationService.ts      # OpenAI Batch API integration
│   │   ├── GlossaryService.ts         # Glossary CRUD
│   │   ├── CostTrackingService.ts     # Cost calculation and storage
│   │   └── BatchStatusPoller.ts       # Poll batch status (optional webhook)
│   ├── routes/
│   │   ├── translate.ts               # Bulk translation API endpoints
│   │   ├── costs.ts                   # Cost dashboard API
│   │   └── glossaries.ts              # Glossary management
│   └── utils/
│       ├── batchPreparer.ts           # Prepare JSONL batch file
│       └── validateTranslation.ts     # Validate translated content
├── content/                           # Existing content files
│   ├── demo-home-en-US.json
│   ├── demo-home-es-ES.json          # Generated by batch
│   ├── demo-home-fr-FR.json          # Generated by batch
│   └── ...
├── glossaries/                        # Glossary files
│   ├── demo-es-ES.json
│   ├── demo-fr-FR.json
│   └── ...
├── translation-batches/               # Batch job metadata
│   ├── batch_abc123.json
│   ├── batch_def456.json
│   └── ...
└── costs/                             # Cost tracking
    └── translation-costs.json         # Cumulative cost log

apps/cms/
├── src/
│   ├── components/
│   │   ├── LanguageDropdown.tsx       # Header language selector
│   │   ├── TranslateAllButton.tsx     # Bulk translation trigger
│   │   ├── BatchProgress.tsx          # Batch status display
│   │   ├── CostDashboard.tsx          # Cost tracking UI
│   │   ├── QualityReview.tsx          # Side-by-side translation review
│   │   └── GlossaryManager.tsx        # Glossary CRUD UI
│   ├── hooks/
│   │   ├── useBatchStatus.ts          # Poll batch status
│   │   ├── useTranslationCosts.ts     # Fetch cost data
│   │   └── useGlossary.ts             # Glossary operations
│   └── store/
│       └── translationSlice.ts        # Redux slice for translation state

packages/sdk/
├── src/
│   ├── index.ts
│   ├── config.ts                      # Add language config
│   └── react/
│       └── ContentComponent.tsx       # Add language prop support
```

---

## API Endpoints

### Bulk Translation API

```typescript
// Trigger bulk translation
POST /api/translate/bulk
Body: {
  sourceLang: string;         // e.g., "en-US"
  targetLangs: string[];      // e.g., ["es-ES", "fr-FR", "de-DE", "ja-JP"]
  appIds?: string[];          // Optional: filter by apps (default: all)
}
Response: {
  batchId: string;            // OpenAI batch ID
  status: "validating";       // Initial status
  totalRequests: number;      // Total translation requests
  estimatedCost: number;      // Estimated cost in USD
  estimatedTime: string;      // "24 hours max, typically 30 min - 2 hours"
}

// Check batch status
GET /api/translate/batch/:batchId
Response: {
  batchId: string;
  status: "validating" | "in_progress" | "finalizing" | "completed" | "failed";
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  createdAt: string;
  completedAt?: string;
  filesTranslated?: string[];  // Available when completed
  totalCost?: number;          // Available when completed
  errors?: string[];           // Failed translations
}

// Cancel batch (if not completed)
DELETE /api/translate/batch/:batchId
Response: {
  success: boolean;
  message: string;
}

// List recent batches
GET /api/translate/batches?limit=10
Response: {
  batches: Array<{
    batchId: string;
    status: string;
    createdAt: string;
    completedAt?: string;
    filesTranslated: number;
    totalCost: number;
  }>;
}
```

### Cost Tracking API

```typescript
// Get cost summary
GET /api/costs/summary
Response: {
  totalCost: number;           // All-time total
  thisMonth: number;           // Current month
  lastMonth: number;           // Previous month
  avgPerBatch: number;
  totalBatches: number;
  totalFilesTranslated: number;
}

// Get cost history
GET /api/costs/history?limit=50
Response: {
  costs: Array<{
    batchId: string;
    timestamp: string;
    filesTranslated: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    costPerFile: number;
  }>;
}

// Get cost breakdown by language
GET /api/costs/by-language
Response: {
  languages: Array<{
    lang: string;
    filesTranslated: number;
    totalCost: number;
    avgCostPerFile: number;
  }>;
}

// Get cost breakdown by app
GET /api/costs/by-app
Response: {
  apps: Array<{
    appId: string;
    filesTranslated: number;
    totalCost: number;
    avgCostPerFile: number;
  }>;
}
```

### Glossary API

```typescript
// List glossaries for an app
GET /api/glossaries?appId=demo
Response: {
  glossaries: {
    lang: string;
    termCount: number;
    updatedAt: string;
  }[];
}

// Get glossary for a specific language
GET /api/glossaries/:appId/:lang
Response: {
  $meta: { ... };
  terms: Record<string, string>;
}

// Update glossary
POST /api/glossaries/:appId/:lang
Body: {
  terms: Record<string, string>;
}
Response: {
  success: boolean;
  termCount: number;
}

// Delete glossary term
DELETE /api/glossaries/:appId/:lang/:term
```

---

## Configuration

### Environment Variables

```bash
# apps/server/.env

# OpenAI Configuration
OPENAI_API_KEY=sk-...                  # OpenAI API key
OPENAI_MODEL=gpt-4o-mini               # Model to use (gpt-4o-mini, gpt-4, etc.)
OPENAI_TEMPERATURE=0.3                 # Translation consistency (0-1)

# Alternative: Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://...
AZURE_OPENAI_KEY=...
AZURE_OPENAI_DEPLOYMENT=...

# Batch API Settings
BATCH_CHECK_INTERVAL=10000             # Poll batch status every 10 seconds
BATCH_TIMEOUT=86400000                 # 24 hour max timeout in ms

# Supported Languages
SUPPORTED_LANGUAGES=en-US,es-ES,fr-FR,de-DE,ja-JP
DEFAULT_SOURCE_LANGUAGE=en-US
```

### SDK Language Configuration

```typescript
// packages/sdk/src/config.ts

export interface ContentFlowConfig {
  appId: string;
  language: string;                    // Current language
  fallbackLanguage?: string;           // Fallback if translation missing
  availableLanguages?: string[];       // All available languages
  storageUrl: string;
  pages?: string[];
}

// Usage in consuming apps
await ContentFlowSDK.initialize({
  appId: 'demo',
  language: localStorage.getItem('language') || 'en-US',
  fallbackLanguage: 'en-US',
  availableLanguages: ['en-US', 'es-ES', 'fr-FR'],
  storageUrl: '/data',
  pages: ['home', 'about', 'contact']
});

// Switch language dynamically
ContentFlowSDK.setLanguage('es-ES');  // Reloads content
```

---

## CMS UI Components

### 1. Language Dropdown (Header)

```tsx
// apps/cms/src/components/LanguageDropdown.tsx

interface LanguageDropdownProps {
  currentLang: string;
  availableLanguages: string[];
  onLanguageChange: (lang: string) => void;
}

export function LanguageDropdown({ currentLang, availableLanguages, onLanguageChange }: LanguageDropdownProps) {
  return (
    <select value={currentLang} onChange={(e) => onLanguageChange(e.target.value)}>
      <option value="en-US">🇺🇸 English (US)</option>
      <option value="es-ES">🇪🇸 Español</option>
      <option value="fr-FR">🇫🇷 Français</option>
      <option value="de-DE">🇩🇪 Deutsch</option>
      <option value="ja-JP">🇯🇵 日本語</option>
    </select>
  );
}
```

### 2. Translation Progress Indicator

```tsx
// apps/cms/src/components/TranslationProgress.tsx

export function TranslationProgress({ jobId }: { jobId: string }) {
  const { data, isLoading } = useQuery(['translation-status', jobId], 
    () => fetch(`/api/translate/status/${jobId}`).then(r => r.json()),
    { refetchInterval: 1000 }
  );

  if (data?.status === 'complete') {
    return <Toast>✓ Translations complete!</Toast>;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg p-4 rounded-lg">
      <div className="flex items-center gap-2">
        <Spinner size="sm" />
        <span>Translating... {data?.progress.completed}/{data?.progress.total}</span>
      </div>
      <Progress value={(data?.progress.completed / data?.progress.total) * 100} />
    </div>
  );
}
```

### 4. LanguageDropdown (Header)

```tsx
// apps/cms/src/components/LanguageDropdown.tsx

interface LanguageDropdownProps {
  currentLang: string;
  availableLanguages: string[];
  onLanguageChange: (lang: string) => void;
}

export function LanguageDropdown({ currentLang, availableLanguages, onLanguageChange }: LanguageDropdownProps) {
  return (
    <select value={currentLang} onChange={(e) => onLanguageChange(e.target.value)}>
      <option value="en-US">🇺🇸 English (US)</option>
      <option value="es-ES">🇪🇸 Español</option>
      <option value="fr-FR">🇫🇷 Français</option>
      <option value="de-DE">🇩🇪 Deutsch</option>
      <option value="ja-JP">🇯🇵 日本語</option>
    </select>
  );
}
```

```tsx
// apps/cms/src/components/QualityReview.tsx

export function QualityReview({ appId, pageId, sourceLang, targetLang }: QualityReviewProps) {
  const sourceContent = useContentFile(appId, pageId, sourceLang);
  const translatedContent = useContentFile(appId, pageId, targetLang);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3>Source ({sourceLang})</h3>
        {Object.entries(sourceContent).map(([key, value]) => (
          <div key={key}>
            <label>{key}</label>
            <input value={value} readOnly />
          </div>
        ))}
      </div>
      <div>
        <h3>Translation ({targetLang})</h3>
        {Object.entries(translatedContent).map(([key, value]) => (
          <div key={key}>
            <label>{key}</label>
            <input 
              value={value} 
              onChange={(e) => updateTranslation(key, e.target.value)}
            />
          </div>
        ))}
        <button onClick={() => saveTranslation()}>Save Edits</button>
      </div>
    </div>
  );
}
```

### 4. Glossary Manager

```tsx
// apps/cms/src/components/GlossaryManager.tsx

export function GlossaryManager({ appId, lang }: GlossaryManagerProps) {
  const { data: glossary, refetch } = useQuery(
    ['glossary', appId, lang],
    () => fetch(`/api/glossaries/${appId}/${lang}`).then(r => r.json())
  );

  const addTerm = async (term: string, translation: string) => {
    await fetch(`/api/glossaries/${appId}/${lang}`, {
      method: 'POST',
      body: JSON.stringify({
        terms: { ...glossary.terms, [term]: translation }
      })
    });
    refetch();
  };

  return (
    <div>
      <h2>Glossary: {lang}</h2>
      <table>
        <thead>
          <tr>
            <th>English Term</th>
            <th>Translation</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(glossary?.terms || {}).map(([term, translation]) => (
            <tr key={term}>
              <td>{term}</td>
              <td>{translation}</td>
              <td>
                <button onClick={() => deleteTerm(term)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={(e) => {
        e.preventDefault();
        addTerm(e.target.term.value, e.target.translation.value);
      }}>
        <input name="term" placeholder="English term" required />
        <input name="translation" placeholder="Translation" required />
        <button type="submit">Add Term</button>
      </form>
    </div>
  );
}
```

---

## Translation Strategy

### Incremental Translation (Cost Optimization)

```typescript
// apps/server/src/utils/diffContent.ts

export function getChangedKeys(
  oldContent: Record<string, string>,
  newContent: Record<string, string>
): string[] {
  const changed: string[] = [];
  
  for (const key in newContent) {
    if (key === '$meta') continue;
    if (oldContent[key] !== newContent[key]) {
      changed.push(key);
    }
  }
  
  return changed;
}

// Only translate changed keys
const changedKeys = getChangedKeys(oldContentEn, newContentEn);
const contentToTranslate = pick(newContentEn, changedKeys);

// Merge with existing translation
const existingTranslation = await storage.readContent(`${appId}-${pageId}-es-ES.json`);
const newTranslation = await translate(contentToTranslate, 'en-US', 'es-ES');
const finalTranslation = { ...existingTranslation, ...newTranslation };
```

### Batch Translation (Full Page Re-Translation)

```typescript
// When user clicks "Retranslate All"
const allContent = await storage.readContent(`${appId}-${pageId}-en-US.json`);
const translated = await translate(allContent, 'en-US', 'es-ES', { useGlossary: true });
await storage.writeContent(`${appId}-${pageId}-es-ES.json`, translated);
```

---

## Cost Estimation

### OpenAI Pricing (GPT-4o-mini)

- **Input**: $0.150 per 1M tokens (~$0.00015 per 1K tokens)
- **Output**: $0.600 per 1M tokens (~$0.0006 per 1K tokens)

### Typical Content Page

```json
{
  "$meta": { ... },
  "hero-title": "Welcome to ContentFlow",
  "hero-subtitle": "Edit content without code",
  "cta-button": "Get Started",
  "feature-1-title": "Easy to Use",
  "feature-1-desc": "No coding required",
  ...
  // ~20-30 content keys
}
```

**Token Estimate**:
- Input (English + prompt + glossary): ~500 tokens
- Output (Translated JSON): ~400 tokens
- Total: ~900 tokens

**Cost per Language**: ~$0.00033  
**Cost for 5 Languages**: ~$0.00165  

**With Batch API (50% Discount)**:
- Input cost: 500 tokens × $0.000075 = **$0.0000375**
- Output cost: 400 tokens × $0.0003 = **$0.00012**
- **Total per file per language**: **~$0.00016** (50% cheaper!)

**Bulk Translation Example** (11 files × 4 languages = 44 requests):
- Total batch cost: **~$0.0069**
- Cost per file: **~$0.00016**
- vs Standard API: **$0.014** → **50% savings**  

**Incremental Update** (5 changed keys):
- Input: ~200 tokens
- Output: ~150 tokens
- Total: ~350 tokens
- **Standard API**: Cost per language: ~$0.00012
- **Batch API**: Cost per language: ~**$0.00006** (50% off)

### Monthly Cost Estimates (Batch API - 50% Discount)

| Scenario | Batches/Month | Files per Batch | Languages | Monthly Cost |
|----------|---------------|-----------------|-----------|--------------|
| Small Project | 2 batches | 11 files | 4 | **~$0.03** |
| Medium Project | 4 batches | 11 files | 5 | **~$0.08** |
| Large Project | 10 batches | 20 files | 5 | **~$0.32** |
| Enterprise | 20 batches | 50 files | 10 | **~$3.20** |

**Conclusion**: 
- Batch API provides **50% cost savings** over standard API
- Translation costs remain **negligible** compared to Azure hosting ($5-7/month)
- Typical usage: **<$0.50/month** for translation costs
- Small delay (30 min - 2 hours) is acceptable for bulk translation workflow

---

## Quality Assurance

### Translation Validation

```typescript
// apps/server/src/utils/validateTranslation.ts

export function validateTranslation(
  source: Record<string, string>,
  translated: Record<string, string>
): ValidationResult {
  const errors: string[] = [];

  // Check all source keys exist
  for (const key in source) {
    if (!(key in translated)) {
      errors.push(`Missing key: ${key}`);
    }
  }

  // Check for empty translations
  for (const [key, value] of Object.entries(translated)) {
    if (!value || value.trim() === '') {
      errors.push(`Empty translation for key: ${key}`);
    }
  }

  // Check for untranslated content (same as source)
  for (const key in source) {
    if (source[key] === translated[key] && source[key].length > 5) {
      // Warning: possible untranslated content
      errors.push(`Possible untranslated: ${key}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### Testing Strategy

1. **Unit Tests**: TranslationService with mocked OpenAI
2. **Integration Tests**: Full translation flow with test API key
3. **E2E Tests**: CMS translation UI + background jobs
4. **Manual QA**: Native speakers review translations

---

## Security & Privacy

### API Key Management

```typescript
// Never expose OpenAI API key to client
// Server-side only in apps/server/.env

// Future: Azure Key Vault integration
const keyVaultClient = new SecretClient(vaultUrl, credential);
const secret = await keyVaultClient.getSecret("OPENAI-API-KEY");
const apiKey = secret.value;
```

### Content Privacy

- **No data retention**: OpenAI API with `data_usage: "never"` (future)
- **No training**: Content not used to train models
- **Audit logs**: Track who translated what (future)

---

## Rollout Plan

### Phase 1: Core Translation Service (Week 1)
- Set up OpenAI integration
- Implement TranslationService
- Add glossary storage
- Create background job queue

### Phase 2: API Endpoints (Week 1)
- POST /api/translate
- GET /api/translate/status/:jobId
- CRUD endpoints for glossaries

### Phase 3: CMS UI Components (Week 2)
- Language dropdown in header
- Auto-translate toggle in settings
- Progress indicator for translations
- Toast notifications

### Phase 4: Quality Review (Week 2)
- Side-by-side translation view
- Inline editing of translations
- Glossary manager UI

### Phase 5: Testing & Optimization (Week 3)
- Unit tests (TranslationService, GlossaryService)
- Integration tests (API endpoints)
- E2E tests (CMS workflows)
- Performance optimization (batching, caching)

### Phase 6: Documentation & Rollout (Week 3)
- User guide for translators
- API documentation
- Runbook for troubleshooting
- Deploy to production

---

## Success Metrics

### Functional Requirements
- ✅ Auto-translate on save with <5s delay
- ✅ Support 5+ languages simultaneously
- ✅ Glossary support for custom terms
- ✅ Manual re-translation for quality control
- ✅ Progress indicators in UI
- ✅ Translation history/rollback (future)

### Performance Requirements
- Translation latency: <3s per language
- Background job processing: <10s total for 5 languages
- Cost: <$0.02 per save operation
- Accuracy: >95% (manual review)

### User Experience
- Zero configuration for auto-translate
- One-click manual translation
- Visual feedback during translation
- Easy glossary management

---

## Future Enhancements

### Phase 2 Features (Future)
1. **Translation Memory**: Cache common phrases for faster/cheaper translation
2. **Human Review Workflow**: Flag translations for manual review before publish
3. **Context-Aware Translation**: Use page screenshots for better visual context
4. **Multi-Language Preview**: View all languages side-by-side in iframe
5. **Translation Analytics**: Track cost, usage, accuracy over time
6. **Custom AI Models**: Fine-tune models for specific domains (finance, healthcare)
7. **Real-Time Collaboration**: Multiple translators editing simultaneously

---

## References

- **Spec**: [spec.md](spec.md) - Full feature specification
- **Tasks**: [tasks.md](tasks.md) - Implementation tasks (to be created)
- **OpenAI Docs**: https://platform.openai.com/docs
- **GPT-4o-mini Pricing**: https://openai.com/api/pricing/

---

**Plan Status**: Ready for Implementation  
**Est. Duration**: 3 weeks  
**Est. Cost**: <$0.50/month (translation) + Azure hosting ($5-7/month)  
**Next Step**: Create tasks.md with detailed implementation breakdown
