import { useContentStore } from '../core/store';

/**
 * ContentElement - Web Component for rendering editable content
 *
 * Usage:
 * ```html
 * <content-component
 *   content-id="hero-title"
 *   page-id="home"
 *   default-text="Welcome"
 *   data-content-id="hero-title">
 * </content-component>
 * ```
 */
export class ContentElement extends HTMLElement {
  private unsubscribe?: () => void;

  static get observedAttributes() {
    return ['content-id', 'page-id', 'default-text', 'default-src', 'type', 'alt'];
  }

  connectedCallback() {
    this.render();
    this.subscribeToStore();
    this.listenForPreviewUpdates();
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  attributeChangedCallback() {
    this.render();
  }

  private subscribeToStore() {
    const self = this;
    this.unsubscribe = useContentStore.subscribe(() => {
      self.render();
    });
  }

  private listenForPreviewUpdates() {
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.data.type === 'CONTENTFLOW_PREVIEW_UPDATE') {
        const { contentId, newValue } = event.data.payload;
        if (contentId === this.getAttribute('content-id')) {
          this.renderContent(newValue);
        }
      }
    });
  }

  private render() {
    const contentId = this.getAttribute('content-id') || '';
    const pageId = this.getAttribute('page-id') || '';
    const type = this.getAttribute('type') || 'text';

    const state = useContentStore.getState();
    const override = state.contentMaps[pageId]?.[contentId];

    const defaultValue = type === 'image'
      ? this.getAttribute('default-src') || ''
      : this.getAttribute('default-text') || '';

    const content = override || defaultValue;

    this.renderContent(content);
  }

  private renderContent(content: string) {
    const type = this.getAttribute('type') || 'text';
    const contentId = this.getAttribute('content-id') || '';

    // Ensure data-content-id is on the custom element itself
    this.setAttribute('data-content-id', contentId);

    if (type === 'image') {
      const alt = this.getAttribute('alt') || '';
      this.innerHTML = `<img src="${content}" alt="${alt}" data-content-id="${contentId}" />`;
    } else {
      this.textContent = content;
    }
  }
}
