/**
 * CMS Mode support for BWO Tax Forms
 * Handles postMessage communication with CMS parent window
 */

interface CMSInitMessage {
  type: 'CONTENTFLOW_CMS_INIT';
}

interface ContentClickMessage {
  type: 'CONTENTFLOW_CONTENT_CLICK';
  contentId: string;
  currentValue: string;
  elementType: 'text' | 'image';
}

interface PreviewUpdateMessage {
  type: 'CONTENTFLOW_PREVIEW_UPDATE';
  contentId: string;
  newValue: string;
}

/**
 * Initialize CMS mode when app is loaded in iframe with ?cms-mode=true
 */
export function initCMSMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const isCMSMode = urlParams.get('cms-mode') === 'true';

  if (!isCMSMode || window === window.parent) {
    return; // Not in CMS mode or not in iframe
  }

  console.log('[BWO Tax Forms] CMS mode enabled');

  // Listen for CMS initialization
  window.addEventListener('message', handleCMSMessage);

  // Wait for CMS_INIT message before enabling click handlers
  const initTimeout = setTimeout(() => {
    console.warn('[BWO Tax Forms] CMS initialization timeout - enabling anyway');
    enableContentClickHandlers();
  }, 3000);

  function handleCMSMessage(event: MessageEvent) {
    const message = event.data;

    if (message.type === 'CONTENTFLOW_CMS_INIT') {
      clearTimeout(initTimeout);
      console.log('[BWO Tax Forms] Received CMS_INIT');

      // Send acknowledgment
      window.parent.postMessage(
        { type: 'CONTENTFLOW_CMS_ACK' },
        '*'
      );

      // Enable click handlers
      enableContentClickHandlers();
    } else if (message.type === 'CONTENTFLOW_PREVIEW_UPDATE') {
      // Handle live preview updates
      handlePreviewUpdate(message);
    }
  }
}

/**
 * Add click handlers to all elements with data-content-id
 */
function enableContentClickHandlers() {
  // Inject CMS mode styles
  injectCMSStyles();

  // Track currently selected element
  let selectedElement: HTMLElement | null = null;

  // Use event delegation on document body
  document.body.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const contentElement = target.closest('[data-content-id]') as HTMLElement;

    if (!contentElement) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const contentId = contentElement.getAttribute('data-content-id');
    if (!contentId) {
      return;
    }

    // Remove previous selection
    if (selectedElement) {
      selectedElement.classList.remove('cms-selected');
    }

    // Add selection to current element
    contentElement.classList.add('cms-selected');
    selectedElement = contentElement;

    const elementType = contentElement.tagName.toLowerCase() === 'img' ? 'image' : 'text';
    const currentValue =
      elementType === 'image'
        ? (contentElement as HTMLImageElement).src
        : contentElement.textContent || '';

    // Send click event to CMS parent
    const message: ContentClickMessage = {
      type: 'CONTENTFLOW_CONTENT_CLICK',
      contentId,
      currentValue,
      elementType,
    };

    window.parent.postMessage(message, '*');
    console.log('[BWO Tax Forms] Content clicked:', contentId);
  });

  console.log('[BWO Tax Forms] Click handlers enabled');
}

/**
 * Inject CSS styles for CMS mode visual feedback
 */
function injectCMSStyles() {
  const styleId = 'cms-mode-styles';
  
  // Don't inject if already exists
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* CMS Mode: Make editable elements stand out */
    [data-content-id] {
      cursor: pointer !important;
      position: relative;
      transition: all 0.2s ease-in-out;
      outline: 2px solid transparent;
      outline-offset: 2px;
    }

    /* Hover effect - subtle highlight */
    [data-content-id]:hover {
      outline-color: rgba(59, 130, 246, 0.5) !important;
      background-color: rgba(59, 130, 246, 0.05) !important;
      transform: scale(1.01);
    }

    /* Active/Selected state - stronger highlight */
    [data-content-id].cms-selected {
      outline-color: rgb(59, 130, 246) !important;
      outline-width: 3px !important;
      background-color: rgba(59, 130, 246, 0.1) !important;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    /* Add a small edit icon on hover */
    [data-content-id]:hover::before {
      content: "✏️";
      position: absolute;
      top: -8px;
      right: -8px;
      background: rgb(59, 130, 246);
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    /* Special handling for images */
    img[data-content-id] {
      border-radius: 4px;
    }

    img[data-content-id]:hover {
      filter: brightness(1.1);
    }

    /* Disable text selection for better UX */
    [data-content-id] {
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
  `;

  document.head.appendChild(style);
  console.log('[BWO Tax Forms] CMS styles injected');
}

/**
 * Handle live preview updates from CMS
 */
function handlePreviewUpdate(message: PreviewUpdateMessage) {
  const { contentId, newValue } = message;
  
  // Find all elements with this content ID
  const elements = document.querySelectorAll(`[data-content-id="${contentId}"]`);
  
  elements.forEach((element) => {
    if (element.tagName.toLowerCase() === 'img') {
      // Update image src
      (element as HTMLImageElement).src = newValue;
    } else {
      // Update text content
      element.textContent = newValue;
    }
  });
  
  console.log('[BWO Tax Forms] Preview updated:', contentId, newValue);
}
