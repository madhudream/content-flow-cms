import { app, InvocationContext } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import sharp from 'sharp';

interface ImageMetadata {
  id: string;
  name: string;
  uploadedAt: string;
  original: string;
  thumbnail: string;
  sizes: {
    small: string;
    medium: string;
    large: string;
  };
  metadata: {
    width: number;
    height: number;
    size: number;
    format: string;
  };
}

interface ImagesCatalog {
  images: ImageMetadata[];
  updatedAt: string;
}

export async function imageOptimizerBlobTrigger(
  blob: Buffer,
  context: InvocationContext
): Promise<void> {
  const blobName = context.triggerMetadata?.name as string;
  
  context.log(`Processing image: ${blobName}`);
  context.log(`Blob size: ${blob.length} bytes`);

  try {
    // Get Azure Storage connection
    const connectionString = process.env.AzureWebJobsStorage;
    if (!connectionString) {
      throw new Error('AzureWebJobsStorage connection string not found');
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('contentflow-content');

    // Get image metadata
    const image = sharp(blob);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to get image dimensions');
    }

    context.log(`Image dimensions: ${metadata.width}x${metadata.height}`);

    // Generate optimized versions
    const baseName = blobName.replace(/\.[^/.]+$/, ''); // Remove extension
    const timestamp = Date.now();
    const id = `${baseName}-${timestamp}`;

    // Generate thumbnail (150px width)
    const thumbnailBuffer = await image
      .resize(150, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 80 })
      .toBuffer();
    
    const thumbnailPath = `images/thumbnails/${baseName}-150.webp`;
    await uploadBlob(containerClient, thumbnailPath, thumbnailBuffer, 'image/webp');
    context.log(`Created thumbnail: ${thumbnailPath}`);

    // Generate small size (400px width)
    const smallBuffer = await image
      .resize(400, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 85 })
      .toBuffer();
    
    const smallPath = `images/optimized/${baseName}-400.webp`;
    await uploadBlob(containerClient, smallPath, smallBuffer, 'image/webp');
    context.log(`Created small: ${smallPath}`);

    // Generate medium size (800px width)
    const mediumBuffer = await image
      .resize(800, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 85 })
      .toBuffer();
    
    const mediumPath = `images/optimized/${baseName}-800.webp`;
    await uploadBlob(containerClient, mediumPath, mediumBuffer, 'image/webp');
    context.log(`Created medium: ${mediumPath}`);

    // Generate large size (1200px width)
    const largeBuffer = await image
      .resize(1200, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 90 })
      .toBuffer();
    
    const largePath = `images/optimized/${baseName}-1200.webp`;
    await uploadBlob(containerClient, largePath, largeBuffer, 'image/webp');
    context.log(`Created large: ${largePath}`);

    // Build image metadata
    const storageAccount = process.env.AZURE_STORAGE_ACCOUNT || 'contentflowstorage';
    const baseUrl = `https://${storageAccount}.blob.core.windows.net/contentflow-content`;

    const imageMetadata: ImageMetadata = {
      id,
      name: blobName,
      uploadedAt: new Date().toISOString(),
      original: `${baseUrl}/images/original/${blobName}`,
      thumbnail: `${baseUrl}/${thumbnailPath}`,
      sizes: {
        small: `${baseUrl}/${smallPath}`,
        medium: `${baseUrl}/${mediumPath}`,
        large: `${baseUrl}/${largePath}`,
      },
      metadata: {
        width: metadata.width,
        height: metadata.height,
        size: blob.length,
        format: metadata.format || 'unknown',
      },
    };

    // Update images.json catalog
    await updateImagesCatalog(containerClient, imageMetadata, context);

    context.log('✅ Image processing complete!');
  } catch (error) {
    context.error('❌ Error processing image:', error);
    throw error;
  }
}

async function uploadBlob(
  containerClient: any,
  blobPath: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: { blobContentType: contentType },
  });
}

async function updateImagesCatalog(
  containerClient: any,
  newImage: ImageMetadata,
  context: InvocationContext
): Promise<void> {
  const catalogPath = 'images/images.json';
  const blockBlobClient = containerClient.getBlockBlobClient(catalogPath);

  let catalog: ImagesCatalog = {
    images: [],
    updatedAt: new Date().toISOString(),
  };

  try {
    // Try to download existing catalog
    const downloadResponse = await blockBlobClient.download();
    const existingData = await streamToBuffer(downloadResponse.readableStreamBody);
    catalog = JSON.parse(existingData.toString('utf-8'));
    context.log('Loaded existing catalog with', catalog.images.length, 'images');
  } catch (error: any) {
    if (error.statusCode === 404) {
      context.log('Creating new images catalog');
    } else {
      context.warn('Error loading catalog, creating new one:', error.message);
    }
  }

  // Remove old entry with same name if exists
  catalog.images = catalog.images.filter(img => img.name !== newImage.name);
  
  // Add new image
  catalog.images.push(newImage);
  catalog.updatedAt = new Date().toISOString();

  // Sort by upload date (newest first)
  catalog.images.sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  // Upload updated catalog
  const catalogBuffer = Buffer.from(JSON.stringify(catalog, null, 2), 'utf-8');
  await blockBlobClient.upload(catalogBuffer, catalogBuffer.length, {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  });

  context.log(`✅ Updated catalog: ${catalog.images.length} total images`);
}

async function streamToBuffer(readableStream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data: Buffer) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

// Register the function
app.storageBlob('ImageOptimizer', {
  path: 'contentflow-content/images/original/{name}',
  connection: 'AzureWebJobsStorage',
  handler: imageOptimizerBlobTrigger,
});
