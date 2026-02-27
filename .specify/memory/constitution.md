<!--
Sync Impact Report:
- Version: 1.0.0 (initial ratification)
- New project constitution for ContentFlow CMS
- Templates: All initialized ✅
- Follow-up: Azure Blob publish integration deferred to Phase 2
-->

# ContentFlow CMS Constitution

## Core Principles

### I. Library-First (NON-NEGOTIABLE)
Every content delivery capability MUST be packaged as a standalone, framework-agnostic library (`@contentflow/sdk`). The SDK is the single source of truth for content resolution. It MUST be usable in React, Angular, and plain JavaScript without modification. No framework-specific code is permitted inside the SDK core.

### II. Content-ID as Contract
Every piece of editable content MUST have a `content-id` as the immutable key linking authoring, storage, and rendering. A `content-id` MUST be unique per app and page. The CMS MUST never rename or re-assign a `content-id` once published. Default text/images MUST always be provided as fallback.

### III. SOLID & KISS (NON-NEGOTIABLE)
- **Single Responsibility**: Each module/component has one reason to change.
- **Open/Closed**: Content resolvers are open for extension (new storage adapters) but closed for modification.
- **Liskov**: All storage adapters (local JSON, Azure Blob) MUST be interchangeable via the `IContentStorage` interface.
- **Interface Segregation**: Components consume only the content interfaces they need.
- **Dependency Inversion**: Components depend on abstractions (`IContentResolver`), not implementations.
- **KISS**: Prefer flat JSON structures over nested schemas. No abstraction without a concrete use case.

### IV. Multi-Tenancy by App & Page
Content is scoped as `{appId}/{pageId}/{contentId}`. The CMS MUST support multiple registered apps. Page content MUST be isolated between apps. The SDK MUST initialize per-app with `{ appId, language, storageUrl }`.

### V. Internationalization First
Every content JSON file MUST be language-scoped. File naming convention: `{appId}-{pageId}-{lang}.json` (e.g., `bwo-taxforms-home-es-ES.json`). The SDK MUST fall back to `en-US` if the requested locale file is missing. Language switching MUST NOT require a page reload.

### VI. Test-First (NON-NEGOTIABLE)
Tests are written BEFORE implementation. Red-Green-Refactor is mandatory. Unit tests cover SDK content resolution. Integration tests cover CMS ↔ consuming app round-trips. E2E tests cover the full authoring → save → render cycle.

### VII. Progressive Enhancement
The rendering components (`<ContentComponent>`) MUST render default content immediately (no layout shift). Content from storage replaces defaults after hydration. No spinner or blank state on initial render.

### VIII. Storage Abstraction
All storage reads/writes MUST go through the `IContentStorage` interface:
```ts
interface IContentStorage {
  read(path: string): Promise<ContentMap>;
  write(path: string, data: ContentMap): Promise<void>;
}
```
Local JSON adapter MUST be the default. Azure Blob adapter is Phase 2. Storage adapters MUST be swappable without changing consumers.

## Architecture Boundaries

The system comprises three independently deployable concerns:

1. **ContentFlow CMS App** (`apps/cms`) — React + Tailwind management portal. Port 3000.
2. **BWO Tax Forms** (`apps/bwo-tax-forms`) — React metadata-driven form rendering app. Port 3001.
3. **Demo App** (`apps/demo`) — Simple React app with 3-4 pages. Port 3002.
4. **ContentFlow SDK** (`packages/sdk`) — Framework-agnostic TypeScript library. Published as NPM package internally.
5. **Shared Data** (`data/`) — Local JSON content files, one per app/page/locale.

Cross-app communication happens ONLY through the SDK and shared `data/` directory. Apps MUST NOT import directly from each other.

## Development Workflow

1. Constitution check before every feature spec.
2. Spec → Plan → Tasks → Implement lifecycle via spec-kit commands.
3. All PRs require constitution compliance review.
4. Breaking changes to `content-id` schema require a major version bump.
5. UI changes require Tailwind-only styling (no custom CSS files unless unavoidable).
6. State management: Redux Toolkit (RTK) in CMS app. Local state in SDK consumers.

## Governance

This constitution supersedes all other practices. Amendments require:
- Written rationale in PR description.
- Version bump per semantic versioning.
- Migration plan for any breaking principle changes.
- Team approval before merge.

All PRs must verify: no direct cross-app imports, content-id uniqueness, SDK adapter interface compliance, fallback default text/image present.

**Version**: 1.0.0 | **Ratified**: 2026-02-27 | **Last Amended**: 2026-02-27
