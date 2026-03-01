import { join, relative, dirname } from 'path';
import { file, write } from 'bun';
import { readdir, stat, mkdir } from 'fs/promises';
import type { IContentStorage } from './IContentStorage';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Local Filesystem Storage Service
 * 
 * Uses local filesystem for content and images.
 * Used in development mode.
 */
export class LocalStorageService implements IContentStorage {
  private contentDir: string;
  private imagesDir: string;
  private configDir: string;

  constructor() {
    this.contentDir = config.contentDir;
    this.imagesDir = config.imagesDir;
    this.configDir = config.configDir;
    logger.info('LocalStorageService initialized', {
      contentDir: this.contentDir,
      imagesDir: this.imagesDir,
    });
  }

  async readContent(filename: string): Promise<any> {
    const filePath = join(this.contentDir, filename);
    const fileHandle = file(filePath);
    
    if (!(await fileHandle.exists())) {
      throw new Error(`Content file not found: ${filename}`);
    }

    const content = await fileHandle.json();
    logger.debug('Content read', { filename });
    return content;
  }

  async writeContent(filename: string, content: any): Promise<void> {
    const filePath = join(this.contentDir, filename);
    
    // Create directory structure if it doesn't exist (for new folder structure)
    const dir = dirname(filePath);
    try {
      await mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
    
    await write(filePath, JSON.stringify(content, null, 2));
    logger.info('Content written', { filename });
  }

  async listContent(prefixFilter?: string): Promise<string[]> {
    const allFiles: string[] = [];
    
    /**
     * Recursively walk directory and collect all JSON files
     */
    async function walk(dir: string, baseDir: string): Promise<void> {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively walk subdirectories
          await walk(fullPath, baseDir);
        } else if (entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('.')) {
          // Add JSON files with path relative to content directory
          const relativePath = relative(baseDir, fullPath);
          allFiles.push(relativePath);
        }
      }
    }
    
    await walk(this.contentDir, this.contentDir);
    logger.debug('Content listed (recursive)', { count: allFiles.length, files: allFiles });
    return allFiles;
  }

  async readAppsConfig(): Promise<any> {
    const configPath = join(this.configDir, 'apps.config.json');
    const fileHandle = file(configPath);
    
    if (!(await fileHandle.exists())) {
      throw new Error('Apps config not found');
    }

    const appConfig = await fileHandle.json();
    logger.debug('Apps config read');
    return appConfig;
  }

  async saveImage(filename: string, buffer: ArrayBuffer, contentType: string): Promise<string> {
    // Save to images/original folder for Azure Function trigger
    const originalDir = join(this.imagesDir, 'original');
    
    // Ensure original directory exists
    const originalDirHandle = file(originalDir);
    if (!await originalDirHandle.exists()) {
      await Bun.write(join(originalDir, '.gitkeep'), '');
    }
    
    const imagePath = join(originalDir, filename);
    await write(imagePath, buffer);
    const url = `/data/images/original/${filename}`;
    logger.info('Image saved', { filename, url, size: buffer.byteLength });
    return url;
  }

  getImageUrl(filename: string): string {
    return `/data/images/${filename}`;
  }

  async saveOptimizedImage(subfolder: string, filename: string, buffer: ArrayBuffer, contentType: string): Promise<string> {
    const subfolderPath = join(this.imagesDir, subfolder);
    
    // Ensure subfolder exists
    const subfolderHandle = file(subfolderPath);
    if (!await subfolderHandle.exists()) {
      await Bun.write(join(subfolderPath, '.gitkeep'), '');
    }
    
    const imagePath = join(subfolderPath, filename);
    await write(imagePath, buffer);
    const url = `/data/images/${subfolder}/${filename}`;
    logger.info('Optimized image saved', { subfolder, filename, url, size: buffer.byteLength });
    return url;
  }

  async readImagesCatalog(): Promise<string> {
    const catalogPath = join(this.imagesDir, 'images.json');
    const fileHandle = file(catalogPath);
    
    if (!(await fileHandle.exists())) {
      throw new Error('Images catalog not found');
    }

    const content = await fileHandle.text();
    logger.debug('Images catalog read');
    return content;
  }

  async saveImagesCatalog(catalogData: string): Promise<void> {
    const catalogPath = join(this.imagesDir, 'images.json');
    await write(catalogPath, catalogData);
    logger.info('Images catalog saved');
  }

  async listOriginalImages(): Promise<string[]> {
    const originalDir = join(this.imagesDir, 'original');
    
    try {
      const files = await readdir(originalDir);
      const images = files.filter((f) => 
        !f.startsWith('.') && 
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f)
      );
      logger.debug('Listed original images', { count: images.length });
      return images;
    } catch (error) {
      logger.error('Failed to list original images', { error });
      return [];
    }
  }

  async isImageOptimized(filename: string): Promise<boolean> {
    const baseFilename = filename.replace(/\.[^/.]+$/, '');
    const thumbnailPath = join(this.imagesDir, 'thumbnails', `${baseFilename}-150.webp`);
    const fileHandle = file(thumbnailPath);
    
    return await fileHandle.exists();
  }

  async readImage(subfolder: string, filename: string): Promise<ArrayBuffer> {
    const imagePath = join(this.imagesDir, subfolder, filename);
    const fileHandle = file(imagePath);
    
    if (!(await fileHandle.exists())) {
      throw new Error(`Image not found: ${subfolder}/${filename}`);
    }
    
    const buffer = await fileHandle.arrayBuffer();
    logger.debug('Image read', { subfolder, filename, size: buffer.byteLength });
    return buffer;
  }

  async deleteImage(filename: string): Promise<void> {
    const imagePath = join(this.imagesDir, filename);
    const fileHandle = file(imagePath);
    
    if (await fileHandle.exists()) {
      await Bun.write(imagePath, ''); // Bun doesn't have unlink yet, so clear file
      logger.info('Image deleted', { filename });
    }
  }

  async contentExists(filename: string): Promise<boolean> {
    const filePath = join(this.contentDir, filename);
    const fileHandle = file(filePath);
    return await fileHandle.exists();
  }

  async saveCostData(costData: any): Promise<void> {
    const costFilePath = join(this.contentDir, 'costs', 'translation-costs.json');
    
    // Read existing costs or create empty array
    let costs: any[] = [];
    try {
      const costFile = file(costFilePath);
      if (await costFile.exists()) {
        costs = await costFile.json();
      }
    } catch (error) {
      logger.warn('Failed to read existing costs, creating new log', { error });
      costs = [];
    }

    // Append new cost data
    costs.push(costData);

    // Write back to file
    await write(costFilePath, JSON.stringify(costs, null, 2));
    logger.info('Cost data saved', { batchId: costData.batchId, cost: costData.cost });
  }

  async readCostData(): Promise<any[]> {
    const costFilePath = join(this.contentDir, 'costs', 'translation-costs.json');
    
    try {
      const costFile = file(costFilePath);
      if (await costFile.exists()) {
        const costs = await costFile.json();
        logger.debug('Cost data read', { count: costs.length });
        return costs;
      }
    } catch (error) {
      logger.warn('Failed to read cost data', { error });
    }

    return [];
  }
}
