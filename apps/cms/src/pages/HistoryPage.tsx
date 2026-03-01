import { useNavigate } from 'react-router-dom';
import { TranslationHistory } from '../components/TranslationHistory';
import { useAppSelector } from '../store/hooks';

export function HistoryPage() {
  const navigate = useNavigate();
  const selectedAppId = useAppSelector((state) => state.ui.selectedAppId);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header with back button */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Translation History</h1>
          {selectedAppId && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {selectedAppId}
            </span>
          )}
        </div>

        {/* History content without modal wrapper, filtered by selected app */}
        <TranslationHistory 
          onClose={() => navigate(-1)} 
          isPage 
          appId={selectedAppId || undefined}
        />
      </div>
    </div>
  );
}
