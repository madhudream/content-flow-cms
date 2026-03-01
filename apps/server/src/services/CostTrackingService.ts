import type { IContentStorage } from './IContentStorage';
import { logger } from '../utils/logger';

/**
 * Cost Entry Structure
 */
export interface CostEntry {
  batchId: string;
  timestamp: string;
  filesTranslated: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  costPerFile: number;
  sourceLang?: string;
  targetLangs?: string[];
  appIds?: string[];
}

/**
 * Cost Summary
 */
export interface CostSummary {
  totalCost: number;
  thisMonth: number;
  lastMonth: number;
  avgPerBatch: number;
  totalBatches: number;
  totalFilesTranslated: number;
}

/**
 * Cost Tracking Service
 * 
 * Manages translation cost tracking and reporting.
 */
export class CostTrackingService {
  private storage: IContentStorage;

  constructor(storage: IContentStorage) {
    this.storage = storage;
    logger.info('CostTrackingService initialized');
  }

  /**
   * Save cost data for a batch
   */
  async saveCostData(costData: CostEntry): Promise<void> {
    logger.info('Saving cost data', {
      batchId: costData.batchId,
      cost: costData.cost,
      filesTranslated: costData.filesTranslated,
    });

    await this.storage.saveCostData(costData);
  }

  /**
   * Get cost summary (all-time and monthly)
   * @param appId - Optional - filter by specific app
   */
  async getCostSummary(appId?: string): Promise<CostSummary> {
    let costs = await this.storage.readCostData();
    
    // Filter by appId if provided
    if (appId) {
      costs = costs.filter((entry) => entry.appIds && entry.appIds.includes(appId));
    }

    if (costs.length === 0) {
      return {
        totalCost: 0,
        thisMonth: 0,
        lastMonth: 0,
        avgPerBatch: 0,
        totalBatches: 0,
        totalFilesTranslated: 0,
      };
    }

    // Calculate totals
    const totalCost = costs.reduce((sum, entry) => sum + (entry.cost || 0), 0);
    const totalFilesTranslated = costs.reduce((sum, entry) => sum + (entry.filesTranslated || 0), 0);
    const avgPerBatch = costs.length > 0 ? totalCost / costs.length : 0;

    // Calculate this month and last month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonth = costs
      .filter((entry) => new Date(entry.timestamp) >= thisMonthStart)
      .reduce((sum, entry) => sum + (entry.cost || 0), 0);

    const lastMonth = costs
      .filter((entry) => {
        const date = new Date(entry.timestamp);
        return date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, entry) => sum + (entry.cost || 0), 0);

    const summary = {
      totalCost: parseFloat(totalCost.toFixed(4)),
      thisMonth: parseFloat(thisMonth.toFixed(4)),
      lastMonth: parseFloat(lastMonth.toFixed(4)),
      avgPerBatch: parseFloat(avgPerBatch.toFixed(4)),
      totalBatches: costs.length,
      totalFilesTranslated,
    };

    logger.debug('Cost summary calculated', { ...summary, appId });

    return summary;
  }

  /**
   * Get cost history with pagination
   * @param limit - Maximum number of entries to return
   * @param appId - Optional - filter by specific app
   */
  async getCostHistory(limit: number = 50, appId?: string): Promise<CostEntry[]> {
    let costs = await this.storage.readCostData();
    
    // Filter by appId if provided
    if (appId) {
      costs = costs.filter((entry) => entry.appIds && entry.appIds.includes(appId));
    }

    // Sort by timestamp (newest first)
    const sorted = costs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply limit
    const limited = sorted.slice(0, limit);

    logger.debug('Cost history retrieved', { total: costs.length, returned: limited.length });

    return limited;
  }

  /**
   * Get cost breakdown by language
   */
  async getCostByLanguage(): Promise<Array<{
    lang: string;
    filesTranslated: number;
    totalCost: number;
    avgCostPerFile: number;
  }>> {
    const costs = await this.storage.readCostData();

    // Group by language
    const byLang = new Map<string, { files: number; cost: number }>();

    for (const entry of costs) {
      if (entry.targetLangs && Array.isArray(entry.targetLangs)) {
        const costPerLang = entry.cost / entry.targetLangs.length;
        const filesPerLang = entry.filesTranslated / entry.targetLangs.length;

        for (const lang of entry.targetLangs) {
          const existing = byLang.get(lang) || { files: 0, cost: 0 };
          byLang.set(lang, {
            files: existing.files + filesPerLang,
            cost: existing.cost + costPerLang,
          });
        }
      }
    }

    // Convert to array
    const result = Array.from(byLang.entries()).map(([lang, data]) => ({
      lang,
      filesTranslated: Math.round(data.files),
      totalCost: parseFloat(data.cost.toFixed(4)),
      avgCostPerFile: data.files > 0 ? parseFloat((data.cost / data.files).toFixed(6)) : 0,
    }));

    // Sort by cost (highest first)
    result.sort((a, b) => b.totalCost - a.totalCost);

    logger.debug('Cost by language calculated', { languages: result.length });

    return result;
  }

  /**
   * Get cost breakdown by app
   */
  async getCostByApp(): Promise<Array<{
    appId: string;
    filesTranslated: number;
    totalCost: number;
    avgCostPerFile: number;
  }>> {
    const costs = await this.storage.readCostData();

    // Group by app
    const byApp = new Map<string, { files: number; cost: number }>();

    for (const entry of costs) {
      if (entry.appIds && Array.isArray(entry.appIds)) {
        const costPerApp = entry.cost / entry.appIds.length;
        const filesPerApp = entry.filesTranslated / entry.appIds.length;

        for (const appId of entry.appIds) {
          const existing = byApp.get(appId) || { files: 0, cost: 0 };
          byApp.set(appId, {
            files: existing.files + filesPerApp,
            cost: existing.cost + costPerApp,
          });
        }
      }
    }

    // Convert to array
    const result = Array.from(byApp.entries()).map(([appId, data]) => ({
      appId,
      filesTranslated: Math.round(data.files),
      totalCost: parseFloat(data.cost.toFixed(4)),
      avgCostPerFile: data.files > 0 ? parseFloat((data.cost / data.files).toFixed(6)) : 0,
    }));

    // Sort by cost (highest first)
    result.sort((a, b) => b.totalCost - a.totalCost);

    logger.debug('Cost by app calculated', { apps: result.length });

    return result;
  }
}
