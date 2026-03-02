import { useContentStore } from '../core/store';

/**
 * InputHelpElement - Web Component for input help icon and tooltip
 * Shows help icon (ℹ️ or ⚠️) with message tooltip
 * Only renders when enabled in metadata
 * Configuration icon (✏️) is handled separately in FormField.tsx for CMS mode
 */
export class InputHelpElement extends HTMLElement {
  private unsubscribe?: () => void;
  private isOpen = false;

  static get observedAttributes() {
    return ['input-help-id', 'position', 'default-icon-type'];
  }

  connectedCallback() {
    const inputHelpId = this.getAttribute('input-help-id') || '';
    
    console.log('[InputHelpElement] ✅ Connected:', inputHelpId);
    
    this.render();
    this.subscribeToStore();
    this.listenForMessages();
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  attributeChangedCallback() {
    this.render();
  }

  private subscribeToStore() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = useContentStore.subscribe(() => {
      this.render();
    });
  }

  private listenForMessages() {
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.data.type === 'CONTENTFLOW_INPUTHELP_UPDATE') {
        const { inputHelpId, helpContent } = event.data;
        if (inputHelpId === this.getAttribute('input-help-id')) {
          // Update store
          if (helpContent) {
            const currentState = useContentStore.getState();
            const updatedInputHelp = { ...currentState.inputHelp, [inputHelpId]: helpContent };
            useContentStore.setState({ inputHelp: updatedInputHelp });
          }
          this.render();
          console.log('[InputHelpElement] 🔄 Updated from CMS:', inputHelpId);
        }
      }
    });
  }

  private render() {
    const inputHelpId = this.getAttribute('input-help-id') || '';
    const position = this.getAttribute('position') || 'right';
    const defaultIconType = this.getAttribute('default-icon-type') || 'info';
    
    this.setAttribute('data-input-help-id', inputHelpId);

    const state = useContentStore.getState();
    const helpContent = state.getInputHelp(inputHelpId);

    // Only render if enabled (this is the help icon, not the config icon)
    if (!helpContent?.enabled) {
      this.innerHTML = '';
      return;
    }

    const message = helpContent?.message || '';
    const iconType = helpContent?.iconType || defaultIconType;

    console.log('[InputHelpElement] 🎨 Rendering help icon:', inputHelpId, { enabled: helpContent?.enabled, iconType });

    // Create shadow DOM
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    // Render content
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .help-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 6px;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          color: white;
          flex-shrink: 0;
        }

        .help-button.info {
          background: linear-gradient(145deg, #3b82f6 0%, #2563eb 100%);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3);
          animation: glow-pulse-blue 2s ease-in-out infinite;
        }

        .help-button.exclamation {
          background: linear-gradient(145deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3);
          animation: glow-pulse-red 2s ease-in-out infinite;
        }

        .help-button:hover {
          transform: scale(1.15);
        }

        /* Help panel */
        .help-panel {
          position: absolute;
          z-index: 10000;
          top: 50%;
          transform: translateY(-50%);
          width: 320px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          opacity: 0;
          animation: fadeIn 0.3s ease forwards;
        }

        .help-panel.right {
          left: calc(100% + 12px);
        }

        .help-panel.left {
          right: calc(100% + 12px);
        }

        .help-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #3b82f6 100%);
        }

        .help-panel.exclamation::before {
          background: linear-gradient(90deg, #ef4444 0%, #f97316 50%, #ef4444 100%);
        }

        .help-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .help-title-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .help-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #3b82f6 0%, #2563eb 100%);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .help-icon-wrapper.exclamation {
          width: 56px;
          height: 56px;
          background: linear-gradient(145deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
          animation: pulse-attention 2s ease-in-out infinite;
        }

        .help-icon-wrapper svg {
          width: 28px;
          height: 28px;
          color: white;
        }

        .help-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .close-button {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: #9ca3af;
        }

        .close-button:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #4b5563;
        }

        .help-content {
          padding: 16px 20px 20px;
          height: 220px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .help-message {
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
          margin: 0;
          white-space: pre-wrap;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
        }

        @keyframes glow-pulse-blue {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.5);
          }
        }

        @keyframes glow-pulse-red {
          0%, 100% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.5);
          }
        }

        @keyframes pulse-attention {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }
      </style>

      <button 
        class="help-button ${iconType}"
        aria-label="${this.isOpen ? 'Hide help' : 'Show help'}"
        type="button"
      >
        ${this.getIconSVG(iconType)}
      </button>

      ${this.isOpen && message ? `
        <div class="help-panel ${position} ${iconType}">
          <div class="help-header">
            <div class="help-title-wrapper">
              <div class="help-icon-wrapper ${iconType}">
                ${this.getIconSVG(iconType)}
              </div>
              <h3 class="help-title">${iconType === 'info' ? 'Information' : 'Important'}</h3>
            </div>
            <button class="close-button" aria-label="Close">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="help-content">
            <p class="help-message">${this.escapeHtml(message)}</p>
          </div>
        </div>
      ` : ''}
    `;

    this.attachEventListeners();
  }

  private getIconSVG(iconType?: string): string {
    if (iconType === 'info') {
      return `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `;
    } else {
      return `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      `;
    }
  }

  private attachEventListeners() {
    const button = this.shadowRoot?.querySelector('.help-button');
    const closeButton = this.shadowRoot?.querySelector('.close-button');

    // Help button - toggle panel
    if (button) {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isOpen = !this.isOpen;
        this.render();
        console.log('[InputHelpElement] 💬 Help panel toggled:', this.isOpen);
      });
    }

    // Close button
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isOpen = false;
        this.render();
      });
    }

    // Close on outside click
    if (this.isOpen) {
      const handleClickOutside = (e: Event) => {
        if (!this.contains(e.target as Node)) {
          this.isOpen = false;
          this.render();
          document.removeEventListener('click', handleClickOutside);
        }
      };

      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
