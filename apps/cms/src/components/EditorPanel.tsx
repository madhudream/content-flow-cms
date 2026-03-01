import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateDirtyContent, clearDirtyContent, saveContent, resetSaveStatus } from '../store/contentSlice';
import { closeEditor } from '../store/uiSlice';
import { ImagePicker } from './ImagePicker';

export function EditorPanel() {
  const dispatch = useAppDispatch();
  const { selectedAppId, selectedPageId, selectedLanguage, selectedContentId, editorPanelOpen, elementType } = useAppSelector((state) => state.ui);
  const { contentCache, dirtyContent, saveStatus, error } = useAppSelector((state) => state.content);
  
  const [localValue, setLocalValue] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contentKey = selectedAppId && selectedPageId && selectedLanguage
    ? `${selectedAppId}-${selectedPageId}-${selectedLanguage}`
    : null;

  const currentContent = contentKey ? contentCache[contentKey] : {};
  const originalValue = selectedContentId ? (currentContent?.[selectedContentId] || '') : '';
  const hasDirtyContent = Object.keys(dirtyContent).length > 0;

  // Update local value when selected content changes
  useEffect(() => {
    if (selectedContentId) {
      const dirty = dirtyContent[selectedContentId];
      setLocalValue(dirty !== undefined ? dirty : originalValue);
    }
  }, [selectedContentId, originalValue, dirtyContent]);

  // Debounced update to Redux store
  useEffect(() => {
    if (!selectedContentId) return;

    const timeoutId = setTimeout(() => {
      if (localValue !== originalValue) {
        dispatch(updateDirtyContent({ contentId: selectedContentId, value: localValue }));
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localValue, selectedContentId, originalValue, dispatch]);

  // Handle save success notification
  useEffect(() => {
    if (saveStatus === 'success') {
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        dispatch(resetSaveStatus());
      }, 2000);
    }
  }, [saveStatus, dispatch]);

  const handleSave = useCallback(() => {
    dispatch(saveContent());
  }, [dispatch]);

  const handleDiscard = useCallback(() => {
    setLocalValue(originalValue);
    dispatch(clearDirtyContent());
  }, [originalValue, dispatch]);

  const handleClose = useCallback(() => {
    dispatch(closeEditor());
  }, [dispatch]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAppId || !selectedContentId) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only JPEG, PNG, GIF, SVG, and WebP images are allowed.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 5MB.');
      return;
    }

    setUploadStatus('uploading');
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('appId', selectedAppId);
      formData.append('contentId', selectedContentId);

      const response = await fetch('/api/images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      const imagePath = data.path; // Path is already relative/absolute from server

      // Update local value and dirty content
      setLocalValue(imagePath);
      dispatch(updateDirtyContent({ contentId: selectedContentId, value: imagePath }));

      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setUploadStatus('error');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageSelected = useCallback((imageUrl: string) => {
    if (!selectedContentId) return;
    
    setLocalValue(imageUrl);
    dispatch(updateDirtyContent({ contentId: selectedContentId, value: imageUrl }));
    setImagePickerOpen(false);
  }, [selectedContentId, dispatch]);

  const isImageType = elementType === 'image';

  if (!editorPanelOpen || !selectedContentId) {
    return null;
  }

  return (
    <aside className={`
      w-96 bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 flex flex-col shadow-2xl
      transition-transform duration-300 ease-out
      ${editorPanelOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      {/* Header */}
      <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-lg">Edit Content</h3>
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

      {/* Content ID Label */}
      <div className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Content ID
        </label>
        <code className="block text-sm text-gray-800 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm font-mono">
          {selectedContentId}
        </code>
      </div>

      {/* Editor Textarea or Image Upload */}
      <div className="flex-1 p-5 flex flex-col">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
          {isImageType ? 'Image Content' : 'Text Content'}
        </label>
        
        {isImageType ? (
          <div className="space-y-4">
            {/* Current Image Preview */}
            {localValue && (
              <div className="relative rounded-lg border-2 border-gray-200 overflow-hidden">
                <img 
                  src={localValue} 
                  alt="Current content" 
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" font-size="14" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  Current
                </div>
              </div>
            )}

            {/* Select from Gallery Button */}
            <button
              onClick={() => setImagePickerOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Select from Gallery
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 font-medium">or upload new</span>
              </div>
            </div>

            {/* File Upload Area */}
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/svg+xml,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              
              {uploadStatus === 'uploading' ? (
                <p className="text-sm text-gray-600">Uploading...</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    JPEG, PNG, GIF, SVG, WebP (max 5MB)
                  </p>
                </>
              )}
            </div>

            {/* Upload Success */}
            {uploadStatus === 'success' && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-3 flex items-center gap-3 text-sm text-green-800">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Image uploaded successfully!</span>
              </div>
            )}

            {/* Upload Error */}
            {uploadError && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-center gap-3 text-sm text-red-800">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{uploadError}</span>
              </div>
            )}

            {/* Image URL Input */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Or enter image URL directly:
              </label>
              <input
                type="url"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        ) : (
          <textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="flex-1 w-full p-4 border-2 border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:border-gray-300"
            placeholder="Enter text content..."
          />
        )}
        
        {/* Character/URL count */}
        <div className="flex items-center gap-2 mt-3">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-xs text-gray-500 font-medium">
            {localValue.length} characters
          </p>
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
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-md hover:-translate-y-0.5'
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

      {/* ImagePicker Modal */}
      <ImagePicker
        isOpen={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onSelect={handleImageSelected}
      />
    </aside>
  );
}
