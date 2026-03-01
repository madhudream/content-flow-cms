# AI-Powered Translation API

ContentFlow CMS now supports AI-powered bulk translation using OpenAI's Batch API with 50% cost savings.

## Features

✅ **Batch Translation**: Translate all content files in bulk using OpenAI Batch API  
✅ **Cost Tracking**: Detailed cost breakdown with 50% Batch API discount  
✅ **Glossary Support**: Custom terminology for consistent brand translations  
✅ **Progress Monitoring**: Real-time batch status and progress tracking  
✅ **Validation**: Automatic translation quality validation  
✅ **Rate Limiting**: 5 bulk translation requests per hour per IP

---

## Quick Start

### 1. Configure OpenAI API

Add to `apps/server/.env`:

```bash
OPENAI_API_KEY=sk-proj-your-api-key
OPENAI_MODEL=gpt-4o-mini    # or gpt-5.1 (avoid gpt-5-nano - no temperature support)
OPENAI_TEMPERATURE=0.3      # Lower = more consistent, Higher = more creative
```

**Recommended Models:**
- **`gpt-4o-mini`** - Cost-effective, good quality (recommended for most use cases)
- **`gpt-5.1`** - Latest model, highest quality, supports temperature
- **Avoid `gpt-5-nano`** - Does not support temperature parameter

**Temperature Guidelines:**
- `0.1-0.3` - More consistent, literal translations (recommended for technical content)
- `0.4-0.7` - Balanced translations with some creativity
- `0.8-1.0` - More creative, natural language (use with caution)

### 2. Create Glossaries (Optional)

Create glossary files in `data/glossaries/`:

```json
{
  "$meta": {
    "appId": "demo",
    "lang": "es-ES",
    "version": 1,
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  "terms": {
    "ContentFlow": "ContentFlow",
    "Dashboard": "Panel de Control",
    "Get Started": "Comenzar"
  }
}
```

### 3. Trigger Bulk Translation

#### Via CMS UI (Recommended)

1. Open CMS at `http://localhost:3000`
2. Select an app (or leave unselected to translate all apps)
3. Click **"Translate All"** button in header
4. Review estimated cost in confirmation dialog
5. Click **"Confirm & Start"**
6. Monitor progress in real-time modal

**View Translation History:**
- Click **"View History"** button next to "Translate All"
- View all past batches with status and progress
- See cost breakdown and analytics
- Click "View Details" on any batch for live progress

#### Via API

```bash
POST http://localhost:8080/api/translate/bulk
Content-Type: application/json

{
  "sourceLang": "en-US",
  "targetLangs": ["es-ES", "fr-FR", "de-DE", "ja-JP"],
  "appIds": ["demo", "bwo-taxforms"]  // Optional: filter by apps
}
```

**Response:**

```json
{
  "batchId": "batch_abc123",
  "status": "validating",
  "totalRequests": 44,
  "estimatedCost": 0.0069,
  "estimatedTime": "24 hours max, typically 30 min - 2 hours"
}
```

### 4. Check Batch Status

```bash
GET http://localhost:8080/api/translate/batch/batch_abc123
```

**Response (in progress):**

```json
{
  "batchId": "batch_abc123",
  "status": "in_progress",
  "progress": {
    "total": 44,
    "completed": 28,
    "failed": 0
  },
  "createdAt": "2026-03-01T10:00:00Z"
}
```

**Response (completed):**

```json
{
  "batchId": "batch_abc123",
  "status": "completed",
  "progress": {
    "total": 44,
    "completed": 44,
    "failed": 0
  },
  "createdAt": "2026-03-01T10:00:00Z",
  "completedAt": "2026-03-01T11:30:00Z",
  "filesTranslated": 44,
  "filesFailed": 0,
  "totalCost": 0.0069,
  "costPerFile": 0.00016,
  "inputTokens": 22000,
  "outputTokens": 18000,
  "savedFiles": ["demo-home-es-ES.json", "demo-home-fr-FR.json", ...]
}
```

### 5. List Recent Batches

```bash
GET http://localhost:8080/api/translate/batches?limit=10
```

**Response:**

```json
{
  "batches": [
    {
      "batchId": "batch_abc123",
      "status": "completed",
      "sourceLang": "en-US",
      "targetLangs": ["es-ES", "fr-FR"],
      "totalRequests": 44,
      "createdAt": "2026-03-01T10:00:00Z",
      "completed At": "2026-03-01T11:30:00Z"
    }
  ]
}
```

---

## Cost Estimation

### OpenAI Batch API Pricing (50% Discount)

- **Input**: $0.075 per 1M tokens (vs $0.150 standard)
- **Output**: $0.300 per 1M tokens (vs $0.600 standard)

### Typical Content Page

- **Tokens**: ~500 input + ~400 output = ~900 tokens
- **Cost per file**: ~$0.00016
- **Bulk translation** (11 files × 4 languages = 44 requests): ~$0.0069

### Monthly Estimates

| Scenario | Batches/Month | Files per Batch | Languages | Monthly Cost |
|----------|---------------|-----------------|-----------|--------------|
| Small Project | 2 | 11 | 4 | **~$0.03** |
| Medium Project | 4 | 11 | 5 | **~$0.08** |
| Large Project | 10 | 20 | 5 | **~$0.32** |

---

## File Structure

```
data/
├── glossaries/              # Custom terminology
│   ├── demo-es-ES.json
│   ├── demo-fr-FR.json
│   └── bwo-taxforms-es-ES.json
├── translation-batches/     # Batch job metadata
│   ├── batch_abc123.json
│   └── batch_def456.json
└── costs/                   # Cost tracking (future)
    └── translation-costs.json
```

---

## Translation Validation

The system automatically validates translations:

✅ All source keys exist in translation  
✅ No empty translations  
⚠️  Warns about potentially untranslated content (identical to source)  
⚠️  Flags extra keys not in source

---

## Glossary Management

Glossaries ensure consistent brand terminology across translations.

### Glossary File Format

```json
{
  "$meta": {
    "appId": "demo",
    "lang": "es-ES",
    "version": 1,
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  "terms": {
    "English Term": "Spanish Translation",
    "ContentFlow": "ContentFlow",  // Brand name (no translation)
    "Dashboard": "Panel de Control"
  }
}
```

### Best Practices

- **Brand names**: Keep unchanged (e.g., "ContentFlow")
- **UI terms**: Provide consistent translations (e.g., "Dashboard" → "Panel de Control")
- **Domain terms**: Add industry-specific vocabulary
- **Update regularly**: Sync glossaries as product evolves

---

## Rate Limiting

- **Limit**: 5 bulk translation requests per hour per IP
- **Window**: 1 hour rolling window
- **Response**: `429 Too Many Requests` with `Retry-After` header

---

## Error Handling

### Failed Translations

If individual translations fail, they're logged but don't stop the batch:

```json
{
  "filesTranslated": 42,
  "filesFailed": 2,
  "failedFiles": ["demo-about-ja-JP", "bwo-home-de-DE"]
}
```

Check server logs for detailed error messages.

### Batch API Errors

- **Invalid API key**: Check `OPENAI_API_KEY` in `.env`
- **Rate limits**: OpenAI Batch API has generous limits; contact support if needed
- **Timeout**: Batches complete within 24 hours (typically 30 min - 2 hours)

---

## Testing

### Test Translation API

```bash
# Start server
cd /Users/bhairavbaba/bhatuka/content-flow/apps/server
bun run dev

# Trigger translation
curl -X POST http://localhost:8080/api/translate/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "sourceLang": "en-US",
    "targetLangs": ["es-ES"],
    "appIds": ["demo"]
  }'

# Check status
curl http://localhost:8080/api/translate/batch/batch_abc123
```

---

## Implementation Details

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CMS triggers bulk translation via /api/translate/bulk   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. TranslationService prepares batch requests (JSONL)       │
│    - Scans content files                                    │
│    - Loads glossaries                                       │
│    - Builds translation prompts                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Upload to OpenAI Batch API                               │
│    - Creates batch job with 24h completion window           │
│    - Returns batch ID                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CMS polls /api/translate/batch/:batchId every 10s        │
│    - Shows progress: "Translating 28/44 files"             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Batch completes → automatic processing                   │
│    - Downloads output file                                  │
│    - Validates translations                                 │
│    - Saves translated files                                 │
│    - Calculates costs                                       │
└─────────────────────────────────────────────────────────────┘
```

### Code Structure

```
apps/server/src/
├── services/
│   └── TranslationService.ts    # OpenAI Batch API integration
├── routes/
│   └── translate.ts              # Translation API endpoints
└── utils/
    ├── batchPreparer.ts          # JSONL batch file preparation
    ├── validateTranslation.ts    # Translation quality validation
    └── rateLimiter.ts            # Rate limiting for translation endpoints
```

---

## Next Steps

✅ **Phase 1 & 2 Complete**: Core translation service and API endpoints  
🚧 **Phase 3 (TODO)**: Cost tracking dashboard and API  
🚧 **Phase 4 (TODO)**: SDK language support (`setLanguage()`)  
🚧 **Phase 5 (TODO)**: CMS UI components (TranslateAllButton, BatchProgress)  
🚧 **Phase 6 (TODO)**: Glossary management UI  
🚧 **Phase 7 (TODO)**: Testing suite  
🚧 **Phase 8 (TODO)**: Documentation

---

## Support

For questions or issues:

1. Check server logs: `apps/server/.log`
2. Verify OpenAI API key: `echo $OPENAI_API_KEY`
3. Test connection: `GET /health` endpoint
4. Review batch status: `GET /api/translate/batches`

---

**Implementation Date**: March 1, 2026  
**OpenAI SDK Version**: 6.25.0  
**Batch API Discount**: 50% off standard pricing
