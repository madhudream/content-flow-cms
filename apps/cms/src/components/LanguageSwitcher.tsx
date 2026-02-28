import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setLanguage } from '../store/uiSlice';
import { fetchContent } from '../store/contentSlice';

/**
 * Language switcher dropdown component
 * Shows supported languages for the selected app and triggers content refetch on change
 */
export function LanguageSwitcher() {
  const dispatch = useAppDispatch();
  const { selectedAppId, selectedPageId, selectedLanguage } = useAppSelector((state) => state.ui);
  const { apps } = useAppSelector((state) => state.apps);

  // Find the current app to get supported languages
  const currentApp = apps.find((app) => app.id === selectedAppId);
  const supportedLanguages = currentApp?.supportedLanguages || ['en-US'];

  // Fetch content when language changes
  useEffect(() => {
    if (selectedAppId && selectedPageId) {
      dispatch(fetchContent({
        appId: selectedAppId,
        pageId: selectedPageId,
        lang: selectedLanguage,
      }));
    }
  }, [selectedLanguage, selectedAppId, selectedPageId, dispatch]);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setLanguage(event.target.value));
  };

  // Only show if app is selected and has multiple languages
  if (!selectedAppId || supportedLanguages.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      <select
        value={selectedLanguage}
        onChange={handleLanguageChange}
        className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
    </div>
  );
}
