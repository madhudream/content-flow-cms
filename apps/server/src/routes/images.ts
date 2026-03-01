import { getStorageService } from '../services/StorageFactory';
import { logger } from '../utils/logger';
import sharp from 'sharp';

// Image optimization configuration
const SIZES = {
  thumbnail: { width: 150, quality: 80 },
  small: { width: 400, quality: 85 },
  medium: { width: 800, quality: 85 },
  large: { width: 1200, quality: 90 },
};

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

async function optimizeImage(
  buffer: ArrayBuffer,
  filename: string,
  storage: any
): Promise<ImageMetadata> {
  const baseFilename = filename.replace(/\.[^/.]+$/, ''); // Remove extension
  const inputBuffer = Buffer.from(buffer);
  
  // Get original image metadata
  const imageInfo = await sharp(inputBuffer).metadata();
  
  // Generate optimized versions
  const optimizedVersions: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  } = {};
  
  // Thumbnail (150px)
  const thumbnailBuffer = await sharp(inputBuffer)
    .resize(SIZES.thumbnail.width, undefined, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .webp({ quality: SIZES.thumbnail.quality })
    .toBuffer();
  
  const thumbnailFilename = `${baseFilename}-150.webp`;
  await storage.saveOptimizedImage(
    'thumbnails',
    thumbnailFilename,
    thumbnailBuffer.buffer,
    'image/webp'
  );
  optimizedVersions.thumbnail = storage.getImageUrl(`thumbnails/${thumbnailFilename}`);
  
  // Small (400px)
  const smallBuffer = await sharp(inputBuffer)
    .resize(SIZES.small.width, undefined, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .webp({ quality: SIZES.small.quality })
    .toBuffer();
  
  const smallFilename = `${baseFilename}-400.webp`;
  await storage.saveOptimizedImage(
    'optimized',
    smallFilename,
    smallBuffer.buffer,
    'image/webp'
  );
  optimizedVersions.small = storage.getImageUrl(`optimized/${smallFilename}`);
  
  // Medium (800px)
  const mediumBuffer = await sharp(inputBuffer)
    .resize(SIZES.medium.width, undefined, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .webp({ quality: SIZES.medium.quality })
    .toBuffer();
  
  const mediumFilename = `${baseFilename}-800.webp`;
  await storage.saveOptimizedImage(
    'optimized',
    mediumFilename,
    mediumBuffer.buffer,
    'image/webp'
  );
  optimizedVersions.medium = storage.getImageUrl(`optimized/${mediumFilename}`);
  
  // Large (1200px)
  const largeBuffer = await sharp(inputBuffer)
    .resize(SIZES.large.width, undefined, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .webp({ quality: SIZES.large.quality })
    .toBuffer();
  
  const largeFilename = `${baseFilename}-1200.webp`;
  await storage.saveOptimizedImage(
    'optimized',
    largeFilename,
    largeBuffer.buffer,
    'image/webp'
  );
  optimizedVersions.large = storage.getImageUrl(`optimized/${largeFilename}`);
  
  // Create metadata object
  const metadata: ImageMetadata = {
    id: `${baseFilename}-${Date.now()}`,
    name: filename,
    uploadedAt: new Date().toISOString(),
    original: storage.getImageUrl(`original/${filename}`),
    thumbnail: optimizedVersions.thumbnail!,
    sizes: {
      small: optimizedVersions.small!,
      medium: optimizedVersions.medium!,
      large: optimizedVersions.large!,
    },
    metadata: {
      width: imageInfo.width || 0,
      height: imageInfo.height || 0,
      size: buffer.byteLength,
      format: imageInfo.format || 'unknown',
    },
  };
  
  return metadata;
}

async function updateImagesCatalog(
  storage: any,
  newImage: ImageMetadata
): Promise<void> {
  try {
    // Try to read existing catalog
    let catalog: ImagesCatalog = { images: [], updatedAt: new Date().toISOString() };
    
    try {
      const existingData = await storage.readImagesCatalog();
      if (existingData) {
        catalog = JSON.parse(existingData);
      }
    } catch (error) {
      logger.info('No existing images catalog, creating new one');
    }
    
    // Remove any existing image with the same name
    catalog.images = catalog.images.filter(img => img.name !== newImage.name);
    
    // Add new image
    catalog.images.unshift(newImage);
    
    // Sort by upload date (newest first)
    catalog.images.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    
    // Update timestamp
    catalog.updatedAt = new Date().toISOString();
    
    // Save updated catalog
    await storage.saveImagesCatalog(JSON.stringify(catalog, null, 2));
    
    logger.info('Images catalog updated', { totalImages: catalog.images.length });
  } catch (error: any) {
    logger.error('Failed to update images catalog', { error: error.message });
    throw error;
  }
}

export default async function imagesRoutes(req: Request, corsHeaders: Record<string, string>) {
  const url = new URL(req.url);
  const path = url.pathname;
  const storage = getStorageService();
  
  // POST /api/images/optimize-all - Optimize all unprocessed images
  if (req.method === 'POST' && path === '/api/images/optimize-all') {
    try {
      logger.info('Starting bulk image optimization');
      
      // List all images in original folder
      const originalImages = await storage.listOriginalImages();
      
      if (originalImages.length === 0) {
        return Response.json(
          { message: 'No images found in original folder', optimized: 0, skipped: 0 },
          { headers: corsHeaders }
        );
      }
      
      let optimizedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];
      
      for (const filename of originalImages) {
        try {
          // Check if already optimized
          const isOptimized = await storage.isImageOptimized(filename);
          
          if (isOptimized) {
            logger.debug('Image already optimized, skipping', { filename });
            skippedCount++;
            continue;
          }
          
          logger.info('Optimizing image', { filename });
          
          // Read original image directly from storage
          const buffer = await storage.readImage('original', filename);
          
          // Optimize image
          const imageMetadata = await optimizeImage(buffer, filename, storage);
          
          // Update catalog
          await updateImagesCatalog(storage, imageMetadata);
          
          optimizedCount++;
          logger.info('Image optimized successfully', { filename });
        } catch (error: any) {
          logger.error('Failed to optimize image', { filename, error: error.message });
          errors.push(`${filename}: ${error.message}`);
        }
      }
      
      return Response.json(
        {
          message: 'Bulk optimization completed',
          total: originalImages.length,
          optimized: optimizedCount,
          skipped: skippedCount,
          errors: errors.length > 0 ? errors : undefined,
        },
        { headers: corsHeaders }
      );
    } catch (error: any) {
      logger.error('Bulk optimization error', { error: error.message });
      return Response.json(
        { error: error.message || 'Bulk optimization failed' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
  
  // GET /api/images/status - Check optimization status
  if (req.method === 'GET' && path === '/api/images/status') {
    try {
      const originalImages = await storage.listOriginalImages();
      const unoptimized: string[] = [];
      const optimized: string[] = [];
      
      for (const filename of originalImages) {
        const isOptimized = await storage.isImageOptimized(filename);
        if (isOptimized) {
          optimized.push(filename);
        } else {
          unoptimized.push(filename);
        }
      }
      
      return Response.json(
        {
          total: originalImages.length,
          optimized: optimized.length,
          unoptimized: unoptimized.length,
          unoptimizedFiles: unoptimized,
        },
        { headers: corsHeaders }
      );
    } catch (error: any) {
      logger.error('Status check error', { error: error.message });
      return Response.json(
        { error: error.message || 'Status check failed' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
  
  // POST /api/images - Upload image
  if (req.method === 'POST' && path === '/api/images') {
    try {
      const formData = await req.formData();
      const image = formData.get('image') as File;
      const appId = formData.get('appId') as string;
      const contentId = formData.get('contentId') as string;
      
      if (!image) {
        return Response.json(
          { error: 'No file uploaded' },
          { status: 400, headers: corsHeaders }
        );
      }
      
      if (!appId || !contentId) {
        return Response.json(
          { error: 'appId and contentId are required' },
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(image.type)) {
        return Response.json(
          { error: 'Invalid file type. Only JPEG, PNG, GIF, SVG, and WebP images are allowed.' },
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Validate file size (5MB limit)
      if (image.size > 5 * 1024 * 1024) {
        return Response.json(
          { error: 'File too large. Maximum size is 5MB.' },
          { status: 413, headers: corsHeaders }
        );
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const ext = image.name.split('.').pop();
      const filename = `${appId}-${contentId}-${timestamp}.${ext}`;
      
      // Get file buffer
      const buffer = await image.arrayBuffer();
      
      // Save original to storage service
      const imagePath = await storage.saveImage(filename, buffer, image.type);
      
      logger.info('Image uploaded', { filename, path: imagePath, size: image.size });
      
      // Optimize image and generate multiple sizes
      try {
        const imageMetadata = await optimizeImage(buffer, filename, storage);
        
        // Update images.json catalog
        await updateImagesCatalog(storage, imageMetadata);
        
        logger.info('Image optimized and catalog updated', { 
          filename,
          sizes: Object.keys(imageMetadata.sizes).length + 1 // +1 for thumbnail
        });
      } catch (optimizeError: any) {
        // Log error but don't fail the upload
        logger.error('Image optimization failed', { 
          filename, 
          error: optimizeError.message 
        });
      }
      
      return Response.json(
        { path: imagePath },
        { headers: corsHeaders }
      );
    } catch (error: any) {
      logger.error('Image upload error', { error: error.message });
      return Response.json(
        { error: error.message || 'Image upload failed' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
  
  return Response.json(
    { error: 'Method not allowed' },
    { status: 405, headers: corsHeaders }
  );
}