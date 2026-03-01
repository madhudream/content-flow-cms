# Azure Deployment - Required Keys & Credentials

This document lists all required credentials for deploying ContentFlow CMS to Azure with Pulumi.

## 1. Azure Service Principal (Authentication)

Required for both Pulumi infrastructure deployment and application runtime.

### How to Create:
```bash
az ad sp create-for-rbac --name "contentflow-cms-sp" \
  --role="Contributor" \
  --scopes="/subscriptions/{SUBSCRIPTION_ID}"
```


### Required Keys:
- **AZURE_TENANT_ID** - Your Azure AD tenant ID (e.g., `12345678-1234-1234-1234-123456789abc`)
- **AZURE_CLIENT_ID** - Service Principal application (client) ID (e.g., `87654321-4321-4321-4321-cba987654321`)
- **AZURE_CLIENT_SECRET** - Service Principal password/secret (e.g., `xYz...`)
- **AZURE_SUBSCRIPTION_ID** - Your Azure subscription ID (e.g., `abcdef01-2345-6789-abcd-ef0123456789`)

### Where to Find:
```bash
# List subscriptions
az account list --output table

# Show current subscription
az account show

# Show service principal details
az ad sp list --display-name "contentflow-cms-sp"
```

---

## 2. Azure Storage Account

Required for storing content JSON files and images.

### How to Create:
```bash
# Will be created by Pulumi, but you can create manually:
az storage account create \
  --name contentflowstorage \
  --resource-group contentflow-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2
```

### Required Keys:
- **AZURE_STORAGE_ACCOUNT** - Storage account name (e.g., `contentflowstorage`)
- **AZURE_STORAGE_KEY** - Storage account access key (auto-generated)
- **AZURE_STORAGE_CONTAINER** - Container name (default: `contentflow-content`)

### Where to Find:
```bash
# Get storage account keys
az storage account keys list \
  --account-name contentflowstorage \
  --resource-group contentflow-rg \
  --output table

# Get connection string
az storage account show-connection-string \
  --name contentflowstorage \
  --resource-group contentflow-rg
```

**Note:** Pulumi will create this automatically. You can retrieve keys after deployment.

---

## 3. Azure CDN (Optional but Recommended)

Required for content delivery and caching.

### Required Keys:
- **CDN_ENDPOINT** - CDN endpoint URL (e.g., `https://contentflow-cdn.azureedge.net`)
- **CDN_PROFILE_NAME** - CDN profile name (e.g., `contentflow-cdn-profile`)
- **CDN_RESOURCE_GROUP** - Resource group name (e.g., `contentflow-rg`)

### Where to Find:
```bash
# List CDN profiles
az cdn profile list --resource-group contentflow-rg

# Show CDN endpoint
az cdn endpoint list \
  --profile-name contentflow-cdn-profile \
  --resource-group contentflow-rg
```

**Note:** Pulumi will create this automatically.

---

## 4. Pulumi State Management

Required for Pulumi to track infrastructure state.

### Option A: Pulumi Cloud (Recommended for Quick Start)
- **PULUMI_ACCESS_TOKEN** - Get from https://app.pulumi.com/account/tokens
  - Sign in to Pulumi Cloud
  - Go to Settings → Access Tokens
  - Create new token
  - Copy token value (e.g., `pul-abc123...`)

### Option B: Azure Blob Backend (Self-Hosted)
```bash
# Login to Pulumi with Azure backend
pulumi login azblob://pulumistatecontainer?storage_account=contentflowstorage
```

Set in Pulumi config:
```bash
export AZURE_STORAGE_ACCOUNT=contentflowstorage
export AZURE_STORAGE_KEY=<storage-key>
```

---

## 5. GitHub Actions Secrets

All of the above need to be added as GitHub Secrets for CI/CD.

### Navigate to:
Repository → Settings → Secrets and variables → Actions → New repository secret

### Required Secrets:
```bash
# Azure Authentication
AZURE_TENANT_ID
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
AZURE_SUBSCRIPTION_ID

# Azure Storage (populated after first deployment)
AZURE_STORAGE_ACCOUNT
AZURE_STORAGE_KEY
AZURE_STORAGE_CONTAINER

# Azure CDN (populated after first deployment)
CDN_ENDPOINT
CDN_PROFILE_NAME
CDN_RESOURCE_GROUP

# Pulumi
PULUMI_ACCESS_TOKEN

# Optional: Deploy-specific
NODE_ENV=production
STORAGE_TYPE=azure
```

---

## 6. Environment Variables File

For local testing with Azure resources, create `.env.production`:

```bash
# .env.production (DO NOT COMMIT THIS FILE)

# Node Environment
NODE_ENV=production
STORAGE_TYPE=azure

# Azure Service Principal
AZURE_TENANT_ID=12345678-1234-1234-1234-123456789abc
AZURE_CLIENT_ID=87654321-4321-4321-4321-cba987654321
AZURE_CLIENT_SECRET=xYz...
AZURE_SUBSCRIPTION_ID=abcdef01-2345-6789-abcd-ef0123456789

# Azure Storage
AZURE_STORAGE_ACCOUNT=contentflowstorage
AZURE_STORAGE_KEY=abc123...
AZURE_STORAGE_CONTAINER=contentflow-content

# Azure CDN
CDN_ENDPOINT=https://contentflow-cdn.azureedge.net
CDN_PROFILE_NAME=contentflow-cdn-profile
CDN_RESOURCE_GROUP=contentflow-rg

# Server Config
PORT=8080
LOG_LEVEL=info
LOG_PRETTY=false
```

---

## 7. Step-by-Step Setup Process

### Step 1: Create Service Principal
```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "Your Subscription Name"

# Create service principal
az ad sp create-for-rbac --name "contentflow-cms-sp" \
  --role="Contributor" \
  --scopes="/subscriptions/$(az account show --query id -o tsv)"

# Output will show:
# {
#   "appId": "AZURE_CLIENT_ID",
#   "displayName": "contentflow-cms-sp",
#   "password": "AZURE_CLIENT_SECRET",
#   "tenant": "AZURE_TENANT_ID"
# }
```

### Step 2: Get Subscription ID
```bash
az account show --query id -o tsv
# Copy this as AZURE_SUBSCRIPTION_ID
```

### Step 3: Create Pulumi Access Token
1. Go to https://app.pulumi.com/
2. Sign up or sign in (can use GitHub)
3. Go to Settings → Access Tokens
4. Click "Create token"
5. Name it "contentflow-deployment"
6. Copy the token (starts with `pul-`)

### Step 4: Add to GitHub Secrets
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each of the 4 required secrets:
   - AZURE_TENANT_ID
   - AZURE_CLIENT_ID
   - AZURE_CLIENT_SECRET
   - AZURE_SUBSCRIPTION_ID
   - PULUMI_ACCESS_TOKEN

### Step 5: Run Pulumi Deployment
```bash
cd pulumi/
pulumi stack init production
pulumi config set azure-native:location eastus
pulumi up
```

Pulumi will create:
- Resource Group
- Storage Account (get AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY)
- Container Apps Environment
- Container App
- CDN Profile + Endpoint (get CDN_ENDPOINT, CDN_PROFILE_NAME)

### Step 6: Update GitHub Secrets with Storage & CDN Info
After Pulumi runs, add these new secrets:
```bash
AZURE_STORAGE_ACCOUNT=<from pulumi output>
AZURE_STORAGE_KEY=<from pulumi output>
CDN_ENDPOINT=<from pulumi output>
CDN_PROFILE_NAME=contentflow-cdn-profile
CDN_RESOURCE_GROUP=contentflow-rg
```

---

## 8. Cost Estimation

With the keys above, here's the expected monthly cost:

| Service | SKU | Cost |
|---------|-----|------|
| Container Apps | Free tier (180k vCPU seconds/month) | $0 - $5 |
| Storage Account | Standard LRS, ~1GB | ~$0.02 |
| CDN | Standard Microsoft tier, ~10GB transfer | ~$0.50 |
| **Total** | | **~$0.52 - $5.52/month** |

Scale-to-zero keeps costs minimal during idle periods.

---

## 9. Security Best Practices

1. **Never commit secrets** - Add `.env*` to `.gitignore`
2. **Use Service Principal** - Don't use personal account credentials
3. **Rotate keys regularly** - Especially AZURE_CLIENT_SECRET
4. **Use Azure Key Vault** (future) - Store secrets in Key Vault, reference in Container Apps
5. **Limit Service Principal scope** - Only grant necessary permissions
6. **Enable CORS carefully** - Only allow known domains in production
7. **Use HTTPS only** - Enforce SSL/TLS

---

## 10. Verification Commands

Test your setup:

```bash
# Test Azure authentication
az login --service-principal \
  -u $AZURE_CLIENT_ID \
  -p $AZURE_CLIENT_SECRET \
  --tenant $AZURE_TENANT_ID

# Test storage access
az storage blob list \
  --account-name $AZURE_STORAGE_ACCOUNT \
  --account-key $AZURE_STORAGE_KEY \
  --container-name $AZURE_STORAGE_CONTAINER

# Test Pulumi login
pulumi login
pulumi stack ls

# Test server locally with Azure storage
cd apps/server
STORAGE_TYPE=azure bun run start
```

---

## Quick Reference Table

| Key | Example Value | Where to Get | Required For |
|-----|---------------|--------------|--------------|
| AZURE_TENANT_ID | `12345678-1234...` | `az account show` | Auth |
| AZURE_CLIENT_ID | `87654321-4321...` | Service Principal output | Auth |
| AZURE_CLIENT_SECRET | `xYz...` | Service Principal output | Auth |
| AZURE_SUBSCRIPTION_ID | `abcdef01-2345...` | `az account show --query id` | Auth |
| AZURE_STORAGE_ACCOUNT | `contentflowstorage` | Pulumi output | Storage |
| AZURE_STORAGE_KEY | `abc123...` | `az storage account keys list` | Storage |
| AZURE_STORAGE_CONTAINER | `contentflow-content` | Config (or Pulumi output) | Storage |
| CDN_ENDPOINT | `https://....azureedge.net` | Pulumi output | CDN |
| CDN_PROFILE_NAME | `contentflow-cdn-profile` | Pulumi output | CDN |
| CDN_RESOURCE_GROUP | `contentflow-rg` | Pulumi config | CDN |
| PULUMI_ACCESS_TOKEN | `pul-abc123...` | Pulumi Cloud dashboard | IaC |

---

## Need Help?

- **Azure CLI Issues**: `az login` and check subscription with `az account show`
- **Pulumi Issues**: `pulumi login` and verify with `pulumi whoami`
- **Storage Issues**: Check firewall rules and network access in Azure Portal
- **CDN Issues**: Clear CDN cache after content updates

**Estimated Setup Time**: 15-30 minutes for first-time setup
