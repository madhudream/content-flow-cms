import { BlobServiceClient, StorageSharedKeyCredential, ContainerClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import type { IContentStorage } from './IContentStorage';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Azure Blob Storage Service
 * 
 * Uses Azure Blob Storage for content and images.
 * Used in production mode.
 * 
 * Structure:
 * - Container: contentflow-content (or from config)
 * - Blobs: 
 *   - content/demo-home-en-US.json
 *   - content/apps.config.json
 *   - images/hero.jpg
 *   - images/second_hero.webp
 */
export class AzureStorageService implements IContentStorage {
  private containerClient: ContainerClient;
  private cdnEndpoint?: string;

  constructor() {
    if (!config.azureStorageAccount) {
      throw new Error('AZURE_STORAGE_ACCOUNT is required for Azure storage');
    }

    const accountName = config.azureStorageAccount;
    const containerName = config.azureStorageContainer || 'contentflow-content';
    
    let blobServiceClient: BlobServiceClient;

    // Use storage key if available (faster), otherwise use DefaultAzureCredential
    if (config.azureStorageKey) {
      const sharedKeyCredential = new StorageSharedKeyCredential(
        accountName,
        config.azureStorageKey
      );
      blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        sharedKeyCredential
      );
      logger.info('Azure Storage initialized with shared key');
    } else {
      // Use Managed Identity or Service Principal
      const credential = new DefaultAzureCredential();
      blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        credential
      );
      logger.info('Azure Storage initialized with DefaultAzureCredential');
    }

    this.containerClient = blobServiceClient.getContainerClient(containerName);
    this.cdnEndpoint = config.cdnEndpoint;
    
    logger.info('AzureStorageService initialized', {
      account: accountName,
      container: containerName,
      cdnEnabled: !!this.cdnEndpoint,
    });

    // Ensure container exists
    this.ensureContainer();
  }

  private async ensureContainer(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists({
        access: 'blob', // Public read access for blobs
      });
      logger.info('Container ensured', { container: this.containerClient.containerName });
    } catch (error) {
      logger.error('Failed to ensure container', { error });
      throw error;
    }
  }

  async readContent(filename: string): Promise<any> {
    const blobName = `content/${filename}`;
    const blobClient = this.containerClient.getBlobClient(blobName);
    
    try {
      const downloadResponse = await blobClient.download();
      const downloaded = await this.streamToBuffer(downloadResponse.readableStreamBody!);
      const content = JSON.parse(downloaded.toString('utf-8'));
      logger.debug('Content read from Azure', { filename });
      return content;
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error(`Content file not found: ${filename}`);
      }
      logger.error('Failed to read content from Azure', { filename, error });
      throw error;
    }
  }

  async writeContent(filename: string, content: any): Promise<void> {
    const blobName = `content/${filename}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    const jsonString = JSON.stringify(content, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');
    
    try {
      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: 'application/json',
          blobCacheControl: 'public, max-age=300', // 5 minutes
        },
      });
      logger.info('Content written to Azure', { filename, size: buffer.length });
      
      // TODO: Purge CDN cache if CDN is enabled
      if (this.cdnEndpoint) {
        await this.purgeCdnCache(`content/${filename}`);
      }
    } catch (error) {
      logger.error('Failed to write content to Azure', { filename, error });
      throw error;
    }
  }

  async listContent(): Promise<string[]> {
    const files: string[] = [];
    const prefix = 'content/';
    
    try {
      for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
        const filename = blob.name.replace(prefix, '');
        if (filename.endsWith('.json') && !filename.startsWith('.')) {
          files.push(filename);
        }
      }
      logger.debug('Content listed from Azure', { count: files.length });
      return files;
    } catch (error) {
      logger.error('Failed to list content from Azure', { error });
      throw error;
    }
  }

  async readAppsConfig(): Promise<any> {
    const blobName = 'config/apps.config.json';
    const blobClient = this.containerClient.getBlobClient(blobName);
    
    try {
      const downloadResponse = await blobClient.download();
      const downloaded = await this.streamToBuffer(downloadResponse.readableStreamBody!);
      const appConfig = JSON.parse(downloaded.toString('utf-8'));
      logger.debug('Apps config read from Azure');
      return appConfig;
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error('Apps config not found in Azure storage');
      }
      logger.error('Failed to read apps config from Azure', { error });
      throw error;
    }
  }

  async saveImage(filename: string, buffer: ArrayBuffer, contentType: string): Promise<string> {
    const blobName = `images/original/${filename}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    try {
      const uploadBuffer = Buffer.from(buffer);
      await blockBlobClient.upload(uploadBuffer, uploadBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: contentType,
          blobCacheControl: 'public, max-age=604800', // 7 days
        },
      });
      
      const url = this.getImageUrl(`original/${filename}`);
      logger.info('Image saved to Azure', { filename, url, size: buffer.byteLength });
      
      return url;
    } catch (error) {
      logger.error('Failed to save image to Azure', { filename, error });
      throw error;
    }
  }

  getImageUrl(filename: string): string {
    // Use CDN endpoint if available, otherwise blob storage endpoint
    if (this.cdnEndpoint) {
      return `${this.cdnEndpoint}/images/${filename}`;
    }
    return `https://${config.azureStorageAccount}.blob.core.windows.net/${this.containerClient.containerName}/images/${filename}`;
  }

  async saveOptimizedImage(subfolder: string, filename: string, buffer: ArrayBuffer, contentType: string): Promise<string> {
    const blobName = `images/${subfolder}/${filename}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    try {
      const uploadBuffer = Buffer.from(buffer);
      await blockBlobClient.upload(uploadBuffer, uploadBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: contentType,
          blobCacheControl: 'public, max-age=2592000', // 30 days for optimized images
        },
      });
      
      const url = this.getImageUrl(`${subfolder}/${filename}`);
      logger.info('Optimized image saved to Azure', { subfolder, filename, url, size: buffer.byteLength });
      
      return url;
    } catch (error) {
      logger.error('Failed to save optimized image to Azure', { subfolder, filename, error });
      throw error;
    }
  }

  async readImagesCatalog(): Promise<string> {
    const blobName = 'images/images.json';
    const blobClient = this.containerClient.getBlobClient(blobName);
    
    try {
      const downloadResponse = await blobClient.download();
      if (!downloadResponse.readableStreamBody) {
        throw new Error('No readable stream from blob');
      }

      const buffer = await this.streamToBuffer(downloadResponse.readableStreamBody);
      const content = buffer.toString('utf-8');
      logger.debug('Images catalog read from Azure');
      return content;
    } catch (error) {
      logger.error('Failed to read images catalog from Azure', { error });
      throw error;
    }
  }

  async saveImagesCatalog(catalogData: string): Promise<void> {
    const blobName = 'images/images.json';
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    try {
      const buffer = Buffer.from(catalogData, 'utf-8');
      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: 'application/json',
          blobCacheControl: 'public, max-age=300', // 5 minutes cache
        },
      });
      
      logger.info('Images catalog saved to Azure');
      
      // Purge CDN cache if CDN is enabled
      if (this.cdnEndpoint) {
        await this.purgeCdnCache('images/images.json');
      }
    } catch (error) {
      logger.error('Failed to save images catalog to Azure', { error });
      throw error;
    }
  }

  async listOriginalImages(): Promise<string[]> {
    const prefix = 'images/original/';
    const images: string[] = [];
    
    try {
      for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
        const filename = blob.name.replace(prefix, '');
        if (filename && !filename.includes('/')) {
          images.push(filename);
        }
      }
      
      logger.debug('Listed original images from Azure', { count: images.length });
      return images;
    } catch (error) {
      logger.error('Failed to list original images from Azure', { error });
      throw error;
    }
  }

  async isImageOptimized(filename: string): Promise<boolean> {
    const baseFilename = filename.replace(/\.[^/.]+$/, '');
    
    try {
      // Check if at least one optimized version exists
      const thumbnailBlob = `images/thumbnails/${baseFilename}-150.webp`;
      const blobClient = this.containerClient.getBlobClient(thumbnailBlob);
      
      return await blobClient.exists();
    } catch (error) {
      logger.error('Failed to check if image is optimized', { filename, error });
      return false;
    }
  }

  async readImage(subfolder: string, filename: string): Promise<ArrayBuffer> {
    const blobName = `images/${subfolder}/${filename}`;
    const blobClient = this.containerClient.getBlobClient(blobName);
    
    try {
      const downloadResponse = await blobClient.download();
      if (!downloadResponse.readableStreamBody) {
        throw new Error('No readable stream from blob');
      }

      const buffer = await this.streamToBuffer(downloadResponse.readableStreamBody);
      logger.debug('Image read from Azure', { subfolder, filename, size: buffer.byteLength });
      
      return buffer.buffer;
    } catch (error) {
      logger.error('Failed to read image from Azure', { subfolder, filename, error });
      throw error;
    }
  }

  async deleteImage(filename: string): Promise<void> {
    const blobName = `images/${filename}`;
    const blobClient = this.containerClient.getBlobClient(blobName);
    
    try {
      await blobClient.deleteIfExists();
      logger.info('Image deleted from Azure', { filename });
      
      // Purge CDN cache if CDN is enabled
      if (this.cdnEndpoint) {
        await this.purgeCdnCache(`images/${filename}`);
      }
    } catch (error) {
      logger.error('Failed to delete image from Azure', { filename, error });
      throw error;
    }
  }

  async contentExists(filename: string): Promise<boolean> {
    const blobName = `content/${filename}`;
    const blobClient = this.containerClient.getBlobClient(blobName);
    
    try {
      return await blobClient.exists();
    } catch (error) {
      logger.error('Failed to check content existence in Azure', { filename, error });
      return false;
    }
  }

  /**
   * Helper: Convert ReadableStream to Buffer
   */
  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (data: Buffer) => {
        chunks.push(data);
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

  /**
   * Helper: Purge CDN cache for a specific path
   * TODO: Implement with Azure CDN Management SDK
   */
  private async purgeCdnCache(path: string): Promise<void> {
    // Implementation would use @azure/arm-cdn to purge cache
    // For now, just log the intention
    logger.info('CDN cache purge requested', { path, cdnEndpoint: this.cdnEndpoint });
    
    // Example implementation (requires additional setup):
    // const credential = new DefaultAzureCredential();
    // const cdnClient = new CdnManagementClient(credential, config.azureSubscriptionId);
    // await cdnClient.endpoints.beginPurgeContentAndWait(
    //   config.cdnResourceGroup,
    //   config.cdnProfileName,
    //   'endpoint-name',
    //   { contentPaths: [`/${path}`] }
    // );
  }
}
