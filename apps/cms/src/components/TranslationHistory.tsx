import { useState, useEffect } from 'react';
import { BatchProgress } from './BatchProgress';

interface BatchInfo {
  batchId: string;
  status: 'validating' | 'in_progress' | 'finalizing' | 'completed' | 'failed' | 'cancelled' | 'expired';
  sourceLang?: string;
  targetLangs?: string[];
  totalRequests?: number;
  progress?: {
    total: number;
    completed: number;
    failed: number;
  };
  createdAt: string;
  completedAt?: string;
  totalCost?: number;
  filesTranslated?: number;
  appIds?: string[];  // Apps translated in this batch
  model?: string;  // Model used for translation
}

interface CostEntry {
  batchId: string;
  timestamp: string;
  sourceLang?: string;
  targetLang?: string;
  targetLangs?: string[];
  inputTokens: number;
  outputTokens: number;
  cost: number;
  costPerFile: number;
  filesTranslated: number;
  appIds?: string[];  // Apps included in this cost entry
}

interface CostSummary {
  totalCost: number;
  totalFilesTranslated: number;
  totalBatches: number;
  avgPerBatch: number;
  thisMonth?: number;
  lastMonth?: number;
}

const STATUS_COLORS = {
  validating: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  finalizing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  expired: 'bg-orange-100 text-orange-800',
};

const STATUS_LABELS = {
  validating: 'Validating',
  in_progress: 'In Progress',
  finalizing: 'Finalizing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

interface TranslationHistoryProps {
  onClose: () => void;
  isPage?: boolean; // If true, don't render modal backdrop
  appId?: string; // Optional - filter by specific app
}

/**
 * TranslationHistory component
 * Shows all translation batches, their status, progress, and cost breakdown
 */
export function TranslationHistory({ onClose, isPage = false, appId }: TranslationHistoryProps) {
  console.log('🎯 TranslationHistory component mounted! isPage:', isPage, 'appId:', appId);
  
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'batches' | 'costs'>('batches');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query params with optional appId filter
      const queryParams = new URLSearchParams();
      queryParams.set('limit', '20');
      if (appId) {
        queryParams.set('appId', appId);
      }

      // Fetch batches
      const batchesResponse = await fetch(`/api/translate/batches?${queryParams}`);
      if (batchesResponse.ok) {
        const batchesData = await batchesResponse.json();
        setBatches(batchesData.batches || []);
      } else {
        console.warn('Failed to fetch batches:', batchesResponse.status);
      }

      // Fetch cost summary
      const summaryParams = new URLSearchParams();
      if (appId) {
        summaryParams.set('appId', appId);
      }
      const summaryResponse = await fetch(`/api/costs/summary?${summaryParams}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);
      } else {
        console.warn('Failed to fetch summary:', summaryResponse.status);
      }

      // Fetch cost history
      const costParams = new URLSearchParams();
      costParams.set('limit', '20');
      if (appId) {
        costParams.set('appId', appId);
      }
      const costResponse = await fetch(`/api/costs/history?${costParams}`);
      if (costResponse.ok) {
        const costData = await costResponse.json();
        // API returns { costs: [...] } not { entries: [...] }
        setCostEntries(costData.costs || costData.entries || []);
      } else {
        console.warn('Failed to fetch cost history:', costResponse.status);
      }
    } catch (err) {
      console.error('Failed to fetch translation history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh every 15 seconds if there are active batches
    const intervalId = setInterval(() => {
      const hasActiveBatches = batches.some(b => 
        ['validating', 'in_progress', 'finalizing'].includes(b.status)
      );
      if (hasActiveBatches) {
        fetchData();
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, []); // Remove batches.length dependency to prevent infinite loop

  const getProgressPercent = (batch: BatchInfo): number => {
    if (!batch.progress || !batch.progress.total) return 0;
    return Math.round((batch.progress.completed / batch.progress.total) * 100);
  };

  const getRequestsDisplayText = (batch: BatchInfo): string => {
    if (batch.progress) {
      return `${batch.progress.completed}/${batch.progress.total} requests`;
    }
    if (batch.totalRequests) {
      return `${batch.totalRequests} requests`;
    }
    return 'N/A';
  };

  console.log('📊 Rendering modal with:', { batchesCount: batches.length, isLoading, error });

  // Main content component (can be rendered as page or in modal)
  const content = (
    <>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <h2 className="text-xl font-bold">Translation History & Analytics</h2>
          </div>
          {!isPage && (
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium text-gray-600">Total Cost</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">${(summary.totalCost || 0).toFixed(4)}</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs font-medium text-gray-600">Translations</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.totalFilesTranslated.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <span className="text-xs font-medium text-gray-600">Batches</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.totalBatches || 0}</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium text-gray-600">Avg/Batch</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">${summary.avgPerBatch.toFixed(4)}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-white">
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'batches'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Translation Batches
          </button>
          <button
            onClick={() => setActiveTab('costs')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'costs'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Cost Breakdown
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && batches.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-600">Loading history...</span>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium">Error loading data</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          ) : activeTab === 'batches' ? (
            <>
              {batches.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <p className="text-gray-600 font-medium text-lg">No translation batches yet</p>
                  <p className="text-gray-500 text-sm mt-2">Click "Translate All" to start your first batch</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {batches.map((batch) => (
                    <div
                      key={batch.batchId}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[batch.status]}`}>
                              {STATUS_LABELS[batch.status]}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(batch.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-gray-600 mb-3">
                            Batch ID: {batch.batchId.substring(0, 30)}...
                          </p>

                          {/* Progress Bar or Request Count */}
                          <div className="mb-3">
                            {batch.progress ? (
                              <>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-gray-700">
                                    {getRequestsDisplayText(batch)}
                                  </span>
                                  <span className="text-xs font-semibold text-gray-900">
                                    {getProgressPercent(batch)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      batch.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${getProgressPercent(batch)}%` }}
                                  ></div>
                                </div>
                                {batch.progress.failed > 0 && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {batch.progress.failed} failed
                                  </p>
                                )}
                              </>
                            ) : (
                              <div className="text-xs text-gray-600">
                                {getRequestsDisplayText(batch)}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            {batch.sourceLang && (
                              <span className="text-gray-600 text-xs">
                                🌐 {batch.sourceLang} → {batch.targetLangs?.length || 0} languages
                              </span>
                            )}
                            {batch.filesTranslated !== undefined && batch.filesTranslated > 0 && (
                              <span className="text-gray-600 text-xs">
                                📄 {batch.filesTranslated} files
                              </span>
                            )}
                            {batch.model && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                🤖 {batch.model}
                              </span>
                            )}
                            {batch.appIds && batch.appIds.length > 0 && (
                              <span className="text-gray-600 text-xs">
                                📱 {batch.appIds.join(', ')}
                              </span>
                            )}
                            {batch.totalCost !== undefined && batch.totalCost > 0 && (
                              <span className="text-gray-900 font-semibold text-xs">
                                💰 ${(batch.totalCost || 0).toFixed(4)}
                              </span>
                            )}
                            {batch.completedAt && (
                              <span className="text-gray-500 text-xs">
                                ✓ Finished: {new Date(batch.completedAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedBatchId(batch.batchId)}
                          className="ml-4 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Cost Breakdown Tab
            <>
              {costEntries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No cost data available yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Languages</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Files</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Input Tokens</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Output Tokens</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {costEntries.map((entry, index) => (
                        <tr key={`${entry.batchId}-${index}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600 whitespace-nowrap">
                            {entry.batchId.substring(0, 16)}...
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {entry.sourceLang && entry.targetLang ? (
                              <>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {entry.sourceLang}
                                </span>
                                <span className="mx-1">→</span>
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                  {entry.targetLang}
                                </span>
                              </>
                            ) : entry.targetLangs && entry.targetLangs.length > 0 ? (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                {entry.targetLangs.length} languages
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{entry.filesTranslated || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{(entry.inputTokens || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{(entry.outputTokens || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                            ${(entry.cost || 0).toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
          {!isPage && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Batch Progress Detail Modal */}
      {selectedBatchId && (
        <BatchProgress
          batchId={selectedBatchId}
          onClose={() => setSelectedBatchId(null)}
        />
      )}
    </>
  );

  // If page mode, render content directly
  if (isPage) {
    return content;
  }

  // If modal mode, wrap in fixed overlay
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        console.log('🖱️ Backdrop clicked');
        // Close modal if clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {content}
    </div>
  );
}
