# Azure Functions Image Optimizer

This Azure Function automatically optimizes images uploaded to blob storage.

## Features

- **Automatic Trigger**: Runs when image uploaded to `images/original/`
- **Multiple Sizes**: Generates 150px, 400px, 800px, 1200px WebP versions
- **Catalog**: Maintains `images.json` with all image metadata
- **Ultra-low cost**: ~$0.02/month for 100 images

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start local function
npm start
```

## Deployment

Deployed automatically via Pulumi when running:
```bash
npm run infra:up
```

## Image Sizes Generated

| Size | Width | Format | Quality | Use Case |
|------|-------|--------|---------|----------|
| Thumbnail | 150px | WebP | 80% | Gallery grid |
| Small | 400px | WebP | 85% | Mobile |
| Medium | 800px | WebP | 85% | Tablet |
| Large | 1200px | WebP | 90% | Desktop |

## Environment Variables

- `AzureWebJobsStorage`: Connection string to Azure Storage
- `AZURE_STORAGE_ACCOUNT`: Storage account name
