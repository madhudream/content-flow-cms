import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchApps } from '../store/appsSlice';
import { selectApp, selectPage } from '../store/uiSlice';

export function Dashboard() {
  const dispatch = useAppDispatch();
  const { apps, status, error } = useAppSelector((state) => state.apps);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchApps());
    }
  }, [dispatch, status]);

  const handleAppClick = (appId: string) => {
    dispatch(selectApp(appId));
    
    // For apps with their own navigation (BWO Tax Forms), auto-select the first page
    if (appId === 'bwo-taxforms') {
      const app = apps.find((a) => a.id === appId);
      if (app && app.pages.length > 0) {
        dispatch(selectPage(app.pages[0].id));
      }
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Loading apps...</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">ContentFlow CMS</h1>
        <p className="text-gray-600 mb-8">Select an application to edit content</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => handleAppClick(app.id)}
              className="group bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-blue-500 relative overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {app.name.charAt(0)}
                  </div>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {app.name}
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-2">{app.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-gray-500 group-hover:text-gray-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {app.pages.length} pages
                  </span>
                  <span className="flex gap-1">
                    {app.supportedLanguages.slice(0, 3).map((lang) => (
                      <span key={lang} className="px-2 py-1 bg-gray-100 group-hover:bg-blue-100 rounded text-xs font-medium text-gray-600 group-hover:text-blue-700 transition-colors">
                        {lang.split('-')[0].toUpperCase()}
                      </span>
                    ))}
                    {app.supportedLanguages.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                        +{app.supportedLanguages.length - 3}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
