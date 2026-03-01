import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchApps } from '../store/appsSlice';
import { selectApp, selectPage } from '../store/uiSlice';
import { 
  FileText, 
  Calculator, 
  Users, 
  LayoutDashboard, 
  ArrowRight, 
  Globe, 
  Loader2,
  AlertCircle
} from 'lucide-react';

// Map app IDs to their corresponding icons
const getAppIcon = (appId: string) => {
  const iconMap: Record<string, typeof FileText> = {
    'demo': LayoutDashboard,
    'bwo-taxforms': Calculator,
    'customer-portal': Users,
  };
  return iconMap[appId] || FileText;
};

// Map app IDs to their gradient colors
const getAppGradient = (appId: string) => {
  const gradientMap: Record<string, string> = {
    'demo': 'from-blue-500 via-cyan-500 to-teal-500',
    'bwo-taxforms': 'from-purple-500 via-pink-500 to-rose-500',
    'customer-portal': 'from-orange-500 via-amber-500 to-yellow-500',
  };
  return gradientMap[appId] || 'from-blue-500 via-purple-500 to-pink-500';
};

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Error Loading Apps</h2>
          </div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                <LayoutDashboard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                  ContentFlow CMS
                </h1>
                <p className="text-gray-600 font-medium mt-1">Content Management System</p>
              </div>
            </div>
            <p className="text-lg text-gray-700 max-w-2xl">
              Select an application to start editing content. Each app is powered by the ContentFlow SDK 
              for seamless, real-time content updates.
            </p>
          </div>
          
          {/* Apps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => {
              const Icon = getAppIcon(app.id);
              const gradient = getAppGradient(app.id);
              
              return (
                <button
                  key={app.id}
                  onClick={() => handleAppClick(app.id)}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-left hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-200/50 hover:border-transparent relative overflow-hidden"
                >
                  {/* Animated gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>
                  
                  <div className="relative z-10">
                    {/* Icon and Arrow */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="p-2 bg-gray-100 rounded-full group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-purple-600 transition-all duration-500">
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-500" />
                      </div>
                    </div>
                    
                    {/* App Info */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500">
                      {app.name}
                    </h2>
                    <p className="text-gray-600 mb-6 line-clamp-2 leading-relaxed">
                      {app.description}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 group-hover:bg-blue-50 rounded-lg transition-colors duration-300">
                        <FileText className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                        <span className="font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
                          {app.pages.length} {app.pages.length === 1 ? 'page' : 'pages'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        <div className="flex gap-1">
                          {app.supportedLanguages.slice(0, 2).map((lang) => (
                            <span key={lang} className="px-2 py-1 bg-gray-100 group-hover:bg-purple-100 rounded-md text-xs font-bold text-gray-600 group-hover:text-purple-700 transition-colors uppercase">
                              {lang.split('-')[0]}
                            </span>
                          ))}
                          {app.supportedLanguages.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 group-hover:bg-purple-100 rounded-md text-xs font-bold text-gray-600 group-hover:text-purple-700 transition-colors">
                              +{app.supportedLanguages.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer info */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              💡 Tip: Click any app to start editing. Changes are saved automatically and preview in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
