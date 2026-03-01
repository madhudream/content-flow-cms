# Implementation Plan: Unified Server & Azure Container Apps Deployment

**Feature ID**: 002  
**Status**: 86% Complete - Azure Deployed, GitHub Actions Pending  
**Created**: 2026-02-28  
**Updated**: 2026-02-28  
**Based on**: [spec.md](spec.md)  
**Deployment URL**: https://contentflow-app.salmonwave-4851ce16.eastus.azurecontainerapps.io

---

## Tech Stack

### Backend
- **Runtime**: Bun (faster than Node.js, native TypeScript support)
- **Server**: Bun's built-in HTTP server (no Express needed)
- **Storage**: 
  - Local: File system (development)
  - Production: Azure Blob Storage (via @azure/storage-blob SDK)
- **Environment Config**: Native .env support

### Frontend (Existing)
- **Build Tool**: Vite (all 4 apps)
- **Apps**: CMS, BWO Tax Forms, Demo (Business Solutions), Customer Portal
- **SDK**: @contentflow/sdk (workspace dependency)

### Infrastructure as Code
- **IaC Tool**: Pulumi with TypeScript
- **Cloud**: Azure Container Apps (serverless containers)
- **Storage**: Azure Blob Storage (Standard LRS)
- **CDN**: Azure CDN (Standard Microsoft)
- **Monitoring**: Azure Application Insights

### CI/CD
- **Pipeline**: GitHub Actions
- **Container Registry**: GitHub Container Registry (ghcr.io)
- **Deployment**: Pulumi CLI via GitHub Actions
- **Secrets**: GitHub Secrets + Azure Key Vault (future)

---

## Architecture

### Local Development

```
http://localhost:8080
├── /cms                           → CMS App (built)
├── /bwo                          → BWO Tax Forms (built)
├── /demo                         → Business Solutions (built)
├── /portal                       → Customer Portal (built)
├── /api/apps                     → Apps config endpoint
├── /api/content/:filename        → Content CRUD
├── /api/content/draft/:filename  → Draft operations
├── /api/content/publish/:filename → Publish workflow
├── /api/images                   → Image upload
└── /health                       → Health check

Storage:
└── apps/server/
    ├── content/     → All JSON files (11 files)
    ├── images/      → Uploaded images
    ├── config/      → apps.config.json
    └── public/      → Built app distributions
        ├── cms/
        ├── bwo/
        ├── demo/
        └── portal/
```

### Production (Azure)

```
Azure Container Apps
├── Ingress: HTTPS (auto-scaling 0-10 replicas)
├── Same URL structure as local
├── Environment: NODE_ENV=production
└── Managed Identity → Azure Blob Storage
    ├── content-draft/    (CMS working copy)
    ├── content-prod/     (Published content)
    └── images/           (Uploaded media)

Azure CDN
├── Origin: Azure Blob Storage
├── Cache: 24h (JSON), 7 days (images)
└── Purge on publish
```

---

## File Structure

```
apps/server/
├── index.ts                      # Bun server entry (replaced)
├── package.json                  # Server dependencies
├── tsconfig.json                 # TypeScript config
├── Dockerfile                    # Multi-stage container build
├── .dockerignore                 # Exclude dev files
├── .env                         # Local environment
├── .env.example                 # Template
├── src/
│   ├── index.ts                 # Main Bun HTTP server
│   ├── config.ts                # Environment-based config
│   ├── routes/
│   │   ├── content.ts           # Content CRUD endpoints
│   │   ├── apps.ts              # Apps config endpoint
│   │   └── images.ts            # Image upload endpoint
│   ├── services/
│   │   ├── localStorage.ts      # File system storage (dev)
│   │   └── azureStorage.ts      # Blob storage (prod) - TODO
│   └── utils/
│       ├── logger.ts            # Logging utility
│       └── validation.ts        # Input validation
├── content/                     # Content JSON files (dev)
├── images/                      # Uploaded images (dev)
├── config/                      # apps.config.json
└── public/                      # Built apps (generated)
    ├── cms/
    ├── bwo/
    ├── demo/
    └── portal/

pulumi/                          # Infrastructure as Code
├── index.ts                     # Azure resources definition
├── Pulumi.yaml                  # Project config
├── Pulumi.dev.yaml              # Dev stack
├── Pulumi.prod.yaml             # Prod stack (future)
├── package.json
└── tsconfig.json

scripts/
├── build-for-deploy.js          # Build all apps + copy to server/public
└── local-dev.ts                 # Unified dev server script (future)

.github/workflows/
└── deploy-production.yml        # CI/CD pipeline - TODO
```

---

## Data Flow

### Content Edit Flow

```
1. Editor opens CMS → http://localhost:8080/cms
2. CMS fetches apps → GET /api/apps
3. CMS fetches content → GET /api/content/demo-home-en-US.json
4. Editor selects app/page → iframe loads /demo?cms-mode=true
5. Editor clicks element → postMessage with contentId
6. Editor changes text → CMS state updates
7. Editor clicks Save → POST /api/content/demo-home-en-US.json
8. Server writes to apps/server/content/ (dev) or Azure Blob (prod)
9. Preview iframe receives CONTENTFLOW_PREVIEW_UPDATE
10. SDK updates DOM instantly
```

### Build & Deploy Flow (Production)

```
1. Developer runs: npm run build:deploy
   ├── Builds @contentflow/sdk
   ├── Builds all 4 apps (Vite production build)
   └── Copies dist/ to apps/server/public/{app}/

2. Server serves from public/ in production mode
   
3. GitHub Actions (future):
   ├── Triggers on push to main
   ├── Runs build:deploy
   ├── Builds Docker image
   ├── Pushes to ghcr.io
   ├── Runs pulumi up
   └── Deploys to Azure Container Apps
```

---

## Configuration

### Environment Variables

```bash
# apps/server/.env

# Environment
NODE_ENV=development              # development | production
PORT=8080                         # Server port

# Storage Type
STORAGE_TYPE=local               # local | azure

# Local Storage (development)
CONTENT_DIR=./content            # Path to content JSON files
IMAGES_DIR=./images              # Path to images
CONFIG_DIR=./config              # Path to apps.config.json

# Azure Storage (production) - TODO
AZURE_STORAGE_ACCOUNT=           # Storage account name
AZURE_TENANT_ID=                 # Managed Identity tenant
AZURE_CLIENT_ID=                 # Managed Identity client

# Azure CDN (production) - TODO
CDN_ENDPOINT=                    # CDN endpoint URL
CDN_PROFILE_NAME=                # CDN profile name
CDN_RESOURCE_GROUP=              # Resource group name
```

### apps.config.json (Relocated)

**New Location**: `apps/server/config/apps.config.json`

```json
{
  "version": 1,
  "apps": [
    {
      "id": "demo",
      "name": "Business Solutions",
      "description": "Enterprise web platform for customer engagement",
      "basePath": "/demo",
      "pages": [
        {
          "id": "home",
          "name": "Home",
          "previewPath": "/"
        },
        {
          "id": "about",
          "name": "About",
          "previewPath": "/about"
        },
        {
          "id": "contact",
          "name": "Contact",
          "previewPath": "/contact"
        }
      ]
    },
    {
      "id": "bwo-taxforms",
      "name": "BWO Tax Forms",
      "basePath": "/bwo",
      "pages": [...]
    },
    {
      "id": "customer-portal",
      "name": "Customer Portal",
      "basePath": "/portal",
      "pages": [...]
    }
  ]
}
```

---

## API Endpoints

### Content API

```typescript
// Get content file
GET /api/content/:filename
Response: { $meta: {...}, "key": "value", ... }

// Save content file (dev: immediate write, prod: draft)
POST /api/content/:filename
Body: { $meta: {...}, "key": "value", ... }
Response: { success: true, version: 2 }

// Draft operations (CMS only) - TODO
GET /api/content/draft/:filename
POST /api/content/draft/:filename
DELETE /api/content/draft/:filename

// Publish workflow (CMS only) - TODO
POST /api/content/publish/:filename
Response: { success: true, cdnPurged: true, url: "..." }
```

### Apps API

```typescript
// Get apps configuration
GET /api/apps
Response: { version: 1, apps: [...] }
```

### Images API

```typescript
// Upload image
POST /api/images
Content-Type: multipart/form-data
Body: { file: File }
Response: { 
  success: true, 
  filename: "image-123456.jpg",
  url: "/images/image-123456.jpg" 
}

// Delete image (future)
DELETE /api/images/:filename
```

### Health Check

```typescript
// Health check
GET /health
Response: {
  status: "healthy",
  environment: "development",
  storageType: "local",
  uptime: 12345,
  timestamp: "2026-02-28T10:30:00Z"
}
```

---

## Build Process

### Build Script

**Location**: `scripts/build-for-deploy.js`

```javascript
// 1. Clean previous builds
fs.removeSync('./apps/server/public');

// 2. Build SDK first (peer dependency)
execSync('npm run build --workspace=packages/sdk');

// 3. Build all apps in parallel
execSync('npm run build --workspace=apps/cms');
execSync('npm run build --workspace=apps/bwo-tax-forms');
execSync('npm run build --workspace=apps/demo');
execSync('npm run build --workspace=apps/customer-portal');

// 4. Copy built files to server/public
fs.copySync('./apps/cms/dist', './apps/server/public/cms');
fs.copySync('./apps/bwo-tax-forms/dist', './apps/server/public/bwo');
fs.copySync('./apps/demo/dist', './apps/server/public/demo');
fs.copySync('./apps/customer-portal/dist', './apps/server/public/portal');
```

### Vite Base Path Configuration

Each app's `vite.config.ts` updated with:

```typescript
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/cms' : '/',
  // ... other config
});
```

**Result**:
- **Development**: Assets load from `/` (Vite dev server)
- **Production**: Assets load from `/cms/`, `/bwo/`, `/demo/`, `/portal/`

---

## Routing Strategy

### BrowserRouter with basename

Each app uses React Router with `basename` prop:

```tsx
// apps/demo/src/App.tsx
<BrowserRouter basename="/demo">
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
    <Route path="/contact" element={<Contact />} />
  </Routes>
</BrowserRouter>
```

**Result**:
- App served at: `http://localhost:8080/demo`
- Home: `/demo/`
- About: `/demo/about`
- Contact: `/demo/contact`

### Server-Side SPA Fallback

```typescript
// apps/server/src/index.ts

// Serve static files
server.route('/demo/*', fileSystemRouter({
  dir: './public/demo',
  style: 'nextjs',
}));

// SPA fallback for client-side routing
server.route('/demo/*', async (req) => {
  const file = Bun.file('./public/demo/index.html');
  return new Response(file);
});
```

---

## Azure Resources ✅ DEPLOYED

### Container Apps

```typescript
// pulumi/index.ts - DEPLOYED
const containerApp = new containerApps.ContainerApp("contentflow", {
  resourceGroupName: resourceGroup.name,
  containerAppName: "contentflow-app",
  managedEnvironmentId: environment.id,
  configuration: {
    ingress: {
      external: true,
      targetPort: 8080,
      transport: "auto",
      allowInsecure: false,
    },
    registries: [{
      server: registry.loginServer,
      identity: managedIdentity.id,
    }],
  },
  template: {
    containers: [{
      name: "contentflow",
      image: pulumi.interpolate`${registry.loginServer}/contentflow:latest`,
      resources: {
        cpu: 0.25,
        memory: "0.5Gi",
      },
    }],
    scale: {
      minReplicas: 0,
      maxReplicas: 3,
    },
  },
  identity: {
    type: "UserAssigned",
    userAssignedIdentities: [managedIdentity.id],
  },
});

// Public URL: https://contentflow-app.salmonwave-4851ce16.eastus.azurecontainerapps.io
```

### Storage Account

```typescript
// ✅ DEPLOYED
const storageAccount = new storage.StorageAccount("contentflowstorage", {
  resourceGroupName: resourceGroup.name,
  accountName: "contentflowstorage",
  location: resourceGroup.location,
  kind: storage.Kind.StorageV2,
  sku: {
    name: storage.SkuName.Standard_LRS,
  },
  enableHttpsTrafficOnly: true,
  allowBlobPublicAccess: true,
});

const container = new storage.BlobContainer("contentflow-content", {
  accountName: storageAccount.name,
  containerName: "contentflow-content",
  resourceGroupName: resourceGroup.name,
  publicAccess: storage.PublicAccess.Blob,
});

// CORS Configuration
const blobService = new storage.BlobServiceProperties("blob-cors", {
  accountName: storageAccount.name,
  resourceGroupName: resourceGroup.name,
  cors: {
    corsRules: [{
      allowedOrigins: ["*"],
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      allowedHeaders: ["*"],
      exposedHeaders: ["*"],
      maxAgeInSeconds: 3600,
    }],
  },
});

// Role Assignment: Blob Data Contributor
const roleAssignment = new authorization.RoleAssignment("storage-role", {
  principalId: managedIdentity.principalId,
  roleDefinitionId: "/providers/Microsoft.Authorization/roleDefinitions/ba92f5b4-2d11-453d-a403-e96b0029c9fe",
  scope: storageAccount.id,
  principalType: "ServicePrincipal",
});
```

### Actual Deployment Details

**Resource Group**: `contentflow-rg` (East US)  
**Storage Account**: `contentflowstorage`  
**Container**: `contentflow-content` (Public Blob Access)  
**Container Registry**: `contentflowcr` (Basic)  
**Container App**: `contentflow-app`
- CPU: 0.25 vCPU
- Memory: 0.5 GiB
- Scale: 0-3 replicas
- URL: https://contentflow-app.salmonwave-4851ce16.eastus.azurecontainerapps.io

**Managed Identity**: Enabled for Blob Data Contributor access  
**CORS**: Configured for browser access (* origins, GET/HEAD/OPTIONS)

---

## Testing Strategy

### Local Testing

```bash
# 1. Build all apps
npm run build:deploy

# 2. Start server
cd apps/server && bun run dev

# 3. Test endpoints
curl http://localhost:8080/health
curl http://localhost:8080/api/apps
curl http://localhost:8080/api/content/demo-home-en-US.json

# 4. Test apps
open http://localhost:8080/cms
open http://localhost:8080/demo
open http://localhost:8080/bwo
open http://localhost:8080/portal
```

### Docker Testing ✅ COMPLETE

```bash
# Build image
docker build --platform linux/amd64 -t contentflow:local -f apps/server/Dockerfile .

# Run container
docker run -p 8080:8080 -e STORAGE_TYPE=local contentflow:local

# Test
curl http://localhost:8080/health
```

### Azure Testing ✅ COMPLETE

```bash
# Deploy (one-command)
npm run deploy

# Get URL
pulumi stack output containerAppUrl

# Test endpoints
curl https://contentflow-app.salmonwave-4851ce16.eastus.azurecontainerapps.io/health
curl https://contentflow-app.salmonwave-4851ce16.eastus.azurecontainerapps.io/api/config
curl https://contentflow-app.salmonwave-4851ce16.eastus.azurecontainerapps.io/cms
curl https://contentflow-app.salmonwave-4851ce16.eastus.azurecontainerapps.io/demo

# Test scale-to-zero
pulumi stack output containerAppUrl --json
# Wait 15 minutes, verify 0 replicas in Azure Portal
# Access URL again, verify cold start (<5s)
```

---

## Cost Estimation (Actual)

### Azure Monthly Cost (Production - ✅ VERIFIED)

| Resource | SKU | Monthly Cost |
|----------|-----|--------------|
| Container Apps | 0.25 vCPU, 0.5GB RAM, scale 0-3 | ~$0.50-2.00 |
| Container Registry | Basic tier | $5.00 |
| Storage Account | Standard LRS, ~5GB | $0.10 |
| Bandwidth | Outbound, minimal usage | $0.05 |
| **Total** | | **~$5.65-7.15** |

**No CDN Cost**: Saved $8-35/month by using direct blob storage with CORS  
**Scale to Zero**: Container Apps bill only when active (0 replicas when idle)  
**Optimized**: Smallest CPU/memory configuration (0.25 vCPU, 0.5GB)

---

## Security Considerations

### Current (Local Development)
- ✅ No hardcoded secrets (all .env)
- ✅ CORS enabled (will restrict in prod)
- ✅ File validation (content, images)
- ✅ Relative URLs (no absolute localhost)

### Future (Production)
- TODO: Azure Managed Identity (no connection strings)
- TODO: HTTPS only (Container Apps enforces)
- TODO: CORS restricted to production domains
- TODO: Azure AD B2C authentication for CMS
- TODO: SAS tokens for image uploads
- TODO: Rate limiting on publish endpoint

---

## Migration Checklist

### Phase 1: Local Development ✅ COMPLETE
- [x] Create apps/server/ directory
- [x] Set up Bun server with TypeScript
- [x] Implement routes (content, apps, images, config)
- [x] Move data/ → apps/server/content/
- [x] Move apps.config.json → apps/server/config/
- [x] Update all API calls to relative URLs
- [x] Create build-for-deploy.js script
- [x] Update Vite configs with base paths
- [x] Add BrowserRouter basename to all apps
- [x] Implement static file serving
- [x] Test all apps locally

### Phase 2: Azure Infrastructure ✅ COMPLETE
- [x] Initialize Pulumi project
- [x] Define Azure Resource Group (contentflow-rg)
- [x] Create Storage Account (contentflowstorage, Standard LRS)
- [x] Create Blob Container (contentflow-content, Public Blob)
- [x] Configure CORS for browser access
- [x] Create Container Registry (contentflowcr, Basic)
- [x] Create Container Apps Environment
- [x] Configure Managed Identity
- [x] Add Role Assignment (Blob Data Contributor)
- [x] Test pulumi preview and pulumi up

### Phase 3: Azure Storage Adapter ✅ COMPLETE
- [x] Implement IContentStorage interface
- [x] Create LocalStorageService class
- [x] Create AzureStorageService class with @azure/storage-blob
- [x] Add StorageFactory for environment-based switching
- [x] Implement image optimization with Sharp (4 sizes)
- [x] Implement images.json catalog management
- [ ] Implement draft operations (deferred)
- [ ] Implement publish workflow (deferred)
- [x] Test with Azure Blob Storage

### Phase 4: Containerization ✅ COMPLETE
- [x] Create Dockerfile (multi-stage: Node build + Bun runtime)
- [x] Add .dockerignore
- [x] Build Docker image locally
- [x] Test container locally
- [x] Push to Azure Container Registry
- [x] Update Pulumi to use ACR image
- [x] Deploy to Azure Container Apps
- [x] Verify scale-to-zero functionality

### Phase 5: CI/CD Pipeline 📋 PENDING
- [ ] Create GitHub Actions workflow (.github/workflows/deploy.yml)
- [ ] Add Azure login step with service principal
- [ ] Implement build step (npm run build:deploy)
- [ ] Add Docker build and push steps
- [ ] Add Pulumi deployment step
- [ ] Configure GitHub Secrets
- [ ] Add smoke tests (health check, app availability)
- [ ] Set up automated content upload to blob storage

### Phase 6: Validation & Optimization ✅ MOSTLY COMPLETE
- [x] End-to-end testing (local and Azure)
- [x] All apps accessible at Azure URL
- [x] Content loads from blob storage
- [x] Image optimization tested
- [x] Cost validation (~$5.50-7/month)
- [x] Scale-to-zero verified
- [x] Deployment documentation created
- [ ] Load testing (1000 users) - deferred
- [ ] Performance optimization - deferred

---

## Next Steps (GitHub Actions CI/CD Only)

1. **Set up GitHub Container Registry**
   - Configure GHCR secrets
   - Update Pulumi to use ghcr.io image
   - Test manual push to GHCR

2. **Create GitHub Actions Workflow** (.github/workflows/deploy.yml)
   - Trigger on push to main
   - Build all apps (npm run build:deploy)
   - Build Docker image
   - Push to ghcr.io
   - Run Pulumi deployment
   - Execute smoke tests

3. **Configure GitHub Secrets**
   - AZURE_CREDENTIALS (service principal)
   - PULUMI_ACCESS_TOKEN
   - AZURE_STORAGE_CONNECTION_STRING (optional, for content sync)

4. **Test Automated Deployment**
   - Make small change and push
   - Verify workflow runs successfully
   - Check Container App updates
   - Validate health endpoint

5. **Optional: Automate Content Sync**
   - Script to upload content/ to blob storage
   - Integrate into workflow or separate job

---
- [x] Image optimization with Sharp (4 sizes + WebP)
- [x] Storage abstraction (Local + Azure)

✅ **Production Deployment**
- [x] Azure infrastructure provisioned via Pulumi
- [x] Container deploys to Azure Container Apps
- [x] Content served from Azure Blob Storage
- [x] CORS enabled for browser access
- [x] Scale to zero verified (0-3 replicas)
- [x] Monthly cost: **$5.50-7** (within budget)
- [x] Managed Identity authentication
- [x] All apps accessible at production URL

📋 **Remaining Work**
- [ ] GitHub Actions CI/CD workflow (Story 6: 5 tasks)
- [ ] Automated deployment on push to main
- [ ] Smoke tests in CI pipeline

---

**Plan Status**: 86% Complete - Azure Deployed, GitHub Actions Pending  
**Last Updated**: 2026-02-28  
**Next Milestone**: GitHub Actions CI/CD (Story 6)
- [ ] Scale to zero verified
- [ ] Monthly cost < $10

---

**Plan Status**: Phase 1 Complete, Phase 2-6 Pending  
**Last Updated**: 2026-02-28  
**Next Milestone**: Azure Storage Service Implementation
