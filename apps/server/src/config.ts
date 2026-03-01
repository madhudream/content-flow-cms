import { resolve } from 'path';

export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  storageType: 'local' | 'azure';
  
  // Local directories
  contentDir: string;
  imagesDir: string;
  configDir: string;
  publicDir: string;
  
  // Azure storage config
  azureStorageAccount?: string;
  azureStorageKey?: string;
  azureStorageContainer?: string;
  azureTenantId?: string;
  azureClientId?: string;
  azureClientSecret?: string;
  azureSubscriptionId?: string;
  
  // CDN config
  cdnEndpoint?: string;
  cdnProfileName?: string;
  cdnResourceGroup?: string;
  
  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logPretty: boolean;
}

// Load configuration from environment variables
export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: (process.env.NODE_ENV as any) || 'development',
  storageType: (process.env.STORAGE_TYPE === 'azure' ? 'azure' : 'local') as 'local' | 'azure',
  
  // Local directories (within server app)
  contentDir: process.env.CONTENT_DIR || resolve(import.meta.dir, '../content'),
  imagesDir: process.env.IMAGES_DIR || resolve(import.meta.dir, '../content/images'),
  configDir: process.env.CONFIG_DIR || resolve(import.meta.dir, '../config'),
  publicDir: process.env.PUBLIC_DIR || resolve(import.meta.dir, '../public'),
  
  // Azure storage
  azureStorageAccount: process.env.AZURE_STORAGE_ACCOUNT,
  azureStorageKey: process.env.AZURE_STORAGE_KEY,
  azureStorageContainer: process.env.AZURE_STORAGE_CONTAINER || 'contentflow-content',
  azureTenantId: process.env.AZURE_TENANT_ID,
  azureClientId: process.env.AZURE_CLIENT_ID,
  azureClientSecret: process.env.AZURE_CLIENT_SECRET,
  azureSubscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
  
  // CDN
  cdnEndpoint: process.env.CDN_ENDPOINT,
  cdnProfileName: process.env.CDN_PROFILE_NAME,
  cdnResourceGroup: process.env.CDN_RESOURCE_GROUP,
  
  // Logging
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
  logPretty: process.env.LOG_PRETTY !== 'false',
};

// Validate required configuration
export function validateConfig(): void {
  if (config.storageType === 'azure') {
    if (!config.azureStorageAccount) {
      throw new Error('AZURE_STORAGE_ACCOUNT is required when STORAGE_TYPE=azure');
    }
  }
  
  if (config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid PORT: ${config.port}. Must be between 1 and 65535`);
  }
}
