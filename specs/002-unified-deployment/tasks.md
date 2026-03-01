# Implementation Tasks: Unified Server & Azure Deployment

**Feature**: 002-unified-deployment  
**Branch**: `002-unified-deployment`  
**Spec**: [spec.md](spec.md)  
**Date**: 2026-02-28

## Task Organization

Tasks are organized into **Stories** (vertical slices of user value) with dependencies tracked. Each task has:
- **ID**: Unique identifier (S#.T#)
- **Status**: `[ ]` Not started, `[⋯]` In progress, `[X]` Complete
- **Effort**: `S` (Small: <2h), `M` (Medium: 2-4h), `L` (Large: 4-8h)
- **Dependencies**: Must complete before starting this task
- **[P]**: Can be parallelized with other [P] tasks in same phase

---

## 📦 Story 1: Create Unified Server Structure

**Goal**: Set up consolidated Express server that will host all apps and APIs

### Phase 1.1: Server Setup

- [ ] **S1.T1** - Create `apps/server/` directory structure `[M]`
  - Create package.json with Express, TypeScript, necessary deps
  - Set up tsconfig.json with ES modules support
  - Create src/ folder structure (routes/, services/, middleware/, utils/)
  - Add dev/build/start scripts
  - **Acceptance**: `npm install` succeeds in apps/server/

- [ ] **S1.T2** - Implement basic Express server `[M]`
  - Create `src/index.ts` with Express app
  - Add CORS middleware
  - Add JSON body parser
  - Add error handling middleware
  - Add health check endpoint `/health`
  - **Acceptance**: Server starts on port 8080, `/health` returns 200

- [ ] **S1.T3** [P] - Create config system `[S]`
  - Create `src/config.ts` with environment-based configuration
  - Define ServerConfig interface
  - Load env variables with defaults
  - Validate required config on startup
  - **Acceptance**: Config loads correctly for dev and prod envs

- [ ] **S1.T4** [P] - Add logger utility `[S]`
  - Create `src/utils/logger.ts` with Winston or Pino
  - Add log levels (debug, info, warn, error)
  - Format logs for production (JSON) and dev (pretty)
  - **Acceptance**: Logger works in both environments

### Phase 1.2: Static Hosting

**Dependencies**: S1.T2

- [ ] **S1.T5** - Implement static file serving for apps `[M]`
  - Add `express.static` middleware for `/cms`, `/bwo`, `/demo`, `/portal`
  - Serve from `public/{app-name}/` directories
  - Add SPA fallback for each route (serve index.html on 404)
  - Add root redirect: `/` → `/cms`
  - **Acceptance**: Can serve static HTML from public/ folders

- [ ] **S1.T6** - Create build script to copy built apps `[M]`
  - Create `scripts/build-for-deploy.ts`
  - Build SDK first: `npm run build --workspace=packages/sdk`
  - Build all apps: `npm run build -ws --if-present`
  - Copy dist/ folders to server/public/
  - Copy apps.config.json to server/config/
  - **Acceptance**: `npm run build:deploy` creates deployable structure

### Phase 1.3: Development Workflow

**Dependencies**: S1.T2

- [ ] **S1.T7** - Create dev proxy server `[L]`
  - Create `scripts/local-dev.ts`
  - Use http-proxy-middleware to proxy `/cms` → `localhost:3000`
  - Proxy `/bwo` → `localhost:3001`, etc.
  - Serve API routes directly from Express
  - Handle CORS for dev mode
  - **Acceptance**: `npm run dev` starts all apps with hot reload

- [ ] **S1.T8** - Update root package.json scripts `[S]`
  - Add `dev`: Run local-dev.ts + all Vite dev servers concurrently
  - Add `build:all`: Build SDK + all apps sequentially
  - Add `build:deploy`: Run build-for-deploy.ts
  - Add `dev:server`: Run apps/server in dev mode
  - **Acceptance**: Scripts work as documented

---

## 💾 Story 2: Storage Abstraction Layer

**Goal**: Abstract storage operations for local/Azure switching

### Phase 2.1: Interface Definition

- [ ] **S2.T1** - Define IStorageService interface `[M]`
  - Create `apps/server/src/services/IStorageService.ts`
  - Define methods: readDraft, writeDraft, publishDraft, readContent, etc.
  - Define ContentMetadata type
  - Add JSDoc comments for each method
  - **Acceptance**: Interface compiles, no errors

### Phase 2.2: Local Implementation

**Dependencies**: S2.T1

- [ ] **S2.T2** - Implement LocalStorageService `[L]`
  - Create `apps/server/src/services/LocalStorageService.ts`
  - Implement filesystem operations using `fs/promises`
  - Draft files: `data/.draft/{filename}`
  - Prod files: `data/{filename}`
  - Images: `data/images/{filename}`
  - Add error handling for ENOENT
  - **Acceptance**: All interface methods work with local files

- [ ] **S2.T3** [P] - Add unit tests for LocalStorageService `[M]`
  - Test read/write draft operations
  - Test publishDraft (copy draft → prod)
  - Test image upload/delete
  - Test listContent filtering by appId
  - Mock filesystem with temp directories
  - **Acceptance**: 100% code coverage

### Phase 2.3: Azure Implementation

**Dependencies**: S2.T1

- [ ] **S2.T4** - Implement AzureStorageService `[L]`
  - Create `apps/server/src/services/AzureStorageService.ts`
  - Use `@azure/storage-blob` SDK
  - Initialize with Managed Identity (DefaultAzureCredential)
  - Implement container operations (content-draft, content-prod, images)
  - Add blob metadata for versioning
  - **Acceptance**: Methods compile, ready for integration test

- [ ] **S2.T5** [P] - Add CDN purge integration `[M]`
  - Create `apps/server/src/services/CdnService.ts`
  - Use `@azure/arm-cdn` SDK for purge operations
  - Implement purge method with retry logic
  - Add to publishDraft workflow (after blob copy)
  - **Acceptance**: Purge is called on publish (testable with mock)

- [ ] **S2.T6** - Create storage factory `[S]`
  - Create `apps/server/src/services/storageFactory.ts`
  - Return LocalStorageService if `config.storageType === 'local'`
  - Return AzureStorageService if `config.storageType === 'azure'`
  - Throw error if invalid storage type
  - **Acceptance**: Factory returns correct implementation

---

## 🔌 Story 3: Migrate CMS Server APIs

**Goal**: Move existing CMS server routes to unified server

### Phase 3.1: Content Routes

**Dependencies**: S2.T6

- [ ] **S3.T1** - Create content routes `[M]`
  - Create `apps/server/src/routes/content.ts`
  - Migrate GET `/api/content/:filename` (read content)
  - Add GET `/api/content/draft/:filename` (read draft)
  - Add POST `/api/content/draft/:filename` (save draft)
  - Add POST `/api/content/publish/:filename` (publish)
  - Use storageService from factory
  - **Acceptance**: All endpoints return correct responses

- [ ] **S3.T2** [P] - Create apps config route `[S]`
  - Create `apps/server/src/routes/apps.ts`
  - Add GET `/api/apps` (return apps.config.json)
  - Read from config/ directory
  - Cache in memory, reload on file change
  - **Acceptance**: CMS receives apps config correctly

### Phase 3.2: Image Routes

**Dependencies**: S2.T6

- [ ] **S3.T3** - Create image upload route `[M]`
  - Create `apps/server/src/routes/images.ts`
  - Add POST `/api/images` with multer middleware
  - Generate unique filename: `{appId}-{contentId}-{timestamp}.{ext}`
  - Save via storageService.uploadImage()
  - Return CDN URL (prod) or local URL (dev)
  - **Acceptance**: Image upload works in both dev and prod

- [ ] **S3.T4** [P] - Add image serving `[S]`
  - Add GET `/data/images/:filename` route
  - In dev: serve from local filesystem
  - In prod: redirect to CDN URL
  - **Acceptance**: Images load in CMS preview

### Phase 3.3: Integration

**Dependencies**: S1.T5, S3.T1, S3.T3

- [ ] **S3.T5** - Wire up routes to server `[S]`
  - Import all route modules in `src/index.ts`
  - Mount: `app.use('/api/content', contentRoutes)`
  - Mount: `app.use('/api/apps', appsRoutes)`
  - Mount: `app.use('/api/images', imagesRoutes)`
  - **Acceptance**: All API routes accessible

- [ ] **S3.T6** - Remove old CMS server directory `[S]`
  - Delete `apps/cms/server/` directory
  - Update cms package.json (remove server scripts)
  - Update root package.json to not start old CMS server
  - **Acceptance**: CMS app no longer has embedded server

---

## ⚙️ Story 4: Build System Updates

**Goal**: Configure build process for unified deployment

### Phase 4.1: Vite Configuration

- [ ] **S4.T1** - Update Vite base paths `[M]`
  - Update `apps/cms/vite.config.ts`: set `base: '/cms'`
  - Update `apps/bwo-tax-forms/vite.config.ts`: set `base: '/bwo'`
  - Update `apps/demo/vite.config.ts`: set `base: '/demo'`
  - Update `apps/customer-portal/vite.config.ts`: set `base: '/portal'`
  - Test production builds work with base path
  - **Acceptance**: Built apps load assets correctly under subpaths

- [ ] **S4.T2** - Update SDK initialization URLs `[M]`
  - Update each app's `main.tsx` to use relative storage URL
  - Dev: `storageUrl: '/data'`
  - Prod: `storageUrl: import.meta.env.VITE_CDN_URL || '/data'`
  - Add `.env.production` files with CDN URL placeholder
  - **Acceptance**: Apps fetch content from correct URL

### Phase 4.2: Docker Setup

**Dependencies**: S4.T1

- [ ] **S4.T3** - Create Dockerfile `[L]`
  - Create `apps/server/Dockerfile` with multi-stage build
  - Stage 1: Build SDK + all apps (Node 20 Alpine)
  - Stage 2: Run build-for-deploy script
  - Stage 3: Production image (copy server + public/, npm ci --production)
  - Optimize layers for caching
  - **Acceptance**: `docker build` succeeds, image < 150MB

- [ ] **S4.T4** [P] - Create .dockerignore `[S]`
  - Exclude node_modules, .git, *.log, .env*
  - Exclude tests, .vscode, .github
  - **Acceptance**: Build excludes unnecessary files

- [ ] **S4.T5** - Test Docker locally `[M]`
  - Build image: `docker build -t contentflow:local .`
  - Run container: `docker run -p 8080:8080 contentflow:local`
  - Test all apps accessible
  - Test API routes work
  - **Acceptance**: Container runs successfully, all apps work

---

## ☁️ Story 5: Azure Infrastructure (Pulumi)

**Goal**: Define infrastructure as code

### Phase 5.1: Pulumi Setup

- [ ] **S5.T1** - Initialize Pulumi project `[M]`
  - Create `infrastructure/` directory
  - Run `pulumi new azure-typescript`
  - Create stacks: `pulumi stack init dev`, `pulumi stack init prod`
  - Add Azure provider configuration
  - **Acceptance**: `pulumi preview` runs without errors

- [ ] **S5.T2** [P] - Configure Pulumi for monorepo `[S]`
  - Update root package.json with infrastructure workspace
  - Add scripts: `deploy:dev`, `deploy:prod`
  - Install Azure SDKs: `@pulumi/azure-native`, `@pulumi/docker`
  - **Acceptance**: Scripts run Pulumi from root directory

### Phase 5.2: Storage Resources

**Dependencies**: S5.T1

- [ ] **S5.T3** - Define Storage Account `[M]`
  - Create Resource Group
  - Create Storage Account (Standard LRS)
  - Enable versioning, soft delete (30 days)
  - Create containers: content-draft, content-prod, images
  - Set public access levels (none for draft, blob for prod/images)
  - **Acceptance**: `pulumi preview` shows storage resources

- [ ] **S5.T4** [P] - Define CDN Profile `[M]`
  - Create CDN Profile (Standard Microsoft)
  - Create Endpoint pointing to Storage Account
  - Set caching rules: 24h for *.json, 7d for images
  - Enable compression (gzip, brotli)
  - **Acceptance**: CDN endpoint appears in preview

### Phase 5.3: Container Apps

**Dependencies**: S5.T3

- [ ] **S5.T5** - Define Container Apps Environment `[M]`
  - Create Managed Environment for Container Apps
  - Configure logging to Log Analytics (optional)
  - Set zone redundancy (if needed)
  - **Acceptance**: Environment resource in preview

- [ ] **S5.T6** - Define Container App `[L]`
  - Create ContainerApp resource
  - Set image: `ghcr.io/{username}/contentflow:latest`
  - Configure ingress: external, port 8080
  - Set min replicas: 0 (scale to zero)
  - Set max replicas: 10
  - Add HTTP scaling rule (concurrency: 100)
  - Configure environment variables (NODE_ENV, STORAGE_TYPE, etc.)
  - Enable System-Assigned Managed Identity
  - **Acceptance**: Container App in preview, ingress configured

- [ ] **S5.T7** - Assign Storage Blob Data Contributor role `[S]`
  - Use `azure.authorization.RoleAssignment`
  - Assign Container App Managed Identity to Storage Account
  - Role: Storage Blob Data Contributor (read/write/delete)
  - **Acceptance**: Role assignment in preview

- [ ] **S5.T8** - Export outputs `[S]`
  - Export Container App URL (ingress FQDN)
  - Export Storage Account name
  - Export CDN endpoint URL
  - **Acceptance**: `pulumi up` shows outputs after deployment

---

## 🚀 Story 6: CI/CD Pipeline

**Goal**: Automate build and deployment

### Phase 6.1: GitHub Container Registry

- [ ] **S6.T1** - Set up GitHub Container Registry `[S]`
  - Create personal access token with `write:packages` scope
  - Add as GitHub secret: `CR_PAT`
  - Test manual push: `docker push ghcr.io/{username}/contentflow:test`
  - **Acceptance**: Image appears in GitHub Packages

### Phase 6.2: GitHub Actions Workflow

**Dependencies**: S6.T1

- [ ] **S6.T2** - Create build workflow `[L]`
  - Create `.github/workflows/deploy.yml`
  - Trigger on: push to main, manual dispatch
  - Checkout code, setup Node 20
  - Build all apps: `npm run build:all`
  - Build Docker image with GHCR
  - Tag with commit SHA and `latest`
  - Push to GHCR
  - **Acceptance**: Workflow builds and pushes image

- [ ] **S6.T3** - Add Pulumi deployment step `[M]`
  - Install Pulumi CLI in workflow
  - Azure login with federated credentials (no secrets!)
  - Run `pulumi up --stack prod --yes`
  - Set Container App image to newly built SHA
  - Wait for deployment to complete
  - **Acceptance**: Workflow deploys to Azure

- [ ] **S6.T4** [P] - Add smoke tests `[S]`
  - After deployment, curl health check endpoint
  - Verify response status 200
  - Verify each app path returns 200
  - **Acceptance**: Tests run and pass in workflow

### Phase 6.3: Content Publishing

**Dependencies**: S5.T8

- [ ] **S6.T5** - Upload initial content to Blob Storage `[M]`
  - Add workflow step to upload `data/*.json` to content-prod container
  - Use Azure CLI: `az storage blob upload-batch`
  - Skip upload of .draft/ subdirectory
  - **Acceptance**: Content files appear in Blob Storage

---

## ✅ Story 7: Testing & Validation

**Goal**: Ensure everything works end-to-end

### Phase 7.1: Local Testing

**Dependencies**: S1.T8, S3.T5

- [ ] **S7.T1** - Test local unified server `[M]`
  - Run `npm run dev`
  - Verify all apps load: /cms, /bwo, /demo, /portal
  - Verify hot reload works in dev mode
  - Test API routes with Postman/curl
  - **Acceptance**: All apps work locally

- [ ] **S7.T2** - Test local storage operations `[M]`
  - Edit content in CMS, save to draft
  - Verify draft file created in `data/.draft/`
  - Click publish, verify file copied to `data/`
  - Refresh consuming app, verify content updated
  - **Acceptance**: Full draft → publish workflow works locally

### Phase 7.2: Docker Testing

**Dependencies**: S4.T5

- [ ] **S7.T3** - Test Docker with Azure Storage mock `[M]`
  - Run Azurite (Azure Storage emulator)
  - Set env vars to point to Azurite
  - Start Docker container
  - Test draft/publish workflow
  - **Acceptance**: Container works with blob storage

### Phase 7.3: Azure Testing

**Dependencies**: S6.T3

- [ ] **S7.T4** - Deploy to dev environment `[L]`
  - Run `pulumi up --stack dev`
  - Verify all resources created
  - Test Container App URL
  - Test CMS edit → publish → demo app flow
  - **Acceptance**: Full workflow works in Azure

- [ ] **S7.T5** [P] - Performance testing `[M]`
  - Load test with 100 concurrent users (Artillery/k6)
  - Verify auto-scaling works (watch replicas)
  - Test cold start latency (<2s)
  - Verify CDN cache hit rate (>90%)
  - **Acceptance**: Performance meets requirements

- [ ] **S7.T6** [P] - Cost validation `[M]`
  - Run for 1 week with minimal traffic
  - Check Azure Cost Management
  - Verify scale-to-zero works (0 replicas during night)
  - Calculate monthly projection
  - **Acceptance**: Monthly cost < $5

---

## 📚 Story 8: Documentation

**Goal**: Document setup and operations

- [ ] **S8.T1** - Update README.md `[S]`
  - Document new unified dev workflow
  - Add Docker build/run instructions
  - Add deployment instructions
  - Update architecture diagram
  - **Acceptance**: New developers can follow README

- [ ] **S8.T2** [P] - Create operations guide `[S]`
  - Document how to publish content
  - Rollback procedure
  - Viewing logs in Azure
  - Scaling configuration
  - **Acceptance**: Ops team can maintain system

- [ ] **S8.T3** [P] - Update .github/copilot-instructions.md `[S]`
  - Add unified server patterns
  - Add Azure deployment context
  - Add storage abstraction patterns
  - **Acceptance**: Copilot has updated context

---

## Execution Plan

### Week 1: Foundation (Stories 1-2)
**Day 1-2**: S1.T1 → S1.T2 → S1.T3+T4 (parallel) → S1.T5 → S1.T6  
**Day 3-4**: S2.T1 → S2.T2 → S2.T3 (parallel) → S2.T4 → S2.T5 (parallel) → S2.T6  
**Day 5**: S1.T7 → S1.T8 → S7.T1 (test)

### Week 2: Migration & Build (Stories 3-4)
**Day 1-2**: S3.T1 → S3.T2 (parallel) → S3.T3 → S3.T4 (parallel) → S3.T5 → S3.T6  
**Day 3-4**: S4.T1 → S4.T2 → S4.T3 → S4.T4 (parallel) → S4.T5  
**Day 5**: S7.T2 → S7.T3 (test)

### Week 3: Azure & Deployment (Stories 5-7)
**Day 1-2**: S5.T1 → S5.T2 (parallel) → S5.T3 → S5.T4 (parallel) → S5.T5 → S5.T6 → S5.T7 → S5.T8  
**Day 3-4**: S6.T1 → S6.T2 → S6.T3 → S6.T4 (parallel) → S6.T5  
**Day 5**: S7.T4 → S7.T5+T6 (parallel) → S8.T1 → S8.T2+T3 (parallel)

**Total Effort**: ~18-20 days  
**With parallelization**: ~15 days  
**With 2 developers**: ~8-10 days

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Docker image too large | Deploy time >5min | Multi-stage build, Alpine base, .dockerignore |
| Cold start >2s | Poor UX | Pre-warm with health check ping, optimize bundle |
| Azure costs exceed budget | Over budget | Set billing alerts, auto-scale limits, monitor daily |
| Managed Identity auth fails | Can't access storage | Test with Azure CLI, add fallback to connection string (dev only) |
| CDN purge delayed | Stale content | Show "publishing" spinner, implement cache headers |

---

## Definition of Done

✅ All tasks marked `[X]`  
✅ All unit tests pass  
✅ All E2E tests pass  
✅ Docker image builds successfully  
✅ Azure infrastructure deploys via Pulumi  
✅ Draft → Publish → CDN flow works  
✅ Monthly cost < $5 for low traffic  
✅ Documentation updated  
✅ Code review approved  
✅ Deployed to production  

---

## Notes

- Use **feature flags** if you want to deploy incrementally (e.g., `ENABLE_AZURE_STORAGE=false` to test deployment before switching storage)
- Keep old CMS server code in git history for reference during migration
- Test rollback procedure before going live
- Monitor Container Apps scaling metrics for first week
