# Azure Function Deployment Guide

## Overview
This guide covers testing and deploying the ContentFlow image optimization Azure Function to production.

## Prerequisites
- Node.js 20.x or higher
- Azure CLI installed and authenticated
- Pulumi CLI installed
- Azure subscription with appropriate permissions

## Step 1: Install Dependencies

```bash
cd azure-functions
npm install
```

This will install:
- `@azure/functions` - Azure Functions v4 runtime
- `@azure/storage-blob` - Blob storage SDK
- `sharp` - Image optimization library
- TypeScript and tooling

## Step 2: Build the Function

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

## Step 3: Test Locally (Optional)

### Start Azure Storage Emulator (Azurite)
```bash
# Install Azurite if not already installed
npm install -g azurite

# Start Azurite
azurite --silent --location /tmp/azurite --debug /tmp/azurite/debug.log
```

### Configure Local Settings
Update `local.settings.json` with your local storage connection:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_STORAGE_ACCOUNT": "devstoreaccount1"
  }
}
```

### Run Function Locally
```bash
npm start
```

### Test the Trigger
Upload an image to `images/original/` in your local blob storage and watch the function process it.

## Step 4: Deploy with Pulumi

### From Repository Root

```bash
cd pulumi

# Preview changes
pulumi preview

# Deploy to Azure
pulumi up
```

This will:
1. Create App Service Plan (Consumption Y1 SKU)
2. Create Function App
3. Configure environment variables
4. Set up CORS
5. Export function app URL

### What Gets Deployed
- **Resource**: Azure Function App (`contentflow-image-optimizer`)
- **Plan**: Consumption (Y1) - Pay per execution
- **Runtime**: Node.js 20
- **Trigger**: Blob storage trigger on `images/original/{name}`
- **Output**: Optimized WebP images in multiple sizes + images.json catalog

## Step 5: Upload Function Code

After Pulumi deployment, you need to upload the function code.

### Option A: Using Azure CLI (Recommended)

```bash
# Build the function
cd azure-functions
npm run build

# Create deployment package
zip -r function.zip . \
  -x ".git/*" \
  -x "node_modules/*" \
  -x ".funcignore" \
  -x "local.settings.json" \
  -x "*.md"

# Deploy to Azure
az functionapp deployment source config-zip \
  --resource-group contentflow-rg \
  --name contentflow-image-optimizer \
  --src function.zip

# Clean up
rm function.zip
```

### Option B: Using VS Code Azure Functions Extension

1. Install "Azure Functions" extension
2. Sign in to Azure
3. Right-click on azure-functions folder
4. Select "Deploy to Function App"
5. Choose `contentflow-image-optimizer`

### Option C: Using GitHub Actions (CI/CD)

Create `.github/workflows/deploy-function.yml`:
```yaml
name: Deploy Azure Function

on:
  push:
    branches: [main]
    paths:
      - 'azure-functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        working-directory: azure-functions
        run: npm ci
      
      - name: Build function
        working-directory: azure-functions
        run: npm run build
      
      - name: Deploy to Azure
        uses: Azure/functions-action@v1
        with:
          app-name: contentflow-image-optimizer
          package: azure-functions
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

## Step 6: Upload Initial images.json to Blob Storage

```bash
# Using Azure CLI
az storage blob upload \
  --account-name contentflowstorage \
  --container-name contentflow-content \
  --name images/images.json \
  --file apps/server/content/images/images.json \
  --content-type "application/json" \
  --auth-mode login
```

## Step 7: Test the Complete Pipeline

### Upload Test Image via CMS

1. Open CMS: `https://contentflow-app.salmonwave-4851ce16.eastus.azurecontainerapps.io/`
2. Navigate to any app page
3. Click on an image element
4. In Editor Panel, click "Upload New" or drag-drop an image
5. Image uploads to `images/original/`
6. Azure Function triggers automatically
7. Function processes image (4 sizes + WebP conversion)
8. images.json updates with new image metadata

### Verify Function Execution

```bash
# View function logs
az functionapp log tail \
  --resource-group contentflow-rg \
  --name contentflow-image-optimizer
```

### Check Generated Files

In blob storage `contentflow-content` container:
- `images/original/test-image.jpg` - Original upload
- `images/thumbnails/test-image-150.webp` - Thumbnail (150px)
- `images/optimized/test-image-400.webp` - Small (400px)
- `images/optimized/test-image-800.webp` - Medium (800px)
- `images/optimized/test-image-1200.webp` - Large (1200px)
- `images/images.json` - Updated catalog

### Test ImagePicker in CMS

1. In CMS, edit any image content
2. Click "Select from Gallery"
3. Modal opens showing all images from images.json
4. Search for images by name
5. Select image size (thumbnail/small/medium/large/original)
6. Click an image to select it
7. URL populates in editor
8. Save content

## Step 8: Monitor Costs

### Expected Costs (Monthly)

**Consumption Plan (Y1)**:
- First 1 million executions: FREE
- After: $0.20 per million executions

**Storage (Blob)**:
- Hot tier: ~$0.02/GB for storage
- Operations: ~$0.004 per 10,000 transactions

**Example: 100 images/month**:
- Function executions: FREE (well under 1M)
- Storage: ~500MB = $0.01
- Operations: ~500 requests = $0.0002
- **Total: ~$0.01/month**

### Cost Monitoring

```bash
# View function metrics
az monitor metrics list \
  --resource /subscriptions/{subscription-id}/resourceGroups/contentflow-rg/providers/Microsoft.Web/sites/contentflow-image-optimizer \
  --metric "FunctionExecutionCount"
```

## Troubleshooting

### Function Not Triggering

1. Check blob trigger binding in `function.json`
2. Verify storage account connection string
3. Check function logs for errors
4. Ensure images uploaded to `images/original/` path

### Images Not Optimizing

1. Check Sharp installation: `npm list sharp`
2. Verify file format is supported (JPEG, PNG, GIF, WebP)
3. Check function timeout (default: 5 minutes)
4. Review error logs

### images.json Not Updating

1. Check blob storage permissions (write access)
2. Verify `AZURE_STORAGE_ACCOUNT` environment variable
3. Check catalog update logic in logs
4. Manually inspect images.json in blob storage

### ImagePicker Not Loading

1. Verify images.json exists in blob storage
2. Check CORS settings on storage account
3. Inspect browser network tab for 404/403 errors
4. Verify server redirect: `/data/images/images.json`

## Rollback

If issues occur, rollback Pulumi stack:

```bash
cd pulumi
pulumi stack select dev  # or your stack name
pulumi up --refresh  # Check current state
pulumi stack export --file backup.json  # Backup
pulumi destroy  # Remove Function App only (manual)
```

## Production Checklist

- [ ] Azure Function dependencies installed
- [ ] Function built successfully (`npm run build`)
- [ ] Pulumi infrastructure deployed
- [ ] Function code uploaded to Azure
- [ ] Initial images.json uploaded to blob storage
- [ ] Test image upload triggers function
- [ ] Verify optimized images generated (4 sizes)
- [ ] Verify images.json updates automatically
- [ ] CMS ImagePicker loads images successfully
- [ ] All apps can select and use optimized images
- [ ] Monitor function execution for 24 hours
- [ ] Verify costs align with expectations (~$0.01-0.50/month)

## Next Steps

1. Set up monitoring alerts for function failures
2. Configure Application Insights for detailed telemetry
3. Add image metadata tags (alt text, copyright, etc.)
4. Implement image deletion/cleanup workflow
5. Add image transformation options (crop, rotate, filters)
6. Consider CDN for faster global delivery

## Support

For issues or questions:
- Check Azure Function logs: `az functionapp log tail`
- Review Pulumi state: `pulumi stack`
- Inspect blob storage: Azure Portal → Storage Account → Containers
- Debug locally with Azurite emulator
