import { ContentElement } from './ContentElement';

/**
 * Register the <content-component> custom element
 */
if (typeof window !== 'undefined' && !customElements.get('content-component')) {
  customElements.define('content-component', ContentElement);
}

export { ContentElement };
