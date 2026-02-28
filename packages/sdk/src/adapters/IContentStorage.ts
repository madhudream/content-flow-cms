import type { ContentMap, ContentFile } from '../types';

/**
 * Storage interface for content persistence
 */
export interface IContentStorage {
  /**
   * Read content file and return parsed ContentMap
   * @param path - Path to content file (e.g., 'demo-home-en-US.json')
   * @returns ContentMap with $meta stripped, or empty map on 404
   */
  read(path: string): Promise<ContentMap>;

  /**
   * Write content file
   * @param path - Path to content file
   * @param data - Content file data with $meta
   */
  write(path: string, data: ContentFile): Promise<void>;
}
