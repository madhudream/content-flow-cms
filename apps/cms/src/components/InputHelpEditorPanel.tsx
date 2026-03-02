import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { closeInputHelpEditor } from '../store/uiSlice';
import { updateInputHelpContent, saveInputHelp } from '../store/contentSlice';

interface InputHelpContent {
  enabled: boolean;
  message: string;
  iconType: 'info' | 'exclamation';
}

export function InputHelpEditorPanel() {
  const dispatch = useAppDispatch();
  const { selectedAppId, selectedPageId, selectedLanguage, selectedInputHelpId, inputHelpEditorOpen } = useAppSelector((state) => state.ui);
  const { inputHelpCache, dirtyInputHelp, saveStatus, error } = useAppSelector((state) => state.content);
  
  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState('');
  const [iconType, setIconType] = useState<'info' | 'exclamation'>('info');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const contentKey = selectedAppId && selectedPageId && selectedLanguage
    ? `${selectedAppId}-${selectedPageId}-${selectedLanguage}`
    : null;

  const currentInputHelp = contentKey && selectedInputHelpId 
    ? (inputHelpCache[contentKey]?.[selectedInputHelpId] as InputHelpContent)
    : null;

  // Load current values when selectedInputHelpId changes
  useEffect(() => {
    if (selectedInputHelpId && currentInputHelp) {
      setEnabled(currentInputHelp.enabled ?? true);
      setMessage(currentInputHelp.message ?? '');
      setIconType(currentInputHelp.iconType ?? 'info');
    } else if (selectedInputHelpId) {
      // New input help - use defaults
      setEnabled(true);
      setMessage('');
      setIconType('info');
    }
  }, [selectedInputHelpId, currentInputHelp]);

  // Debounced update to Redux store (only if there's actual content)
  useEffect(() => {
    if (!selectedInputHelpId) return;

    const timeoutId = setTimeout(() => {
      const newValue: InputHelpContent = { enabled, message, iconType };
      const hasChanged = 
        enabled !== currentInputHelp?.enabled ||
        message !== currentInputHelp?.message ||
        iconType !== currentInputHelp?.iconType;
      
      // Only update if there's actual content OR it exists in cache
      // Don't save empty/default state for unconfigured input helps
      const hasContent = message.trim().length > 0 || currentInputHelp;
      
      if (hasChanged && hasContent) {
        dispatch(updateInputHelpContent({ inputHelpId: selectedInputHelpId, value: newValue }));
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [enabled, message, iconType, selectedInputHelpId, currentInputHelp, dispatch]);

  // Handle save success notification
  useEffect(() => {
    if (saveStatus === 'success') {
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
    }
  }, [saveStatus]);

  const handleSave = useCallback(() => {
    dispatch(saveInputHelp());
  }, [dispatch]);

  const handleDiscard = useCallback(() => {
    if (currentInputHelp) {
      setEnabled(currentInputHelp.enabled);
      setMessage(currentInputHelp.message);
      setIconType(currentInputHelp.iconType);
    } else {
      setEnabled(true);
      setMessage('');
      setIconType('info');
    }
  }, [currentInputHelp]);

  const handleClose = useCallback(() => {
    dispatch(closeInputHelpEditor());
  }, [dispatch]);

  const hasDirtyContent = Object.keys(dirtyInputHelp).length > 0;

  if (!inputHelpEditorOpen || !selectedInputHelpId) {
    return null;
  }

  return (
    <aside className={`
      w-96 bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 flex flex-col shadow-2xl
      transition-transform duration-300 ease-out
      ${inputHelpEditorOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      {/* Header */}
      <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-lg">Input Help Config</h3>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200 hover:rotate-90"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Input Help ID Label */}
      <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Input Help ID
        </label>
        <code className="block text-sm text-gray-800 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm font-mono">
          {selectedInputHelpId}
        </code>
      </div>

      {/* Configuration Form */}
      <div className="flex-1 p-5 flex flex-col space-y-5 overflow-y-auto">
        {/* Enable Toggle */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-sm font-semibold text-gray-700">
              Enable help icon
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-8">
            Show the help icon next to the input field
          </p>
        </div>

        {/* Icon Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Icon Type
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
              <input
                type="radio"
                name="iconType"
                value="info"
                checked={iconType === 'info'}
                onChange={(e) => setIconType(e.target.value as 'info')}
                className="w-4 h-4 text-blue-600"
              />
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Info (ℹ️) - Helpful guidance</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 hover:border-amber-300 transition-colors">
              <input
                type="radio"
                name="iconType"
                value="exclamation"
                checked={iconType === 'exclamation'}
                onChange={(e) => setIconType(e.target.value as 'exclamation')}
                className="w-4 h-4 text-amber-600"
              />
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Warning (⚠️) - Important note</span>
            </label>
          </div>
        </div>

        {/* Help Message */}
        <div className="flex-1 flex flex-col">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Help Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 w-full p-4 border-2 border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm hover:border-gray-300"
            placeholder="Enter helpful message to show users..."
            rows={6}
          />
          
          {/* Character count */}
          <div className="flex items-center gap-2 mt-3">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs text-gray-500 font-medium">
              {message.length} characters
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-5 border-t border-gray-200 space-y-3 bg-white">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg p-3 flex items-center gap-3 animate-[fadeIn_0.3s] shadow-sm">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium text-green-800">Saved successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {saveStatus === 'error' && error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-300 rounded-lg p-3 flex items-center gap-3 animate-[fadeIn_0.3s] shadow-sm">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!hasDirtyContent || saveStatus === 'saving'}
            className={`
              group flex-1 px-5 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm
              ${
                !hasDirtyContent || saveStatus === 'saving'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 hover:shadow-md hover:-translate-y-0.5'
              }
            `}
          >
            {saveStatus === 'saving' ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
          
          <button
            onClick={handleDiscard}
            disabled={!hasDirtyContent}
            className={`
              px-5 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm
              ${
                !hasDirtyContent
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:-translate-y-0.5'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Discard
          </button>
        </div>
      </div>
    </aside>
  );
}
