# Implementation Plan: ContentFlow CMS — Editable Content System

**Branch**: `001-contentflow-cms` | **Date**: 2026-02-27 | **Spec**: `/specs/001-contentflow-cms/spec.md`

---

## Summary

Build a monorepo containing a React + Tailwind CMS portal for editing content, a framework-agnostic TypeScript SDK (`@contentflow/sdk`) for content delivery, and two consuming apps (BWO Tax Forms, Demo App). Content is stored in local JSON files during Phase 1. The SDK provides `<ContentComponent>` for React and a Web Component for Angular.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node 20+  
**Primary Dependencies**: React 18, Redux Toolkit, Tailwind CSS 3, Vite 5, Zustand (SDK), React DnD (optional for CMS UX)  
**Storage**: Local JSON files in `data/` directory (Phase 1); Azure Blob Storage (Phase 2)  
**Testing**: Vitest + React Testing Library; Playwright for E2E  
**Target Platform**: Browser (Chrome, Firefox, Safari modern)  
**Project Type**: Monorepo — 4 packages (1 library + 3 apps)  
**Performance Goals**: SDK <15KB gzipped; content load <200ms local; zero layout shift  
**Constraints**: No cross-app imports; Tailwind-only styling; SOLID/KISS principles  
**Scale/Scope**: 3 apps, 5 pages each, 50 content IDs per page, 10 locales

---

## Constitution Check

✅ **I. Library-First** — SDK is `packages/sdk`, standalone, no framework imports in core  
✅ **II. Content-ID as Contract** — All content keyed by `contentId`; default text always required  
✅ **III. SOLID & KISS** — Storage adapter interface defined; flat JSON; RTK in CMS only  
✅ **IV. Multi-Tenancy** — `appId/pageId/contentId` scoping throughout  
✅ **V. I18n First** — File naming `{appId}-{pageId}-{lang}.json` from day one  
✅ **VI. Test-First** — Vitest tests written before implementation in tasks  
✅ **VII. Progressive Enhancement** — `defaultText` renders synchronously  
✅ **VIII. Storage Abstraction** — `IContentStorage` interface; LocalJsonAdapter default

---

## Project Structure

```text
content-flow/                          # Monorepo root
├── .specify/
│   ├── memory/constitution.md
│   └── templates/
├── .github/
│   └── copilot-instructions/
│       └── copilot-instructions.md   # GitHub Copilot workspace instructions
├── specs/
│   └── 001-contentflow-cms/
│       ├── spec.md
│       ├── plan.md                   # This file
│       ├── data-model.md
│       └── tasks.md
├── data/                             # Shared content JSON store
│   ├── apps.config.json              # App registry
│   ├── demo-home-en-US.json
│   ├── demo-home-es-ES.json
│   ├── bwo-taxforms-home-en-US.json
│   └── example.json                  # Legacy reference (do not use in runtime)
├── packages/
│   └── sdk/                          # @contentflow/sdk
│       ├── src/
│       │   ├── core/
│       │   │   ├── ContentFlowSDK.ts       # Main initialize entry
│       │   │   ├── ContentResolver.ts      # IContentResolver impl
│       │   │   └── store.ts                # Zustand store
│       │   ├── adapters/
│       │   │   ├── IContentStorage.ts      # Interface
│       │   │   └── LocalJsonAdapter.ts     # Default adapter
│       │   ├── react/
│       │   │   └── ContentComponent.tsx    # React component
│       │   ├── webcomponent/
│       │   │   └── ContentWebComponent.ts  # Angular-compatible WC
│       │   └── index.ts
│       ├── package.json
│       └── vite.config.ts
├── apps/
│   ├── cms/                          # ContentFlow CMS Portal
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   └── store.ts          # RTK store
│   │   │   ├── features/
│   │   │   │   ├── apps/             # App selector feature
│   │   │   │   ├── pages/            # Page selector feature
│   │   │   │   ├── editor/           # Content editor panel
│   │   │   │   └── language/         # Language switcher
│   │   │   ├── components/           # Shared UI components
│   │   │   ├── services/
│   │   │   │   └── contentService.ts # Reads/writes data/ JSON
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   └── vite.config.ts            # Port 3000
│   ├── bwo-tax-forms/                # BWO Tax Forms App
│   │   ├── src/
│   │   │   ├── engine/
│   │   │   │   └── FormRenderer.tsx  # Metadata → React form
│   │   │   ├── pages/                # Tax form pages
│   │   │   ├── metadata/             # Page metadata JSONs
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   └── vite.config.ts            # Port 3001
│   └── demo/                         # Simple Demo App
│       ├── src/
│       │   ├── pages/                # 3-4 demo pages
│       │   └── main.tsx
│       ├── package.json
│       └── vite.config.ts            # Port 3002
├── package.json                      # Monorepo root (workspaces)
└── turbo.json                        # Turborepo build orchestration
```

**Structure Decision**: Monorepo with npm workspaces + Turborepo. Chosen because SDK must be consumed by multiple apps locally without publishing. Apps are independent Vite projects to allow isolated runs.

---

## Data Model

### `data/apps.config.json`
```json
{
  "apps": [
    {
      "id": "demo",
      "name": "Demo App",
      "description": "Simple React demo with 3 pages",
      "defaultLanguage": "en-US",
      "pages": [
        { "id": "home", "name": "Home", "previewPort": 3002 },
        { "id": "about", "name": "About", "previewPort": 3002 },
        { "id": "contact", "name": "Contact", "previewPort": 3002 }
      ]
    },
    {
      "id": "bwo-taxforms",
      "name": "BWO Tax Forms",
      "description": "Metadata-driven tax form rendering",
      "defaultLanguage": "en-US",
      "pages": [
        { "id": "personal-info", "name": "Personal Information", "previewPort": 3001 },
        { "id": "income", "name": "Income Details", "previewPort": 3001 },
        { "id": "deductions", "name": "Deductions", "previewPort": 3001 }
      ]
    }
  ]
}
```

### Content File: `data/{appId}-{pageId}-{lang}.json`
```json
{
  "$meta": {
    "appId": "demo",
    "pageId": "home",
    "lang": "en-US",
    "version": 1,
    "updatedAt": "2026-02-27T00:00:00Z"
  },
  "hero-title": "Welcome to ContentFlow",
  "hero-subtitle": "The modern content editing system",
  "cta-button": "Get Started"
}
```

### Form Page Metadata: `apps/bwo-tax-forms/src/metadata/{pageId}.json`
```json
{
  "pageId": "personal-info",
  "title": "Personal Information",
  "titleContentId": "bwo-personal-info-title",
  "layout": "single-column",
  "sections": [
    {
      "id": "section-personal",
      "titleContentId": "bwo-personal-section-title",
      "title": "Your Details",
      "fields": [
        {
          "id": "field-first-name",
          "type": "text",
          "contentId": "bwo-label-first-name",
          "label": "First Name",
          "required": true,
          "validation": { "minLength": 1, "maxLength": 50 }
        },
        {
          "id": "field-last-name",
          "type": "text",
          "contentId": "bwo-label-last-name",
          "label": "Last Name",
          "required": true
        },
        {
          "id": "field-ssn",
          "type": "password",
          "contentId": "bwo-label-ssn",
          "label": "Social Security Number",
          "required": true,
          "validation": { "pattern": "^\\d{3}-\\d{2}-\\d{4}$" }
        },
        {
          "id": "field-dob",
          "type": "date",
          "contentId": "bwo-label-dob",
          "label": "Date of Birth",
          "required": true
        },
        {
          "id": "field-filing-status",
          "type": "select",
          "contentId": "bwo-label-filing-status",
          "label": "Filing Status",
          "required": true,
          "options": [
            { "value": "single", "label": "Single" },
            { "value": "married-joint", "label": "Married Filing Jointly" },
            { "value": "married-separate", "label": "Married Filing Separately" },
            { "value": "head-of-household", "label": "Head of Household" }
          ]
        }
      ]
    }
  ]
}
```

---

## Complexity Tracking

| Decision | Why | Simpler Alternative Rejected Because |
|---|---|---|
| Monorepo with Turborepo | 4 interconnected packages need shared dev tooling | Separate repos require publishing SDK for every change |
| Zustand in SDK (not RTK) | SDK must be framework-agnostic; RTK adds React dependency | RTK violates Library-First principle for SDK |
| Web Component for Angular | Angular can consume WC without adapter | Creating Angular-specific package adds maintenance burden |
| Local file writes via Node API server | Vite can't write to disk from browser | Browser File System API is too limited and requires user gesture |
