import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

interface TranslateAllButtonProps {
  onBatchStarted?: (batchId: string) => void;
}

/**
 * TranslateAllButton component
 * Triggers bulk translation for all apps or selected app
 */
export function TranslateAllButton({ onBatchStarted }: TranslateAllButtonProps) {
  const navigate = useNavigate();
  const { selectedAppId, selectedLanguage } = useAppSelector((state) => state.ui);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    
    // Estimate cost based on historical average
    try {
      setIsLoading(true);
      
      // Fetch cost summary to get average cost per batch
      try {
        const summaryResponse = await fetch('/api/costs/summary');
        if (summaryResponse.ok) {
          const summary = await summaryResponse.json();
          // Use historical average if available, otherwise use a conservative estimate
          const estimate = summary.avgPerBatch > 0 ? summary.avgPerBatch : 0.001;
          setEstimatedCost(estimate);
        } else {
          // Fallback to conservative estimate if API fails
          setEstimatedCost(0.001);
        }
      } catch (err) {
        console.warn('Failed to fetch cost summary, using default estimate:', err);
        setEstimatedCost(0.001);
      }
      
      setShowConfirm(true);
    } catch (err) {
      setError('Failed to estimate cost. Please try again.');
      console.error('Cost estimation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    setError(null);
    setShowConfirm(false);
    
    try {
      setIsLoading(true);
      
      const requestBody = {
        sourceLang: selectedLanguage,
        targetLangs: ['es-ES', 'fr-FR', 'de-DE', 'ja-JP'].filter(lang => lang !== selectedLanguage),
        appIds: selectedAppId ? [selectedAppId] : undefined, // Translate all apps if none selected
      };

      const response = await fetch('/api/translate/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start bulk translation');
      }

      const data = await response.json();
      
      // Navigate to history page to see progress
      navigate('/history');
      
      // Notify parent component
      if (onBatchStarted) {
        onBatchStarted(data.batchId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start translation';
      setError(errorMessage);
      console.error('Bulk translation error:', err);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        title={selectedAppId ? `Translate ${selectedAppId} app to multiple languages` : "Translate all apps to multiple languages"}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          selectedAppId ? `Translate ${selectedAppId}` : 'Translate All Apps'
        )}
      </button>

      <button
        onClick={() => navigate('/history')}
        className="flex items-center gap-2 px-4 py-1.5 bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
        title="View translation history and analytics"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        View History
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Bulk Translation
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedAppId ? (
                <>
                  This will translate <strong className="text-purple-700 font-semibold">{selectedAppId}</strong> app
                </>
              ) : (
                'This will translate all apps'
              )} from <strong>{selectedLanguage}</strong> to{' '}
              {selectedLanguage === 'en-US' ? 'Spanish, French, German, and Japanese' : 'the other available languages'}.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Estimated Cost</p>
                  <p className="text-lg font-bold text-blue-900 mt-1">
                    ${estimatedCost?.toFixed(4) || '0.0000'}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {estimatedCost && estimatedCost > 0.001 
                      ? 'Based on historical average' 
                      : 'Batch API pricing (50% discount)'}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                Confirm & Start
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
