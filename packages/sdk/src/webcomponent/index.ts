import { ContentElement } from './ContentElement';
import { InputHelpElement } from './InputHelpElement';

/**
 * Register custom elements
 */
if (typeof window !== 'undefined') {
  if (!customElements.get('content-component')) {
    customElements.define('content-component', ContentElement);
  }
  
  if (!customElements.get('input-help')) {
    customElements.define('input-help', InputHelpElement);
  }
}

export { ContentElement, InputHelpElement };
