import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectPage } from '../store/uiSlice';

export function PageSelector() {
  const dispatch = useAppDispatch();
  const { apps } = useAppSelector((state) => state.apps);
  const { selectedAppId, selectedPageId } = useAppSelector((state) => state.ui);

  const selectedApp = apps.find((app) => app.id === selectedAppId);

  if (!selectedApp) {
    return null;
  }

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 flex flex-col shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">{selectedApp.name}</h2>
        <p className="text-sm text-gray-500 mt-1">Select a page to edit</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {selectedApp.pages.map((page) => {
            const isSelected = selectedPageId === page.id;
            return (
              <li key={page.id}>
                <button
                  onClick={() => dispatch(selectPage(page.id))}
                  className={`
                    group w-full text-left px-4 py-3 rounded-lg transition-all duration-200 relative overflow-hidden
                    ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    }
                  `}
                >
                  {/* Hover gradient effect for non-selected items */}
                  {!isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
                  )}
                  
                  <div className="relative flex items-center gap-3">
                    <svg 
                      className={`w-5 h-5 transition-transform duration-200 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'} group-hover:scale-110`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">{page.name}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
