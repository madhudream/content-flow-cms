import type { IContentStorage } from './IContentStorage';
import type { ContentMap, ContentFile } from '../types';

/**
 * Local JSON file adapter for content storage
 * Reads/writes JSON files via HTTP from storageUrl
 */
export class LocalJsonAdapter implements IContentStorage {
  private storageUrl: string;

  constructor(storageUrl: string) {
    this.storageUrl = storageUrl.endsWith('/') ? storageUrl.slice(0, -1) : storageUrl;
  }

  /**
   * Read content file via HTTP GET
   * @param path - Filename (e.g., 'demo-home-en-US.json')
   * @returns ContentMap with $meta stripped
   */
  async read(path: string): Promise<ContentMap> {
    const url = `${this.storageUrl}/${path}`;

    try {
      const response = await fetch(url);

      // Return empty map on 404 (content file doesn't exist yet)
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[ContentFlow SDK] Content file not found: ${path}`);
          return {};
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ContentFile = await response.json();

      // Strip $meta from content map
      const { $meta, ...contentMap } = data;

      return contentMap as ContentMap;
    } catch (error) {
      console.error(`[ContentFlow SDK] Failed to read content file: ${path}`, error);
      return {}; // Graceful fallback
    }
  }

  /**
   * Write content file (placeholder for Phase 1, used by CMS server)
   * @param _path - Filename
   * @param _data - Content file with $meta
   */
  async write(_path: string, _data: ContentFile): Promise<void> {
    // Phase 1: Not implemented in SDK (CMS server handles writes)
    throw new Error('LocalJsonAdapter.write() is not implemented in SDK. Use CMS server API.');
  }
}
