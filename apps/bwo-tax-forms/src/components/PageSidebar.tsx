import { Link, useLocation } from 'react-router-dom';
import { LanguageSelector } from './LanguageSelector';

interface PageInfo {
  id: string;
  name: string;
  path: string;
}

const pages: PageInfo[] = [
  { id: 'home', name: 'Getting Started', path: '/' },
  { id: 'personal-info', name: 'Personal Information', path: '/personal-info' },
  { id: 'income', name: 'Income Details', path: '/income' },
];

/**
 * PageSidebar component - Navigation for BWO Tax Forms pages
 */
export function PageSidebar() {
  const location = useLocation();

  const openInNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-6 flex flex-col">
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900">BWO Tax Forms</h2>
        <p className="text-sm text-gray-600 mt-1">Form Sections</p>
      </div>

      <nav>
        <ul className="space-y-2">
          {pages.map((page, index) => {
            const isActive = location.pathname === page.path;
            
            return (
              <li key={page.id}>
                <Link
                  to={page.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <div
                    className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                      ${isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}
                  >
                    {index + 1}
                  </div>
                  <span className="flex-1">{page.name}</span>
                  
                  {isActive && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto space-y-3">
        <LanguageSelector />
        
        <button
          onClick={openInNewTab}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
          title="Open in new tab"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span>Open in New Tab</span>
        </button>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> All form labels can be edited in the CMS
          </p>
        </div>
      </div>
    </aside>
  );
}
