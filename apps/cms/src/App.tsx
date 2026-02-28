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
        <LanguageSwitcher />
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
