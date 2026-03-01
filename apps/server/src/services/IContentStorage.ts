/**
 * Content Storage Interface
 * 
 * Abstraction layer for content and image storage.
 * Implementations: LocalStorageService (filesystem), AzureStorageService (blob storage)
 */

export interface IContentStorage {
  /**
   * Read a content JSON file
   * @param filename - Content file name (e.g., "demo-home-en-US.json")
   * @returns Content as JSON object
   */
  readContent(filename: string): Promise<any>;

  /**
   * Write a content JSON file
   * @param filename - Content file name
   * @param content - Content object to write
   */
  writeContent(filename: string, content: any): Promise<void>;

  /**
   * List all content files
   * @param prefix - Optional prefix to filter blobs (e.g., 'content/', 'translation-batches/')
   * @returns Array of filenames
   */
  listContent(prefix?: string): Promise<string[]>;

  /**
   * Read apps configuration
   * @returns Apps config object
   */
  readAppsConfig(): Promise<any>;

  /**
   * Save an image
   * @param filename - Image filename
   * @param buffer - Image data buffer
   * @param contentType - MIME type (e.g., "image/jpeg")
   */
  saveImage(filename: string, buffer: ArrayBuffer, contentType: string): Promise<string>;

  /**
   * Get image URL
   * @param filename - Image filename
   * @returns Public URL to access the image
   */
  getImageUrl(filename: string): string;

  /**
   * Save an optimized image to a specific subfolder
   * @param subfolder - Subfolder name (e.g., 'thumbnails', 'optimized')
   * @param filename - Image filename
   * @param buffer - Image data buffer
   * @param contentType - MIME type (e.g., "image/webp")
   */
  saveOptimizedImage(subfolder: string, filename: string, buffer: ArrayBuffer, contentType: string): Promise<string>;

  /**
   * Read images catalog (images.json)
   * @returns Images catalog JSON string
   */
  readImagesCatalog(): Promise<string>;

  /**
   * Save images catalog (images.json)
   * @param catalogData - Catalog JSON string
   */
  saveImagesCatalog(catalogData: string): Promise<void>;

  /**
   * List all images in original folder
   * @returns Array of image filenames
   */
  listOriginalImages(): Promise<string[]>;

  /**
   * Check if image has been optimized
   * @param filename - Original image filename
   * @returns True if optimized versions exist
   */
  isImageOptimized(filename: string): Promise<boolean>;

  /**
   * Read an image file directly
   * @param subfolder - Subfolder name (e.g., 'original', 'thumbnails')
   * @param filename - Image filename
   * @returns Image data as ArrayBuffer
   */
  readImage(subfolder: string, filename: string): Promise<ArrayBuffer>;

  /**
   * Delete an image
   * @param filename - Image filename
   */
  deleteImage(filename: string): Promise<void>;

  /**
   * Check if content file exists
   * @param filename - Content file name
   */
  contentExists(filename: string): Promise<boolean>;

  /**
   * Save cost tracking data
   * @param costData - Cost entry to append to log
   */
  saveCostData(costData: any): Promise<void>;

  /**
   * Read cost tracking data
   * @returns Cost log array
   */
  readCostData(): Promise<any[]>;
}
