import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setLanguage } from '../store/uiSlice';
import { fetchContent } from '../store/contentSlice';

const LANGUAGES = [
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'es-ES', label: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', label: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja-JP', label: '日本語', flag: '🇯🇵' },
];

/**
 * Language switcher dropdown component
 * Shows supported languages for the selected app and triggers content refetch on change
 */
export function LanguageSwitcher() {
  const dispatch = useAppDispatch();
  const { selectedAppId, selectedPageId, selectedLanguage } = useAppSelector((state) => state.ui);
  const [isOpen, setIsOpen] = useState(false);

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

  const handleLanguageChange = (langCode: string) => {
    dispatch(setLanguage(langCode));
    setIsOpen(false);
  };

  // Only show if app is selected
  if (!selectedAppId) {
    return null;
  }

  const currentLang = LANGUAGES.find(lang => lang.code === selectedLanguage) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
        aria-label="Select language"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span>{currentLang.flag} {currentLang.label}</span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-20 overflow-hidden border border-gray-200">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                  lang.code === selectedLanguage ? 'bg-blue-100 font-medium text-blue-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1">{lang.label}</span>
                {lang.code === selectedLanguage && (
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
