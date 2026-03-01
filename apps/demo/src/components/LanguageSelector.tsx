import { useState, useEffect } from 'react';
import { ContentFlowSDK } from '@contentflow/sdk';

const LANGUAGES = [
  { code: 'en-US', label: 'English 🇺🇸' },
  { code: 'es-ES', label: 'Español 🇪🇸' },
  { code: 'fr-FR', label: 'Français 🇫🇷' },
  { code: 'de-DE', label: 'Deutsch 🇩🇪' },
  { code: 'ja-JP', label: '日本語 🇯🇵' },
];

const STORAGE_KEY = 'demo-language';

export function LanguageSelector() {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en-US');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load persisted language on mount
    const config = ContentFlowSDK.getConfig();
    if (config?.language) {
      setCurrentLanguage(config.language);
    }
  }, []);

  const handleLanguageChange = async (langCode: string) => {
    try {
      // Update SDK language
      await ContentFlowSDK.setLanguage(langCode);
      
      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, langCode);
      
      // Update UI
      setCurrentLanguage(langCode);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
      alert('Failed to change language. Please try again.');
    }
  };

  const currentLang = LANGUAGES.find(lang => lang.code === currentLanguage) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 text-sm font-medium"
        aria-label="Select language"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span>{currentLang.label}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 overflow-hidden">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${
                  lang.code === currentLanguage ? 'bg-blue-100 font-medium text-blue-700' : 'text-gray-700'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Get the persisted language from localStorage
 */
export function getPersistedLanguage(): string {
  return localStorage.getItem(STORAGE_KEY) || 'en-US';
}
