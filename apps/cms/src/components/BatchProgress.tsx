import { useState, useEffect, useCallback } from 'react';

interface BatchProgressProps {
  batchId: string;
  onClose?: () => void;
}

interface BatchStatus {
  status: 'validating' | 'in_progress' | 'finalizing' | 'completed' | 'failed' | 'cancelled' | 'expired';
  progress?: {
    total: number;
    completed: number;
    failed: number;
  };
  createdAt: string;
  completedAt?: string;
  totalCost?: number;
  error?: string;
}

const STATUS_LABELS = {
  validating: 'Validating batch...',
  in_progress: 'Translation in progress',
  finalizing: 'Finalizing translations',
  completed: 'Translation completed!',
  failed: 'Translation failed',
  cancelled: 'Translation cancelled',
  expired: 'Batch expired',
};

const STATUS_COLORS = {
  validating: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  finalizing: 'bg-purple-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-500',
  expired: 'bg-orange-500',
};

/**
 * BatchProgress component
 * Shows real-time progress of batch translation jobs
 */
export function BatchProgress({ batchId, onClose }: BatchProgressProps) {
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBatchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/translate/batch/${batchId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch batch status');
      }

      const data = await response.json();
      setBatchStatus(data);
      setError(null);

      // Auto-dismiss after 5 seconds if completed
      if (data.status === 'completed') {
        setTimeout(() => {
          onClose?.();
        }, 5000);
      }

      // Stop polling if batch is in terminal state
      if (['completed', 'failed', 'cancelled', 'expired'].includes(data.status)) {
        return true; // Stop polling
      }

      return false; // Continue polling
    } catch (err) {
      console.error('Failed to fetch batch status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch batch status');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [batchId, onClose]);

  useEffect(() => {
    // Initial fetch
    fetchBatchStatus();

    // Poll every 10 seconds
    const intervalId = setInterval(async () => {
      const shouldStop = await fetchBatchStatus();
      if (shouldStop) {
        clearInterval(intervalId);
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchBatchStatus]);

  if (error && !batchStatus) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-4 max-w-md w-full border border-red-200 z-50">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <h4 className="font-semibold text-gray-900">Translation Error</h4>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (isLoading || !batchStatus) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-4 max-w-md w-full border border-gray-200 z-50">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-gray-600">Loading batch status...</span>
        </div>
      </div>
    );
  }

  const { status, progress, totalCost } = batchStatus;
  const statusLabel = STATUS_LABELS[status] || status;
  const statusColor = STATUS_COLORS[status] || 'bg-gray-500';
  const progressPercent = progress ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-4 max-w-md w-full border border-gray-200 z-50 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${statusColor} ${status === 'in_progress' ? 'animate-pulse' : ''}`}></div>
          <h4 className="font-semibold text-gray-900">{statusLabel}</h4>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Batch ID */}
      <p className="text-xs text-gray-500 mb-3 font-mono">
        Batch: {batchId.substring(0, 20)}...
      </p>

      {/* Progress Bar */}
      {progress && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-700">
              Translating {progress.completed}/{progress.total} requests
            </span>
            <span className="text-sm font-semibold text-gray-900">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          {progress.failed > 0 && (
            <p className="text-xs text-red-600 mt-1">
              {progress.failed} request{progress.failed !== 1 ? 's' : ''} failed
            </p>
          )}
        </div>
      )}

      {/* Cost */}
      {totalCost !== undefined && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700 font-medium">Total Cost</p>
          <p className="text-xl font-bold text-blue-900">${totalCost.toFixed(4)}</p>
        </div>
      )}

      {/* Error message */}
      {batchStatus.error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-700">{batchStatus.error}</p>
        </div>
      )}

      {/* Auto-dismiss notice for completed batches */}
      {status === 'completed' && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          Auto-closing in 5 seconds...
        </p>
      )}
    </div>
  );
}
