// CMS Mode Service - Enables click-to-edit functionality when app is loaded in CMS iframe

export function enableCMSMode() {
  console.log('[CMS Mode] Enabled');
  
  // Inject CSS styles for editable elements
  injectCMSStyles();
  
  // Send acknowledgment to CMS
  window.parent.postMessage({ type: 'CONTENTFLOW_CMS_ACK' }, '*');
  
  // Enable click handlers for content elements
  enableContentClickHandlers();
  
  // Listen for preview updates from CMS
  window.addEventListener('message', handlePreviewUpdate);
}

function injectCMSStyles() {
  const styleId = 'cms-mode-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    [data-content-id] {
      cursor: pointer !important;
      outline: 2px solid transparent;
      transition: all 0.2s ease-in-out;
      position: relative;
      user-select: none;
    }
    
    [data-content-id]:hover {
      outline-color: rgba(59, 130, 246, 0.5);
      background-color: rgba(59, 130, 246, 0.05);
      transform: scale(1.01);
    }
    
    [data-content-id]:hover::before {
      content: "✏️";
      position: absolute;
      top: -8px;
      right: -8px;
      width: 24px;
      height: 24px;
      background: rgb(59, 130, 246);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      z-index: 1000;
    }
    
    [data-content-id].cms-selected {
      outline-color: rgb(59, 130, 246) !important;
      outline-width: 3px;
      background-color: rgba(59, 130, 246, 0.1);
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
    }
  `;
  
  document.head.appendChild(style);
}

function enableContentClickHandlers() {
  let selectedElement: HTMLElement | null = null;
  
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const contentElement = target.closest('[data-content-id]') as HTMLElement;
    
    if (contentElement) {
      event.preventDefault();
      event.stopPropagation();
      
      // Remove previous selection
      if (selectedElement) {
        selectedElement.classList.remove('cms-selected');
      }
      
      // Add new selection
      contentElement.classList.add('cms-selected');
      selectedElement = contentElement;
      
      const contentId = contentElement.getAttribute('data-content-id');
      const currentValue = contentElement.textContent || '';
      
      // Notify CMS about the clicked content
      window.parent.postMessage(
        {
          type: 'CONTENTFLOW_CONTENT_CLICK',
          contentId,
          currentValue,
        },
        '*'
      );
    }
  }, true);
}

function handlePreviewUpdate(event: MessageEvent) {
  if (event.data?.type === 'CONTENTFLOW_PREVIEW_UPDATE') {
    const { contentId, newValue } = event.data;
    
    // Find and update the target element
    const element = document.querySelector(`[data-content-id="${contentId}"]`);
    if (element) {
      element.textContent = newValue;
    }
  }
}
