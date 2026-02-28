import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchContent } from '../store/contentSlice';
import { openEditor, setViewportMode } from '../store/uiSlice';

interface CMSMessage {
  type: string;
  contentId?: string;
  currentValue?: string;
  newValue?: string;
  elementType?: 'text' | 'image';
}

export function PreviewPanel() {
  const dispatch = useAppDispatch();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ackReceived, setAckReceived] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  const { apps } = useAppSelector((state) => state.apps);
  const { selectedAppId, selectedPageId, selectedLanguage, viewportMode } = useAppSelector((state) => state.ui);
  const { dirtyContent } = useAppSelector((state) => state.content);

  const selectedApp = apps.find((app) => app.id === selectedAppId);
  const selectedPage = selectedApp?.pages.find((page) => page.id === selectedPageId);

  // Fetch content when app/page/language changes
  useEffect(() => {
    if (selectedAppId && selectedPageId && selectedLanguage) {
      dispatch(fetchContent({ appId: selectedAppId, pageId: selectedPageId, lang: selectedLanguage }));
    }
  }, [dispatch, selectedAppId, selectedPageId, selectedLanguage]);

  // Handle iframe load and CMS mode initialization
  useEffect(() => {
    if (!iframeRef.current || !selectedPage) return;

    const handleIframeLoad = () => {
      setAckReceived(false);
      setShowWarning(false);

      // Send INIT message to iframe
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'CONTENTFLOW_CMS_INIT' },
          '*'
        );

        // Set 3-second timeout for ACK
        setTimeout(() => {
          if (!ackReceived) {
            setShowWarning(true);
          }
        }, 3000);
      }, 100);
    };

    iframeRef.current.addEventListener('load', handleIframeLoad);
    return () => iframeRef.current?.removeEventListener('load', handleIframeLoad);
  }, [selectedPage, ackReceived]);

  // Listen for postMessage events from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent<CMSMessage>) => {
      if (!event.data?.type) return;

      switch (event.data.type) {
        case 'CONTENTFLOW_CMS_ACK':
          setAckReceived(true);
          setShowWarning(false);
          break;
        
        case 'CONTENTFLOW_CONTENT_CLICK':
          if (event.data.contentId) {
            dispatch(openEditor({ 
              contentId: event.data.contentId,
              elementType: event.data.elementType || 'text'
            }));
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [dispatch]);

  // Send preview updates to iframe when dirtyContent changes
  useEffect(() => {
    if (!iframeRef.current || !ackReceived) return;

    Object.entries(dirtyContent).forEach(([contentId, newValue]) => {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'CONTENTFLOW_PREVIEW_UPDATE',
          contentId,
          newValue,
        },
        '*'
      );
    });
  }, [dirtyContent, ackReceived]);

  if (!selectedApp || !selectedPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Select a page to preview</p>
      </div>
    );
  }

  const iframeSrc = `http://localhost:${selectedPage.previewPort}${selectedPage.previewPath}?cms-mode=true`;

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <div>
            <h3 className="font-semibold text-gray-900">{selectedPage.name}</h3>
            <p className="text-xs text-gray-500">{selectedLanguage}</p>
          </div>
        </div>
        
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => dispatch(setViewportMode('desktop'))}
            className={`
              group relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2
              ${
                viewportMode === 'desktop'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <svg className={`w-4 h-4 ${viewportMode === 'desktop' ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Desktop
          </button>
          <button
            onClick={() => dispatch(setViewportMode('mobile'))}
            className={`
              group relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2
              ${
                viewportMode === 'mobile'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <svg className={`w-4 h-4 ${viewportMode === 'mobile' ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Mobile
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      {showWarning && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200 px-6 py-3 shadow-sm animate-[fadeIn_0.3s]">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-yellow-800">
              This app does not support CMS mode. Preview only.
            </p>
          </div>
        </div>
      )}

      {/* Preview iframe */}
      <div className="flex-1 overflow-auto p-6 flex justify-center">
        <div
          className={`bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300 ${
            viewportMode === 'mobile' ? 'w-[375px] ring-2 ring-blue-500 ring-opacity-50' : 'w-full'
          }`}
          style={{ height: 'fit-content', minHeight: '100%' }}
        >
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className="w-full h-full border-0"
            style={{ minHeight: '800px' }}
            title={`Preview: ${selectedPage.name}`}
          />
        </div>
      </div>
    </div>
  );
}
