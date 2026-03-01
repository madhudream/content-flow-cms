# ContentFlow CMS - Azure Infrastructure (Pulumi)

This directory contains the Pulumi infrastructure-as-code for deploying ContentFlow CMS to Azure.

## Architecture

The infrastructure includes:

- **Resource Group**: `contentflow-rg`
- **Storage Account**: `contentflowstorage` with blob container for content/images
- **Container Registry**: `contentflowcr` for Docker images
- **Container Apps Environment**: Consumption-based serverless environment
- **Container App**: Runs the Bun server with scale-to-zero capability (0-3 replicas)
- **CDN**: Azure CDN with caching rules (5 min for JSON, 7 days for images)

## Prerequisites

1. **Azure Account** with active subscription
2. **Azure CLI** logged in: `az login`
3. **Pulumi CLI** installed: https://www.pulumi.com/docs/get-started/install/
4. **Pulumi Account** logged in: `pulumi login`
5. **Docker** installed and running for image builds
6. **Service Principal** credentials (see ../AZURE_DEPLOYMENT_KEYS.md)

## Environment Variables

Set these in your environment before deploying:

```bash
export AZURE_TENANT_ID=<your-tenant-id>
export AZURE_CLIENT_ID=<your-client-id>
export AZURE_CLIENT_SECRET=<your-client-secret>
export AZURE_SUBSCRIPTION_ID=<your-subscription-id>
```

Or use Azure CLI authentication (recommended for local testing):
```bash
az login
az account set --subscription <subscription-id>
```

## Deployment

### 1. Preview changes (dry run)

```bash
cd pulumi
pulumi preview
```

### 2. Deploy infrastructure

```bash
pulumi up
```

This will:
1. Create Azure resources (Resource Group, Storage, Container Registry)
2. Build Docker image from `../apps/server/Dockerfile`
3. Push image to Azure Container Registry
4. Deploy Container App with environment variables
5. Upload initial config to Blob Storage
6. Create CDN endpoint for content delivery

**Estimated time**: 5-10 minutes

### 3. Get outputs

```bash
pulumi stack output
```

Expected outputs:
- `containerAppUrl`: Your app URL
- `storageAccountName`: `contentflowstorage`
- `storageAccountKey`: Storage access key
- `cdnEndpointUrl`: CDN URL for content

## Post-Deployment

### 1. Verify Container App

```bash
# Get the app URL
APP_URL=$(pulumi stack output containerAppUrl)

# Test health endpoint
curl $APP_URL/health

# Access CMS
open $APP_URL/cms
```

### 2. Upload initial content to Blob Storage

```bash
# Get credentials
STORAGE_ACCOUNT=$(pulumi stack output storageAccountName)
STORAGE_KEY=$(pulumi stack output storageAccountKey)

# Upload content files
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --destination contentflow-content/content \
  --source ../apps/server/content \
  --pattern "*.json"

# Upload images
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --destination contentflow-content/images \
  --source ../apps/server/content/images \
  --pattern "*"
```

## Cleanup

```bash
pulumi destroy
```

## Troubleshooting

### Test Docker build locally

```bash
cd ..
docker build -f apps/server/Dockerfile -t contentflow-test .
docker run -p 8080:8080 contentflow-test
```

### Check Container App logs

```bash
az containerapp logs show \
  --name contentflow-app \
  --resource-group contentflow-rg \
  --follow
```

## Cost Estimation

Monthly costs: **~$6-8** with scale-to-zero capability.

See full docs: ../AZURE_DEPLOYMENT_KEYS.md
