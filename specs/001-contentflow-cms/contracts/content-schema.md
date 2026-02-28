# Content JSON Schema Contract

**File Format**: JSON  
**Version**: 1.0.0  
**Status**: Phase 1  
**Date**: 2026-02-27

---

## Purpose

This contract defines the JSON file format for storing editable content in ContentFlow CMS. This format is used by:
1. Node.js file server (reading/writing files)
2. SDK storage adapters (parsing content)
3. CMS editor (displaying/editing content)
4. CDN deployment (Phase 2)

**Breaking Change Policy**: Changes to required fields or schema structure require a migration plan and version bump.

---

## File Naming Convention

**Pattern**: `{appId}-{pageId}-{lang}.json`

**Components**:
- `{appId}`: Application identifier (lowercase, kebab-case, 3-50 chars)
- `{pageId}`: Page identifier within app (lowercase, kebab-case, 3-50 chars)
- `{lang}`: BCP 47 language tag (e.g., `en-US`, `es-ES`, `fr-FR`)

**Examples**:
- `demo-home-en-US.json` — Demo App, Home page, English (US)
- `demo-home-es-ES.json` — Demo App, Home page, Spanish (Spain)
- `bwo-taxforms-personal-info-en-US.json` — BWO Tax Forms, Personal Info page, English (US)

**Storage Location**: `data/` directory (Phase 1: local file system, Phase 2: Azure Blob)

**Constraints**:
- Filename MUST match the `$meta` fields inside the file (validation enforced by server)
- Language code MUST be valid BCP 47 tag
- Total filename length MUST NOT exceed 255 characters

---

## JSON Schema

### Top-Level Structure

```json
{
  "$meta": {
    "appId": "string (required, 3-50 chars, kebab-case)",
    "pageId": "string (required, 3-50 chars, kebab-case)",
    "lang": "string (required, BCP 47 tag)",
    "version": "integer (required, >= 1)",
    "updatedAt": "string (required, ISO 8601 timestamp)"
  },
  "[contentId: string]": "string (content value)"
}
```

### Field Definitions

#### `$meta` Object (Required, Reserved)

**Purpose**: File metadata for versioning, provenance, and validation.

**Fields**:

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `appId` | string | Yes | 3-50 chars, kebab-case, matches filename | Application ID |
| `pageId` | string | Yes | 3-50 chars, kebab-case, matches filename | Page ID |
| `lang` | string | Yes | BCP 47 tag, matches filename | Language code |
| `version` | integer | Yes | >= 1, auto-incremented on save | File version (for conflict detection in Phase 2) |
| `updatedAt` | string | Yes | ISO 8601 format | Last update timestamp |

**Example**:
```json
{
  "$meta": {
    "appId": "demo",
    "pageId": "home",
    "lang": "en-US",
    "version": 3,
    "updatedAt": "2026-02-27T14:32:15Z"
  }
}
```

**Reserved Key**: `$meta` is reserved. Content IDs MUST NOT be named `$meta`.

---

#### Content Entries (Key-Value Pairs)

**Purpose**: Flat map of editable content identified by `contentId`.

**Schema**:
```json
{
  "[contentId]": "[value]"
}
```

**Validation Rules**:

| Aspect | Rule |
|--------|------|
| Key (contentId) | 3-100 chars, kebab-case, lowercase, regex: `^[a-z0-9-]+$` |
| Value | String only (text or image URL), 0-10,000 chars |
| Uniqueness | Keys MUST be unique within the file |
| Immutability | Once a `contentId` is published, it MUST NOT be renamed (can only update value) |

**Examples**:

**Text Content**:
```json
{
  "hero-title": "Welcome to ContentFlow",
  "hero-subtitle": "Edit content without touching code",
  "cta-button": "Get Started",
  "footer-copyright": "© 2026 ContentFlow Inc."
}
```

**Image Content**:
```json
{
  "hero-image": "/data/images/demo-hero-image-1709035800.jpg",
  "nav-logo": "/data/images/demo-nav-logo-1709036000.png"
}
```

**Mixed Content**:
```json
{
  "$meta": {
    "appId": "demo",
    "pageId": "home",
    "lang": "en-US",
    "version": 1,
    "updatedAt": "2026-02-27T10:00:00Z"
  },
  "hero-title": "Welcome to ContentFlow",
  "hero-subtitle": "Edit content without touching code",
  "hero-image": "/data/images/demo-hero-image-1709035800.jpg",
  "cta-button": "Get Started"
}
```

---

## Complete Example

**File**: `data/demo-home-en-US.json`

```json
{
  "$meta": {
    "appId": "demo",
    "pageId": "home",
    "lang": "en-US",
    "version": 1,
    "updatedAt": "2026-02-27T10:00:00Z"
  },
  "hero-title": "Welcome to ContentFlow CMS",
  "hero-subtitle": "Edit content without touching code",
  "hero-description": "ContentFlow provides a visual editor for managing text and images across your React, Angular, or vanilla JS apps. Changes go live instantly.",
  "hero-image": "/data/images/demo-hero-image-1709035800.jpg",
  "cta-button": "Get Started",
  "feature-1-title": "Framework Agnostic",
  "feature-1-text": "Works with React, Angular, and plain JavaScript",
  "feature-2-title": "Zero Deployment",
  "feature-2-text": "Local JSON storage for instant updates during development",
  "feature-3-title": "Progressive Enhancement",
  "feature-3-text": "Defaults render immediately, overrides load asynchronously",
  "footer-copyright": "© 2026 ContentFlow Inc. All rights reserved."
}
```

---

## Localization Example

**File**: `data/demo-home-es-ES.json` (Spanish translation)

```json
{
  "$meta": {
    "appId": "demo",
    "pageId": "home",
    "lang": "es-ES",
    "version": 1,
    "updatedAt": "2026-02-27T10:30:00Z"
  },
  "hero-title": "Bienvenido a ContentFlow CMS",
  "hero-subtitle": "Edita contenido sin tocar código",
  "hero-description": "ContentFlow proporciona un editor visual para gestionar texto e imágenes en tus aplicaciones React, Angular o JavaScript. Los cambios se publican al instante.",
  "hero-image": "/data/images/demo-hero-image-1709035800.jpg",
  "cta-button": "Empezar",
  "feature-1-title": "Agnóstico de Framework",
  "feature-1-text": "Funciona con React, Angular y JavaScript simple",
  "feature-2-title": "Cero Despliegue",
  "feature-2-text": "Almacenamiento JSON local para actualizaciones instantáneas durante el desarrollo",
  "feature-3-title": "Mejora Progresiva",
  "feature-3-text": "Los valores predeterminados se renderizan de inmediato, las sobrescrituras se cargan de forma asíncrona",
  "footer-copyright": "© 2026 ContentFlow Inc. Todos los derechos reservados."
}
```

**Note**: Content IDs remain the same across locales. Only values change.

---

## Validation Rules

### Server-Side Validation (Node.js CMS Server)

**On Write (`POST /api/content/:filename`)**:

1. **Filename Validation**:
   - Pattern: `^[a-z0-9-]+-[a-z0-9-]+-[a-z]{2}-[A-Z]{2}\.json$`
   - Example: `demo-home-en-US.json` ✅
   - Example: `Demo-Home-en-US.json` ❌ (uppercase)
   - Example: `demo_home_en_US.json` ❌ (underscores)

2. **$meta Integrity**:
   - Extract `{appId}`, `{pageId}`, `{lang}` from filename
   - Verify `$meta.appId === appId`
   - Verify `$meta.pageId === pageId`
   - Verify `$meta.lang === lang`
   - Auto-generate `$meta.version` (increment from existing file or start at 1)
   - Auto-generate `$meta.updatedAt` (current ISO 8601 timestamp)

3. **Content Key Validation**:
   - All keys except `$meta` MUST match regex: `^[a-z0-9-]{3,100}$`
   - Reject if any key is `$meta` (reserved)
   - Reject if any key is empty or exceeds 100 chars

4. **Content Value Validation**:
   - All values MUST be strings
   - Maximum length: 10,000 characters per value
   - Reject if value is not a string (number, boolean, object, array, null)

5. **JSON Syntax Validation**:
   - MUST be valid JSON (parseable by `JSON.parse()`)
   - No trailing commas, comments, or other non-standard JSON

**Error Responses**:
- 400 Bad Request: Invalid JSON syntax, validation failure
- 404 Not Found: App/page not registered in `apps.config.json`
- 500 Internal Server Error: File system write failure

---

### Client-Side Validation (SDK)

**On Read (`IContentStorage.read()`)**:

1. **Graceful Fallback**:
   - If file 404: Return empty `ContentMap = {}`
   - If JSON parse error: Log warning, return empty `ContentMap`
   - If `$meta` missing: Log warning, use content anyway

2. **$meta Stripping**:
   - SDK MUST strip `$meta` before returning `ContentMap`
   - `ContentMap` contains only content entries, not metadata

**Example**:
```typescript
// Raw file content
const raw = {
  "$meta": { "appId": "demo", "pageId": "home", "lang": "en-US", "version": 1, "updatedAt": "..." },
  "hero-title": "Welcome"
};

// Returned by SDK adapter
const contentMap = { "hero-title": "Welcome" }; // $meta removed
```

---

## Evolution & Migration

### Adding New Fields to `$meta`

**Process**:
1. Update this contract document
2. Increment schema version in `$meta.schemaVersion` (if added)
3. Update Node.js server validation logic
4. Ensure old files without new fields still parse correctly (backward compatibility)

**Example** (Phase 2 addition):
```json
{
  "$meta": {
    "appId": "demo",
    "pageId": "home",
    "lang": "en-US",
    "version": 5,
    "updatedAt": "2027-01-15T08:00:00Z",
    "schemaVersion": "1.1",        // NEW: schema version
    "lastEditedBy": "user@example.com"  // NEW: audit trail
  }
}
```

### Changing Content Key Format

**NOT ALLOWED**: Renaming or restructuring content keys is a breaking change.

**Workaround**:
- Deprecate old key, introduce new key, update consuming apps to use new key
- Maintain both keys during transition period
- Phase out old key after all apps migrated

---

## Performance Considerations

### File Size

**Guideline**: Keep content files under 50KB per file.

**Reasoning**:
- Faster fetch over network
- Faster JSON parsing in browser
- Better cache performance

**If file grows large (>50KB)**:
- Consider splitting page into sub-pages
- Move large blocks of text to separate markdown files (out of scope for Phase 1)

### Caching

**Headers** (Node.js server response):
```http
Cache-Control: no-cache
ETag: "demo-home-en-US-v3"
Last-Modified: Wed, 27 Feb 2026 10:00:00 GMT
```

**Strategy**:
- `no-cache`: Browser must revalidate with server (CMS needs latest content)
- `ETag`: Version-based tag for conditional requests
- Phase 2: Use CDN with longer cache TTL (e.g., 1 hour), invalidate on publish

---

## Security Considerations

### Phase 1 (Local Development)

- **No authentication**: Anyone with access to localhost can read/write content files
- **No input sanitization**: Assume trusted users only
- **No XSS protection**: Consuming apps must sanitize content before rendering (if needed)

### Phase 2 (Production)

- **Authentication**: Require Azure AD login for CMS access
- **Authorization**: Role-based access (editor vs. viewer)
- **Input validation**: Sanitize HTML, validate URLs, enforce content policies
- **XSS protection**: Escape content in React/Angular (automatic), validate in vanilla JS

---

## Contract Summary

**Immutable Rules** (breaking changes require major version):
- File naming pattern: `{appId}-{pageId}-{lang}.json`
- `$meta` is reserved key
- Content keys must be kebab-case, 3-100 chars
- Content values must be strings, max 10,000 chars

**Flexible Rules** (can evolve with minor version):
- Additional fields in `$meta` (backward compatible)
- Validation logic (can be stricter over time)
- Error messages and logging

**Next Contract**: [postmessage-protocol.md](./postmessage-protocol.md) — CMS ↔ iframe communication protocol.
