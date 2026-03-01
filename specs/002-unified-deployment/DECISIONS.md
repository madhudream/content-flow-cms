# Architecture Decisions - Unified Deployment

**Date**: 2026-02-28  
**Feature**: 002-unified-deployment

## Key Decisions Summary

### ✅ 1. Keep Multiple Content Files (Not Single JSON)

**Rationale**:
- CDN can cache each page independently (only purge what changed)
- Better Git diffs (one page = one file change)
- Smaller payloads for CDN egress
- Blob Storage pricing is per-operation, not per-file
- Future-proof for lazy loading

**Structure**: `{appId}-{pageId}-{lang}.json` (current)

---

### ✅ 2. Use Pulumi (TypeScript) for Infrastructure

**Why not Terraform**:
- Your entire stack is TypeScript (SDK, apps, server)
- Type safety: IDE autocomplete catches errors at compile-time
- Reusable functions: Write helper functions, loops, conditionals
- Faster learning curve: No new DSL (HCL) to learn
- Better testing: Unit test infrastructure with Vitest
- NPM ecosystem: Use existing libraries

**Terraform would require**:
- Learning HCL (HashiCorp Configuration Language)
- Separate state management
- External modules for complex logic

**Decision**: Pulumi with TypeScript - consistency wins

---

### ✅ 3. GitHub Actions + Pulumi (Not Just Pulumi)

**Your Question**: "Why separate GitHub Actions, can we use Pulumi?"

**Answer**: They serve different purposes:

| Tool | Purpose | Example |
|------|---------|---------|
| **GitHub Actions** | CI/CD Pipeline | Build code, run tests, deploy |
| **Pulumi** | Infrastructure as Code | Provision Azure resources |

**How they work together**:
```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker image           # ← GitHub Actions
        run: docker build -t app:latest .
      
      - name: Deploy infrastructure        # ← Calls Pulumi
        run: pulumi up --yes --stack prod
```

**Can you use ONLY Pulumi?**

Yes, Pulumi has "Pulumi Deployments" (hosted service) that can:
- Trigger deploys via GitHub webhooks
- Run `pulumi up` automatically

**BUT we recommend GitHub Actions because**:
✅ **Free tier is generous** (2,000 minutes/month for public repos)  
✅ **Better visibility** - See build logs, test results in GitHub UI  
✅ **Audit trail** - Who deployed what, when  
✅ **Flexible workflows** - Run tests before deploy, deploy to staging first  
✅ **Industry standard** - Most teams use GitHub Actions + IaC tool  

**Cost comparison**:
- GitHub Actions: Free (for public repos) or $0.008/minute
- Pulumi Deployments: Requires paid plan ($89/month Team tier)

**Decision**: Use GitHub Actions (free) to call Pulumi (free for individuals)

---

### ✅ 4. Azure Container Apps (Super Cheap Like Cloud Run)

**GCP Cloud Run vs Azure Options**:

| Service | Min Cost/Month | Scale to Zero | Pay-per-use |
|---------|---------------|---------------|-------------|
| **GCP Cloud Run** | ~$0 | ✅ Yes | ✅ Yes |
| **Azure Container Apps** | ~$0 | ✅ Yes | ✅ Yes |
| Azure App Service B1 | $13.14 | ❌ No | ❌ Fixed |
| Azure Functions | ~$0 | ✅ Yes | ⚠️ Limited |

**Azure Container Apps IS the Cloud Run equivalent**:
- Serverless containers (no VMs to manage)
- Scales to 0 replicas when idle = $0
- Per-second billing when running
- Supports any language (Node.js, Docker, etc.)
- Managed ingress with SSL

**Pricing example** (Azure Container Apps):
```
10,000 requests/month, 500ms avg latency:
- Compute time: ~1.4 hours active
- 0.5 vCPU × 1.4h × $0.043/vCPU-hour = $0.03
- 1 GB RAM × 1.4h × $0.0048/GB-hour = $0.007
- Total: ~$0.04/month (yes, 4 cents!)

Rest of month: 0 replicas = $0
```

**Why Container Apps over App Service**:
- App Service B1 = $13.14/month even with zero traffic (always running)
- Container Apps = $0 when idle (scales to zero)
- 90%+ cost savings for low-traffic apps

**Decision**: Azure Container Apps for ultra-low cost

---

### ✅ 5. Blob Storage as "Database" for Versioning

**Your Question**: "If you want versioning, let's use blob storage as DB"

**Answer**: Perfect choice! Azure Blob Storage has built-in versioning:

```typescript
// Enable versioning
const storageAccount = new azure.storage.StorageAccount("st", {
  // ...
});

// Versioning is automatic - every PUT creates a new version
await blobClient.upload(content, content.length);

// List all versions
const versions = await containerClient
  .listBlobsFlat({ includeVersions: true })
  .byPage()
  .next();

// Restore old version
await blobClient.beginCopyFromURL(
  versionUrl,
  { blobVersionId: "2026-02-28T10:30:00Z" }
);
```

**Features**:
- ✅ Automatic versioning (up to 100 versions per blob)
- ✅ Soft delete (30-day recovery)
- ✅ Change feed (audit log of all changes)
- ✅ Point-in-time restore
- ✅ **Cost**: ~$0.01/GB/month (extremely cheap)

**vs Real Database (Cosmos DB, PostgreSQL)**:
- Database: $25+/month fixed cost
- Blob Storage: $0.01/GB/month variable cost
- For content files: Blob Storage is 2500x cheaper

**Decision**: Use Blob Storage versioning as content "database" - no real DB needed

---

### ✅ 6. URL Structure: Single Domain with Paths

**Structure**:
```
https://contentflow.yourdomain.com/
├── /cms          → CMS Portal
├── /bwo          → BWO Tax Forms
├── /demo         → Demo App
├── /portal       → Customer Portal
└── /api/*        → All APIs
```

**Why not subdomains** (cms.contentflow.com, bwo.contentflow.com)?
- ❌ Requires multiple SSL certificates
- ❌ CORS issues between subdomains
- ❌ More complex CDN configuration
- ❌ Higher Azure Front Door cost

**Path-based routing**:
- ✅ Single SSL certificate
- ✅ No CORS issues (same origin)
- ✅ Simpler deployment
- ✅ Lower cost

**Decision**: Path-based routing on single domain

---

## Summary: Your Stack

```
┌─────────────────────────────────────────┐
│  GitHub (Source Control + CI/CD)        │
│  - Push to main branch                  │
│  - GitHub Actions runs workflow         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  GitHub Actions (CI/CD Pipeline)        │
│  1. npm run build:all (build SDK+apps) │
│  2. docker build (create container)     │
│  3. docker push ghcr.io                 │
│  4. pulumi up (deploy infra)            │← Calls Pulumi here
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Pulumi (Infrastructure as Code)        │
│  - Container Apps (serverless)          │
│  - Blob Storage (content + versions)    │
│  - CDN (global distribution)            │
│  - Managed Identity (no secrets)        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Azure Container Apps (Running App)     │
│  - Scales 0-10 replicas                 │
│  - ~$0/month when idle                  │
│  - Docker container from GHCR           │
│  - Serves 4 apps + APIs                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Azure Blob Storage ("Database")        │
│  - content-draft/ (CMS edits)           │
│  - content-prod/ (published)            │
│  - images/ (uploaded media)             │
│  - Versioning enabled                   │
│  - ~$0.01/GB/month                      │
└─────────────────────────────────────────┘
```

---

## Monthly Cost Estimate

**Scenario**: Low traffic (10k requests/month)

| Service | Cost |
|---------|------|
| Container Apps | $0.04 |
| Blob Storage (5 GB) | $0.05 |
| CDN (10 GB egress) | $0.80 |
| **Total** | **$0.89/month** |

**Scenario**: Medium traffic (100k requests/month)

| Service | Cost |
|---------|------|
| Container Apps | $0.40 |
| Blob Storage (5 GB) | $0.05 |
| CDN (50 GB egress) | $4.00 |
| **Total** | **$4.45/month** |

**Comparison**:
- Your current setup: $0 (local dev only)
- Azure App Service: ~$13/month (always-on)
- **Container Apps**: ~$0.89-5/month (scales to zero)
- GCP Cloud Run: ~$0.50-4/month (similar)

---

## Next Steps

Ready to start implementation! We'll begin with:

**Week 1: Stories 1-2**
1. Create unified server structure (`apps/server/`)
2. Implement storage abstraction (local + Azure)
3. Test locally with `npm run dev`

**Week 2: Stories 3-4**
1. Migrate CMS server routes
2. Build Docker image
3. Test container locally

**Week 3: Stories 5-7**
1. Set up Pulumi infrastructure
2. Create GitHub Actions workflow
3. Deploy to Azure and validate

Let me know when you're ready to implement! 🚀
