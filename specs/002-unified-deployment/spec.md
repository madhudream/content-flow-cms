# Feature Specification: Unified Server & Azure Container Apps Deployment

**Feature ID**: 002  
**Branch**: `002-unified-deployment`  
**Date**: 2026-02-28  
**Status**: Planning

## Overview

Consolidate 4 separate dev servers (CMS, BWO, Demo, Customer Portal) into a single Node.js Express server that hosts all apps under one domain. Deploy to Azure Container Apps (serverless containers with scale-to-zero) using Pulumi for infrastructure as code. Support both local development (filesystem) and production (Azure Blob Storage) with environment-based storage abstraction.

## Business Goals

### Primary Goals
1. **Cost Optimization**: Scale-to-zero hosting (~$0/month when idle) instead of always-on VMs
2. **Deployment Simplicity**: Single Docker image deploys all apps + APIs
3. **Production-Ready Storage**: Draft/publish workflow with Azure Blob Storage + CDN
4. **Dev/Prod Parity**: Same codebase runs locally and in cloud with env-based config

### Success Metrics
- Monthly hosting cost < $5 for low-traffic loads
- Single `npm run dev` starts all apps locally
- Deploy time < 5 minutes from git push
- Cold start latency < 2 seconds (Container Apps)

## User Stories

### US-001: Unified Local Development
**As a** developer  
**I want** to run all apps with one command  
**So that** I don't need 5 terminal windows for local development

**Acceptance Criteria**:
- Single server runs on `http://localhost:8080`
- All apps accessible: `/cms`, `/bwo`, `/demo`, `/portal`
- Hot reload works for all apps (Vite dev mode)
- Shared API routes at `/api/*`

---

### US-002: Environment-Based Storage
**As a** system administrator  
**I want** storage backend to switch automatically based on environment  
**So that** I use filesystem locally and Blob Storage in production without code changes

**Acceptance Criteria**:
- `IStorageService` interface abstracts storage operations
- Local env uses `LocalStorageService` (reads from `data/`)
- Production env uses `AzureStorageService` (Blob Storage with Managed Identity)
- No connection strings in code (Managed Identity for Azure)

---

### US-003: Draft/Publish Workflow
**As a** content editor  
**I want** to preview changes before publishing  
**So that** I can validate content without affecting live users

**Acceptance Criteria**:
- CMS saves edits to draft container (`content-draft/`)
- Preview button loads content from draft storage
- Publish button copies draft → prod container (`content-prod/`)
- Publish triggers CDN cache purge for updated files

---

### US-004: Containerized Deployment
**As a** DevOps engineer  
**I want** single Docker image containing all apps  
**So that** deployment is atomic and rollback is simple

**Acceptance Criteria**:
- Multi-stage Dockerfile builds SDK + 4 apps + server
- Image size < 150MB (Alpine base)
- All apps bundled in `/app/public/` directory
- Environment variables configure Blob Storage connection

---

### US-005: Infrastructure as Code
**As a** team lead  
**I want** infrastructure defined in TypeScript with Pulumi  
**So that** any developer can provision identical environments

**Acceptance Criteria**:
- `infrastructure/` directory contains Pulumi project
- `pulumi up` provisions: Container App, Storage Account, CDN
- Managed Identity configured for storage access
- Outputs include app URL and CDN endpoint

---

### US-006: Cost-Optimized Azure Deployment
**As a** product owner  
**I want** hosting to scale to zero when idle  
**So that** we minimize costs during low-traffic periods

**Acceptance Criteria**:
- Azure Container Apps scales 0-10 replicas
- Min replicas = 0 (scale to zero enabled)
- Blob Storage uses Standard LRS (cheapest redundancy)
- CDN uses Standard tier (sufficient for low traffic)
- Estimated cost < $5/month for 10k requests

---

## Technical Specification

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Developer Machine (Local Dev)                          │
│                                                          │
│  $ npm run dev                                           │
│  ├── Vite dev servers (hot reload)                      │
│  └── Express server (http://localhost:8080)             │
│      ├── /cms → proxy to :3000                          │
│      ├── /bwo → proxy to :3001                          │
│      ├── /demo → proxy to :3002                         │
│      ├── /portal → proxy to :3003                       │
│      ├── /api/* → Express routes                        │
│      └── /data/* → Static JSON from data/ directory     │
│                                                          │
│  Storage: LocalStorageService (data/ directory)         │
└─────────────────────────────────────────────────────────┘

                         🚀 Deploy
                            ↓

┌─────────────────────────────────────────────────────────┐
│  Azure Container Apps (Production)                      │
│                                                          │
│  Docker Container (Port 8080)                           │
│  ├── /cms → static files from /app/public/cms          │
│  ├── /bwo → static files from /app/public/bwo          │
│  ├── /demo → static files from /app/public/demo        │
│  ├── /portal → static files from /app/public/portal    │
│  ├── /api/* → Express routes                            │
│  └── /data/* → Proxy to CDN                             │
│                                                          │
│  Storage: AzureStorageService (Managed Identity)        │
│           ↓                                              │
│     Azure Blob Storage                                  │
│     ├── content-draft/ (CMS working copy)               │
│     ├── content-prod/ (Published content)               │
│     └── images/ (Uploaded media)                        │
│           ↓                                              │
│     Azure CDN (24h cache)                               │
│     - https://cdn.contentflow.net/data/*.json           │
│     - https://cdn.contentflow.net/images/*              │
└─────────────────────────────────────────────────────────┘
```

### File Structure

```
apps/
└── server/                          # NEW: Consolidated server
    ├── package.json
    ├── tsconfig.json
    ├── Dockerfile                   # Multi-stage build
    ├── .dockerignore
    ├── src/
    │   ├── index.ts                 # Express app entry
    │   ├── config.ts                # Environment config
    │   ├── routes/
    │   │   ├── content.ts           # Content CRUD APIs
    │   │   ├── images.ts            # Image upload
    │   │   └── apps.ts              # Apps config
    │   ├── services/
    │   │   ├── IStorageService.ts   # Storage abstraction
    │   │   ├── LocalStorageService.ts
    │   │   └── AzureStorageService.ts
    │   ├── middleware/
    │   │   ├── cors.ts
    │   │   └── error.ts
    │   └── utils/
    │       └── logger.ts
    └── public/                      # Copied during build
        ├── cms/                     # Built CMS app
        ├── bwo/                     # Built BWO app
        ├── demo/                    # Built demo app
        └── portal/                  # Built portal app

infrastructure/                      # NEW: Pulumi IaC
├── Pulumi.yaml
├── Pulumi.prod.yaml
├── Pulumi.dev.yaml
├── package.json
├── tsconfig.json
└── index.ts                         # Azure resources definition

scripts/
├── build-for-deploy.ts              # Build all apps + copy to server/public
└── local-dev.ts                     # Unified dev server with proxies

.github/
└── workflows/
    └── deploy-production.yml        # CI/CD with Pulumi
```

### Storage Interface

```typescript
// apps/server/src/services/IStorageService.ts
export interface ContentMetadata {
  appId: string;
  pageId: string;
  lang: string;
  version: number;
  updatedAt: string;
  updatedBy?: string;
}

export interface IStorageService {
  // Draft operations (CMS only)
  readDraft(filename: string): Promise<string>;
  writeDraft(filename: string, content: string, metadata?: ContentMetadata): Promise<void>;
  listDrafts(appId?: string): Promise<string[]>;
  
  // Production operations
  readContent(filename: string): Promise<string>;
  publishDraft(filename: string): Promise<void>; // Draft → Prod + CDN purge
  deleteContent(filename: string): Promise<void>;
  listContent(appId?: string): Promise<string[]>;
  
  // Image operations
  uploadImage(buffer: Buffer, filename: string, mimetype: string): Promise<string>;
  deleteImage(filename: string): Promise<void>;
  listImages(): Promise<string[]>;
  
  // Versioning (Azure Blob only)
  listVersions(filename: string): Promise<string[]>;
  restoreVersion(filename: string, versionId: string): Promise<void>;
}
```

### Environment Configuration

```typescript
// apps/server/src/config.ts
export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  storageType: 'local' | 'azure';
  
  // Local storage config
  localContentDir?: string;
  localImagesDir?: string;
  
  // Azure storage config
  azureStorageAccount?: string;
  azureTenantId?: string;
  azureClientId?: string; // Managed Identity
  
  // CDN config
  cdnEndpoint?: string;
  cdnProfileName?: string;
  cdnResourceGroup?: string;
}

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: (process.env.NODE_ENV as any) || 'development',
  storageType: process.env.STORAGE_TYPE === 'azure' ? 'azure' : 'local',
  
  localContentDir: process.env.LOCAL_CONTENT_DIR || path.join(__dirname, '../../../data'),
  localImagesDir: process.env.LOCAL_IMAGES_DIR || path.join(__dirname, '../../../data/images'),
  
  azureStorageAccount: process.env.AZURE_STORAGE_ACCOUNT,
  azureTenantId: process.env.AZURE_TENANT_ID,
  azureClientId: process.env.AZURE_CLIENT_ID,
  
  cdnEndpoint: process.env.CDN_ENDPOINT,
  cdnProfileName: process.env.CDN_PROFILE_NAME,
  cdnResourceGroup: process.env.CDN_RESOURCE_GROUP,
};
```

### Azure Resources (Pulumi)

```typescript
// infrastructure/index.ts
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";
import * as containerApps from "@pulumi/azure-native/app";

const config = new pulumi.Config();
const resourceGroup = new azure.resources.ResourceGroup("contentflow-rg");

// Storage Account
const storageAccount = new azure.storage.StorageAccount("contentflowst", {
  resourceGroupName: resourceGroup.name,
  sku: { name: "Standard_LRS" }, // Cheapest option
  kind: "StorageV2",
  enableHttpsTrafficOnly: true,
});

// Blob Containers
const draftContainer = new azure.storage.BlobContainer("content-draft", {
  accountName: storageAccount.name,
  resourceGroupName: resourceGroup.name,
  publicAccess: "None",
});

const prodContainer = new azure.storage.BlobContainer("content-prod", {
  accountName: storageAccount.name,
  resourceGroupName: resourceGroup.name,
  publicAccess: "Blob", // Public read for CDN
});

const imagesContainer = new azure.storage.BlobContainer("images", {
  accountName: storageAccount.name,
  resourceGroupName: resourceGroup.name,
  publicAccess: "Blob",
});

// Container Apps Environment
const containerAppEnv = new containerApps.ManagedEnvironment("contentflow-env", {
  resourceGroupName: resourceGroup.name,
  location: resourceGroup.location,
});

// Container App (with scale-to-zero)
const containerApp = new containerApps.ContainerApp("contentflow-app", {
  resourceGroupName: resourceGroup.name,
  managedEnvironmentId: containerAppEnv.id,
  configuration: {
    ingress: {
      external: true,
      targetPort: 8080,
      transport: "auto",
    },
    secrets: [],
    registries: [
      {
        server: "ghcr.io",
        username: config.require("github-username"),
        passwordSecretRef: "github-token",
      },
    ],
  },
  template: {
    containers: [
      {
        name: "contentflow",
        image: "ghcr.io/yourorg/contentflow:latest",
        resources: {
          cpu: 0.5,
          memory: "1.0Gi",
        },
        env: [
          { name: "NODE_ENV", value: "production" },
          { name: "STORAGE_TYPE", value: "azure" },
          { name: "AZURE_STORAGE_ACCOUNT", value: storageAccount.name },
        ],
      },
    ],
    scale: {
      minReplicas: 0, // Scale to zero!
      maxReplicas: 10,
      rules: [
        {
          name: "http-rule",
          http: { metadata: { concurrentRequests: "100" } },
        },
      ],
    },
  },
  identity: {
    type: "SystemAssigned", // Managed Identity for Blob access
  },
});

// CDN Profile
const cdnProfile = new azure.cdn.Profile("contentflow-cdn", {
  resourceGroupName: resourceGroup.name,
  sku: { name: "Standard_Microsoft" },
});

const cdnEndpoint = new azure.cdn.Endpoint("contentflow-cdn-endpoint", {
  resourceGroupName: resourceGroup.name,
  profileName: cdnProfile.name,
  isHttpAllowed: false,
  isHttpsAllowed: true,
  originHostHeader: pulumi.interpolate`${storageAccount.name}.blob.core.windows.net`,
  origins: [
    {
      name: "blob-storage",
      hostName: pulumi.interpolate`${storageAccount.name}.blob.core.windows.net`,
    },
  ],
});

export const appUrl = pulumi.interpolate`https://${containerApp.configuration.ingress.fqdn}`;
export const cdnUrl = pulumi.interpolate`https://${cdnEndpoint.hostName}`;
```

## Non-Functional Requirements

### Performance
- Cold start (Container Apps): < 2 seconds
- API response time (content read): < 200ms
- Publish workflow (draft → prod): < 3 seconds
- CDN cache hit rate: > 90%

### Security
- Managed Identity for all Azure service access (no connection strings)
- HTTPS only (enforced by Container Apps)
- CORS configured for specific origins only
- Draft content accessible only via authenticated API

### Scalability
- Auto-scale 0-10 replicas based on HTTP concurrency
- Blob Storage handles unlimited files
- CDN serves content globally

### Cost
- Target: < $5/month for 10k requests
- Container Apps: ~$0 when idle (scale to zero)
- Storage: ~$0.01/GB/month (Standard LRS)
- CDN: ~$0.08/GB egress (first 10GB free)

## Out of Scope (Future Enhancements)
- Authentication (Azure AD B2C)
- Real-time collaboration
- Content scheduling
- A/B testing
- Multi-region deployment
- Custom domains with SSL

## Testing Strategy

### Unit Tests
- Storage service implementations (LocalStorageService, AzureStorageService)
- API route handlers
- Configuration validation

### Integration Tests
- Local server with filesystem storage
- Docker container build and run
- Pulumi stack preview (infrastructure validation)

### E2E Tests
- Edit content in CMS → save to draft
- Publish draft → verify in consuming app
- Image upload → verify CDN URL
- Scale-to-zero behavior (wait 5 min, verify cold start)

## Rollout Plan

### Phase 1: Local Development (Week 1)
- Create unified server structure
- Implement LocalStorageService
- Migrate existing CMS server routes
- Test all apps running on localhost:8080

### Phase 2: Storage Abstraction (Week 1)
- Implement IStorageService interface
- Add AzureStorageService with Managed Identity
- Create draft/publish workflow
- Update CMS UI for publish button

### Phase 3: Containerization (Week 2)
- Create Dockerfile with multi-stage build
- Build and test locally with Docker
- Set up GitHub Container Registry

### Phase 4: Azure Infrastructure (Week 2)
- Initialize Pulumi project
- Define Azure resources (Container Apps, Storage, CDN)
- Deploy to dev environment
- Test with real traffic

### Phase 5: CI/CD (Week 3)
- Create GitHub Actions workflow
- Implement automatic deployments on main branch
- Add CDN purge on publish
- Smoke tests post-deployment

## Success Criteria
✅ All apps accessible via single URL structure  
✅ Draft/publish workflow functional  
✅ Local dev uses filesystem, prod uses Blob Storage  
✅ Infrastructure provisioned via `pulumi up`  
✅ Monthly cost < $5 for low traffic  
✅ Deploy time < 5 minutes  
✅ Zero code changes between local and production  

## Questions & Decisions

### Q1: Docker image registry?
**Decision**: GitHub Container Registry (ghcr.io) - free for public repos

### Q2: CDN caching strategy?
**Decision**: 24 hours for JSON, 7 days for images, purge on publish

### Q3: Blob Storage versioning?
**Decision**: Enable versioning, keep 30 versions per file

### Q4: Container Apps vs App Service?
**Decision**: Container Apps for scale-to-zero (90% cost savings)

### Q5: Local dev workflow?
**Decision**: Vite dev servers for hot reload, server proxies requests to them
