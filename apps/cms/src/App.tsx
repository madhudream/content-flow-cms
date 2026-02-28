import { useAppDispatch, useAppSelector } from './store/hooks';
import { selectApp } from './store/uiSlice';
import { Dashboard } from './components/Dashboard';
import { PageSelector } from './components/PageSelector';
import { PreviewPanel } from './components/PreviewPanel';
import { EditorPanel } from './components/EditorPanel';
import { LanguageSwitcher } from './components/LanguageSwitcher';

function App() {
  const dispatch = useAppDispatch();
  const { selectedAppId } = useAppSelector((state) => state.ui);
  const { apps } = useAppSelector((state) => state.apps);

  // Show Dashboard when no app is selected
  if (!selectedAppId) {
    return <Dashboard />;
  }

  // Find current app name for header
  const currentApp = apps.find((app) => app.id === selectedAppId);
  
  // Hide page selector for apps with their own navigation (e.g., BWO Tax Forms)
  const showPageSelector = selectedAppId !== 'bwo-taxforms';

  const openInNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  // Show three-column layout when app is selected
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => dispatch(selectApp(''))}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">Back to Apps</span>
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-lg font-semibold text-gray-900">{currentApp?.name || 'ContentFlow CMS'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={openInNewTab}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 text-sm font-medium"
            title="Open in new tab"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>Open</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {showPageSelector && <PageSelector />}
        <PreviewPanel />
        <EditorPanel />
      </div>
    </div>
  );
}

export default App;
