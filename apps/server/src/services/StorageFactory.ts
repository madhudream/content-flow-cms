import { IContentStorage } from './IContentStorage';
import { LocalStorageService } from './LocalStorageService';
import { AzureStorageService } from './AzureStorageService';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Storage Service Factory
 * 
 * Creates the appropriate storage service based on configuration.
 */
export function createStorageService(): IContentStorage {
  const storageType = config.storageType;
  
  logger.info('Creating storage service', { type: storageType });
  
  switch (storageType) {
    case 'azure':
      return new AzureStorageService();
    
    case 'local':
    default:
      return new LocalStorageService();
  }
}

// Singleton instance
let storageServiceInstance: IContentStorage | null = null;

/**
 * Get the storage service singleton instance
 */
export function getStorageService(): IContentStorage {
  if (!storageServiceInstance) {
    storageServiceInstance = createStorageService();
  }
  return storageServiceInstance;
}
