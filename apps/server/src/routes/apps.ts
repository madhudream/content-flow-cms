import { getStorageService } from '../services/StorageFactory';
import { logger } from '../utils/logger';

export default async function appsRoutes(req: Request, corsHeaders: HeadersInit) {
  const url = new URL(req.url);
  const path = url.pathname;
  const storage = getStorageService();
  
  // GET /api/apps - Serve apps.config.json
  if (req.method === 'GET' && path === '/api/apps') {
    try {
      const appsConfig = await storage.readAppsConfig();
      return Response.json(appsConfig, { headers: corsHeaders });
    } catch (error: any) {
      logger.error('Failed to read apps config', { error: error.message });
      return Response.json(
        { error: error.message || 'Failed to read apps config' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
  
  return Response.json(
    { error: 'Method not allowed' },
    { status: 405, headers: corsHeaders }
  );
}