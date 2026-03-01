import { getStorageService } from '../services/StorageFactory';
import { CostTrackingService } from '../services/CostTrackingService';
import { logger } from '../utils/logger';

export default async function costsRoutes(req: Request, corsHeaders: Record<string, string>) {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/costs', '');
  const storage = getStorageService();
  const costTrackingService = new CostTrackingService(storage);

  // GET /api/costs/summary - Overall cost summary
  if (req.method === 'GET' && path === '/summary') {
    const appIdFilter = url.searchParams.get('appId'); // Optional appId filter
    
    try {
      logger.info('Getting cost summary', { appIdFilter });

      const summary = await costTrackingService.getCostSummary(appIdFilter || undefined);

      return Response.json(summary, { status: 200, headers: corsHeaders });
    } catch (error: any) {
      logger.error('Failed to get cost summary', { error: error.message });
      return Response.json(
        { error: `Failed to retrieve cost summary: ${error.message}` },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // GET /api/costs/history?limit=50 - Cost history with pagination
  if (req.method === 'GET' && path === '/history') {
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const appIdFilter = url.searchParams.get('appId'); // Optional appId filter

    try {
      logger.info('Getting cost history', { limit, appIdFilter });

      const history = await costTrackingService.getCostHistory(limit, appIdFilter || undefined);

      return Response.json({ costs: history }, { status: 200, headers: corsHeaders });
    } catch (error: any) {
      logger.error('Failed to get cost history', { error: error.message });
      return Response.json(
        { error: `Failed to retrieve cost history: ${error.message}` },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // GET /api/costs/by-language - Cost breakdown by language
  if (req.method === 'GET' && path === '/by-language') {
    try {
      logger.info('Getting cost breakdown by language');

      const breakdown = await costTrackingService.getCostByLanguage();

      return Response.json({ languages: breakdown }, { status: 200, headers: corsHeaders });
    } catch (error: any) {
      logger.error('Failed to get cost breakdown by language', { error: error.message });
      return Response.json(
        { error: `Failed to retrieve cost breakdown: ${error.message}` },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // GET /api/costs/by-app - Cost breakdown by app
  if (req.method === 'GET' && path === '/by-app') {
    try {
      logger.info('Getting cost breakdown by app');

      const breakdown = await costTrackingService.getCostByApp();

      return Response.json({ apps: breakdown }, { status: 200, headers: corsHeaders });
    } catch (error: any) {
      logger.error('Failed to get cost breakdown by app', { error: error.message });
      return Response.json(
        { error: `Failed to retrieve cost breakdown: ${error.message}` },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  return Response.json(
    { error: 'Method not allowed' },
    { status: 405, headers: corsHeaders }
  );
}
