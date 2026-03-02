import { getStorageService } from '../services/StorageFactory';
import { TranslationService } from '../services/TranslationService';
import { CostTrackingService } from '../services/CostTrackingService';
import { logger } from '../utils/logger';
import { translationRateLimiter, getClientIp } from '../utils/rateLimiter';

export default async function translateRoutes(req: Request, corsHeaders: Record<string, string>) {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/translate', '');
  const storage = getStorageService();
  const translationService = new TranslationService(storage);
  const costTrackingService = new CostTrackingService(storage);

  // POST /api/translate/bulk - Trigger bulk translation
  if (req.method === 'POST' && path === '/bulk') {
    // Apply rate limiting for bulk translation requests
    const clientIp = getClientIp(req);
    if (!translationRateLimiter.check(clientIp)) {
      const resetTime = translationRateLimiter.getResetTime(clientIp);
      const resetDate = new Date(resetTime).toISOString();
      
      return Response.json(
        {
          error: 'Rate limit exceeded',
          message: 'Maximum 5 bulk translation requests per hour',
          resetAt: resetDate,
        },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetDate,
          },
        }
      );
    }
    let payload: any;
    try {
      payload = await req.json();
    } catch (error) {
      return Response.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate request
    if (!payload.sourceLang) {
      return Response.json(
        { error: 'sourceLang is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!payload.targetLangs || !Array.isArray(payload.targetLangs) || payload.targetLangs.length === 0) {
      return Response.json(
        { error: 'targetLangs must be a non-empty array' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Optional appIds filter
    const appIds = payload.appIds && Array.isArray(payload.appIds) ? payload.appIds : undefined;

    try {
      logger.info('Bulk translation requested', {
        sourceLang: payload.sourceLang,
        targetLangs: payload.targetLangs,
        appIds,
      });

      // 1. Prepare batch requests
      const { batchRequests, jsonl } = await translationService.prepareBulkTranslation({
        sourceLang: payload.sourceLang,
        targetLangs: payload.targetLangs,
        appIds,
      });

      if (batchRequests.length === 0) {
        return Response.json(
          { error: 'No content files found to translate' },
          { status: 400, headers: corsHeaders }
        );
      }

      // 2. Upload batch and create job
      const batchId = await translationService.uploadAndCreateBatch(jsonl, {
        sourceLang: payload.sourceLang,
        targetLangs: payload.targetLangs,
        totalRequests: batchRequests.length,
        fileIds: batchRequests.map((r) => r.custom_id),
      });

      // 3. Calculate estimated cost (rough estimate based on typical token usage)
      // Average: ~500 input tokens + ~400 output tokens per file
      // GPT-5.1 Batch pricing: $0.625/1M input, $5.00/1M output
      const avgInputTokensPerFile = 500;
      const avgOutputTokensPerFile = 400;
      const totalInputTokens = batchRequests.length * avgInputTokensPerFile;
      const totalOutputTokens = batchRequests.length * avgOutputTokensPerFile;
      const estimatedCost = (totalInputTokens / 1_000_000) * 0.625 + (totalOutputTokens / 1_000_000) * 5.0;

      logger.info('Bulk translation batch created', {
        batchId,
        totalRequests: batchRequests.length,
        estimatedCost,
      });

      return Response.json(
        {
          batchId,
          status: 'validating',
          totalRequests: batchRequests.length,
          estimatedCost: parseFloat(estimatedCost.toFixed(4)),
          estimatedTime: '24 hours max, typically 30 min - 2 hours',
        },
        { status: 200, headers: corsHeaders }
      );
    } catch (error: any) {
      logger.error('Bulk translation failed', { error: error.message, stack: error.stack });
      return Response.json(
        { error: `Failed to create translation batch: ${error.message}` },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // GET /api/translate/batch/:batchId - Get batch status
  if (req.method === 'GET' && path.startsWith('/batch/')) {
    const batchId = path.split('/')[2];

    if (!batchId) {
      return Response.json(
        { error: 'Batch ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      logger.info('Checking batch status', { batchId });

      const batchStatus = await translationService.checkBatchStatus(batchId);

      // If batch is completed, process results automatically
      if (batchStatus.status === 'completed' && batchStatus.outputFileId) {
        logger.info('Batch completed, processing results', { batchId });

        try {
          const results = await translationService.processBatchResults(batchId);
          const costData = translationService.calculateCost(
            results.totalInputTokens,
            results.totalOutputTokens
          );
          
          // Save cost data to tracking service
          await costTrackingService.saveCostData({
            batchId,
            timestamp: new Date().toISOString(),
            filesTranslated: results.filesTranslated,
            inputTokens: results.totalInputTokens,
            outputTokens: results.totalOutputTokens,
            cost: costData.totalCost,
            costPerFile:
              results.filesTranslated > 0
                ? parseFloat((costData.totalCost / results.filesTranslated).toFixed(6))
                : 0,
            appIds: results.appIds,  // Track which apps were translated
          });

          
          return Response.json(
            {
              ...batchStatus,
              filesTranslated: results.filesTranslated,
              filesFailed: results.filesFailed,
              savedFiles: results.savedFiles,
              failedFiles: results.failedFiles,
              totalCost: costData.totalCost,
              costPerFile:
                results.filesTranslated > 0
                  ? parseFloat((costData.totalCost / results.filesTranslated).toFixed(6))
                  : 0,
              inputTokens: results.totalInputTokens,
              outputTokens: results.totalOutputTokens,
            },
            { status: 200, headers: corsHeaders }
          );
        } catch (processingError: any) {
          logger.error('Failed to process batch results', {
            batchId,
            error: processingError.message,
          });
          // Return status anyway, but include error
          return Response.json(
            {
              ...batchStatus,
              processingError: processingError.message,
            },
            { status: 200, headers: corsHeaders }
          );
        }
      }

      // Return status for in-progress batches
      return Response.json(batchStatus, { status: 200, headers: corsHeaders });
    } catch (error: any) {
      logger.error('Failed to check batch status', { batchId, error: error.message });

      if (error.message.includes('not found') || error.message.includes('404')) {
        return Response.json(
          { error: 'Batch not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      return Response.json(
        { error: `Failed to retrieve batch status: ${error.message}` },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // GET /api/translate/batches - List recent batches
  if (req.method === 'GET' && path === '/batches') {
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const appIdFilter = url.searchParams.get('appId'); // Optional appId filter

    try {
      logger.info('Listing translation batches', { limit, appIdFilter });

      // List batch metadata files from storage
      const allFiles = await storage.listContent('translation-batches/');
      const batchFiles = allFiles
        .filter((f) => f.startsWith('translation-batches/') && f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, limit * 2); // Get extra to account for filtering

      const batches = [];
      for (const file of batchFiles) {
        try {
          const metadata = await storage.readContent(file);
          
          // Apply appId filter if provided
          if (appIdFilter) {
            // Skip batches that don't have appIds (old batches) or don't include this app
            if (!metadata.appIds || !metadata.appIds.includes(appIdFilter)) {
              continue;
            }
          }
          
          batches.push({
            batchId: metadata.batchId,
            status: metadata.status,
            sourceLang: metadata.sourceLang,
            targetLangs: metadata.targetLangs,
            totalRequests: metadata.totalRequests,
            filesTranslated: metadata.filesTranslated,
            filesFailed: metadata.filesFailed,
            totalCost: metadata.totalCost,
            model: metadata.model,  // Include model used
            appIds: metadata.appIds,  // Include apps translated
            createdAt: metadata.createdAt,
            completedAt: metadata.completedAt,
          });
          
          // Stop when we have enough results
          if (batches.length >= limit) {
            break;
          }
        } catch (error) {
          logger.warn('Failed to read batch metadata', { file, error });
        }
      }

      return Response.json({ batches }, { status: 200, headers: corsHeaders });
    } catch (error: any) {
      logger.error('Failed to list batches', { error: error.message });
      return Response.json(
        { error: `Failed to list batches: ${error.message}` },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  return Response.json(
    { error: 'Method not allowed' },
    { status: 405, headers: corsHeaders }
  );
}
