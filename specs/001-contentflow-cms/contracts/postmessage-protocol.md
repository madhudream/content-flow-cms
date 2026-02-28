# PostMessage Protocol Contract

**Communication**: CMS (parent window) ↔ Consuming App (iframe)  
**Version**: 1.0.0  
**Status**: Phase 1  
**Date**: 2026-02-27

---

## Purpose

This contract defines the `window.postMessage` protocol for bidirectional communication between:
- **CMS Portal** (parent window, port 3000)
- **Consuming Apps** (iframe, ports 3001/3002)

This enables:
1. CMS to enable "highlight mode" in the preview iframe
2. Consuming app to notify CMS when user clicks editable content
3. CMS to send live preview updates to the iframe

**Breaking Change Policy**: Changes to message types or required fields require a major version bump.

---

## Message Flow Overview

```
┌─────────────────┐                  ┌──────────────────────┐
│   CMS Portal    │                  │  Consuming App       │
│  (port 3000)    │                  │  (iframe, port 3001) │
└─────────────────┘                  └──────────────────────┘
        │                                      │
        │  1. CONTENTFLOW_CMS_INIT             │
        │─────────────────────────────────────>│
        │                                      │
        │     2. CONTENTFLOW_CMS_ACK           │
        │<─────────────────────────────────────│
        │                                      │
        │                                      │  (User clicks element)
        │     3. CONTENTFLOW_CONTENT_CLICK     │
        │<─────────────────────────────────────│
        │                                      │
        │  4. CONTENTFLOW_PREVIEW_UPDATE       │  (User types in editor)
        │─────────────────────────────────────>│
        │                                      │
```

---

## Message #1: CMS Init

**Direction**: CMS → Consuming App (iframe)  
**Type**: `CONTENTFLOW_CMS_INIT`  
**Purpose**: Tell the consuming app to enter "CMS mode" (enable content highlighting and click handlers).

### Message Schema

```typescript
interface CMSInitMessage {
  type: 'CONTENTFLOW_CMS_INIT';
  appId: string;         // E.g., "demo"
  pageId: string;        // E.g., "home"
  language: string;      // E.g., "en-US"
}
```

### When Sent

- **Trigger**: CMS loads the preview iframe with URL `{baseUrl}{pagePath}?cms-mode=true`
- **Timing**: Sent immediately after iframe `load` event fires

### Example Payload

```json
{
  "type": "CONTENTFLOW_CMS_INIT",
  "appId": "demo",
  "pageId": "home",
  "language": "en-US"
}
```

### CMS Code (Sender)

```typescript
// apps/cms/src/components/PreviewPanel.tsx

const iframe = iframeRef.current;
const targetOrigin = new URL(app.baseUrl).origin; // "http://localhost:3002"

iframe.contentWindow.postMessage(
  {
    type: 'CONTENTFLOW_CMS_INIT',
    appId: selectedAppId,
    pageId: selectedPageId,
    language: selectedLanguage
  },
  targetOrigin
);
```

### Consuming App Code (Receiver)

```typescript
// apps/demo/src/services/cmsMode.ts

window.addEventListener('message', (event) => {
  // Validate origin (IMPORTANT for security)
  if (event.origin !== 'http://localhost:3000') return;
  
  const message = event.data;
  
  if (message.type === 'CONTENTFLOW_CMS_INIT') {
    enableCMSMode(message.appId, message.pageId, message.language);
    
    // Send acknowledgment (Message #2)
    event.source.postMessage(
      {
        type: 'CONTENTFLOW_CMS_ACK',
        appId: message.appId,
        pageId: message.pageId
      },
      event.origin
    );
  }
});
```

---

## Message #2: CMS Acknowledgment

**Direction**: Consuming App (iframe) → CMS  
**Type**: `CONTENTFLOW_CMS_ACK`  
**Purpose**: Confirm that the consuming app received the init message and is ready for CMS interaction.

### Message Schema

```typescript
interface CMSAckMessage {
  type: 'CONTENTFLOW_CMS_ACK';
  appId: string;
  pageId: string;
}
```

### When Sent

- **Trigger**: Consuming app receives `CONTENTFLOW_CMS_INIT`
- **Timing**: Sent immediately after enabling CMS mode

### Example Payload

```json
{
  "type": "CONTENTFLOW_CMS_ACK",
  "appId": "demo",
  "pageId": "home"
}
```

### Timeout Behavior (CMS Side)

**Requirement**: CMS MUST wait up to **3 seconds** for `CONTENTFLOW_CMS_ACK`.

**If ACK received within 3 seconds**:
- ✅ Enable editing features (highlight on hover, click to edit)

**If ACK NOT received within 3 seconds** (FR-020):
- ⚠️ Display warning banner: **"This app does not support CMS mode. Preview only."**
- 🔒 Disable editor panel and click interactions
- 👁️ Preview iframe remains visible (view-only mode)

### CMS Code (Receiver)

```typescript
// apps/cms/src/components/PreviewPanel.tsx

const [cmsSupported, setCmsSupported] = useState<boolean | null>(null);

useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== expectedOrigin) return;
    
    if (event.data.type === 'CONTENTFLOW_CMS_ACK') {
      setCmsSupported(true);
      clearTimeout(ackTimeout);
    }
  };
  
  window.addEventListener('message', handleMessage);
  
  // Timeout: 3 seconds
  const ackTimeout = setTimeout(() => {
    setCmsSupported(false); // Show warning banner
  }, 3000);
  
  return () => {
    window.removeEventListener('message', handleMessage);
    clearTimeout(ackTimeout);
  };
}, []);
```

---

## Message #3: Content Click

**Direction**: Consuming App (iframe) → CMS  
**Type**: `CONTENTFLOW_CONTENT_CLICK`  
**Purpose**: Notify CMS that user clicked an editable element in the preview.

### Message Schema

```typescript
interface ContentClickMessage {
  type: 'CONTENTFLOW_CONTENT_CLICK';
  contentId: string;       // E.g., "hero-title"
  currentValue: string;    // Current text/image URL from DOM
  elementType: 'text' | 'image';
}
```

### When Sent

- **Trigger**: User clicks an element with `data-content-id` attribute
- **Timing**: Sent immediately on click event

### Example Payload

```json
{
  "type": "CONTENTFLOW_CONTENT_CLICK",
  "contentId": "hero-title",
  "currentValue": "Welcome to ContentFlow",
  "elementType": "text"
}
```

### Consuming App Code (Sender)

```typescript
// apps/demo/src/services/cmsMode.ts

function enableCMSMode(appId: string, pageId: string, language: string) {
  // Add click handlers to all elements with data-content-id
  document.querySelectorAll('[data-content-id]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const contentId = el.getAttribute('data-content-id');
      const currentValue = el.tagName === 'IMG' 
        ? (el as HTMLImageElement).src
        : el.textContent || '';
      const elementType = el.tagName === 'IMG' ? 'image' : 'text';
      
      // Send message to CMS (parent window)
      window.parent.postMessage(
        {
          type: 'CONTENTFLOW_CONTENT_CLICK',
          contentId,
          currentValue,
          elementType
        },
        'http://localhost:3000'  // CMS origin
      );
    });
  });
}
```

### CMS Code (Receiver)

```typescript
// apps/cms/src/components/PreviewPanel.tsx

window.addEventListener('message', (event) => {
  if (event.origin !== expectedAppOrigin) return;
  
  if (event.data.type === 'CONTENTFLOW_CONTENT_CLICK') {
    const { contentId, currentValue, elementType } = event.data;
    
    // Open editor panel with this content
    dispatch(setActiveContent({ contentId, currentValue, elementType }));
    dispatch(openEditorPanel());
  }
});
```

---

## Message #4: Preview Update

**Direction**: CMS → Consuming App (iframe)  
**Type**: `CONTENTFLOW_PREVIEW_UPDATE`  
**Purpose**: Send live preview updates as the user types in the editor panel.

### Message Schema

```typescript
interface PreviewUpdateMessage {
  type: 'CONTENTFLOW_PREVIEW_UPDATE';
  contentId: string;       // E.g., "hero-title"
  newValue: string;        // New text or image URL
}
```

### When Sent

- **Trigger**: User types in the CMS editor panel
- **Timing**: Debounced 300ms after last keystroke (avoid too many messages)

### Example Payload

```json
{
  "type": "CONTENTFLOW_PREVIEW_UPDATE",
  "contentId": "hero-title",
  "newValue": "Updated Headline"
}
```

### CMS Code (Sender)

```typescript
// apps/cms/src/components/EditorPanel.tsx

import { debounce } from 'lodash';

const sendPreviewUpdate = debounce((contentId: string, newValue: string) => {
  const iframe = document.querySelector('#preview-iframe') as HTMLIFrameElement;
  const targetOrigin = new URL(selectedApp.baseUrl).origin;
  
  iframe.contentWindow.postMessage(
    {
      type: 'CONTENTFLOW_PREVIEW_UPDATE',
      contentId,
      newValue
    },
    targetOrigin
  );
}, 300);

// In input handler
const handleInputChange = (e) => {
  const newValue = e.target.value;
  setEditorValue(newValue);
  sendPreviewUpdate(activeContentId, newValue);
};
```

### Consuming App Code (Receiver)

```typescript
// apps/demo/src/services/cmsMode.ts

window.addEventListener('message', (event) => {
  if (event.origin !== 'http://localhost:3000') return;
  
  if (event.data.type === 'CONTENTFLOW_PREVIEW_UPDATE') {
    const { contentId, newValue } = event.data;
    
    // Find element and update DOM (live preview)
    const el = document.querySelector(`[data-content-id="${contentId}"]`);
    if (el) {
      if (el.tagName === 'IMG') {
        (el as HTMLImageElement).src = newValue;
      } else {
        el.textContent = newValue;
      }
    }
  }
});
```

**Note**: This is a **preview only**. Actual save happens when user clicks "Save" in CMS, which writes to JSON file.

---

## Security Requirements

### Origin Validation (CRITICAL)

**Requirement**: ALL `postMessage` handlers MUST validate `event.origin`.

**CMS Side** (expects messages from consuming apps):
```typescript
const allowedOrigins = [
  'http://localhost:3001',  // BWO Tax Forms
  'http://localhost:3002',  // Demo App
];

window.addEventListener('message', (event) => {
  if (!allowedOrigins.includes(event.origin)) {
    console.warn('[CMS] Ignored message from untrusted origin:', event.origin);
    return;
  }
  
  // Process message
});
```

**Consuming App Side** (expects messages from CMS):
```typescript
const CMS_ORIGIN = 'http://localhost:3000';

window.addEventListener('message', (event) => {
  if (event.origin !== CMS_ORIGIN) {
    console.warn('[App] Ignored message from untrusted origin:', event.origin);
    return;
  }
  
  // Process message
});
```

**Why Critical**: Without origin validation, malicious sites could send spoofed messages.

---

### Message Type Validation

**Requirement**: Always validate `event.data.type` before processing.

```typescript
const validTypes = [
  'CONTENTFLOW_CMS_INIT',
  'CONTENTFLOW_CMS_ACK',
  'CONTENTFLOW_CONTENT_CLICK',
  'CONTENTFLOW_PREVIEW_UPDATE'
];

if (!validTypes.includes(event.data?.type)) {
  console.warn('[CMS] Ignored unknown message type:', event.data?.type);
  return;
}
```

---

## Error Handling

### Scenario 1: Consuming App Not in CMS Mode

**Problem**: User opens consuming app directly (not via CMS iframe).

**Behavior**: 
- No `?cms-mode=true` query param → `cmsMode.ts` does not activate
- No click handlers added to elements
- App functions normally without CMS integration

**No Error**: This is expected behavior. Apps MUST work standalone.

---

### Scenario 2: CMS Mode Enabled But No ACK Received

**Problem**: Consuming app doesn't support postMessage protocol (old version, broken code).

**Behavior** (FR-020):
- CMS waits 3 seconds for `CONTENTFLOW_CMS_ACK`
- Timeout triggers → Display warning banner
- Editor panel disabled, preview remains visible

**User Experience**:
```
⚠️ This app does not support CMS mode. Preview only.
```

---

### Scenario 3: Malformed Message Received

**Problem**: Message has unexpected structure or missing fields.

**Behavior**:
```typescript
if (!event.data || typeof event.data.type !== 'string') {
  console.warn('[CMS] Received malformed message:', event.data);
  return; // Ignore
}

if (event.data.type === 'CONTENTFLOW_CONTENT_CLICK') {
  if (!event.data.contentId || !event.data.currentValue) {
    console.warn('[CMS] Missing required fields in CONTENTFLOW_CONTENT_CLICK');
    return; // Ignore
  }
}
```

---

## Performance Considerations

### Debouncing Preview Updates

**Problem**: User types quickly → 100s of `CONTENTFLOW_PREVIEW_UPDATE` messages/second.

**Solution**: Debounce 300ms (only send message if user stops typing for 300ms).

```typescript
import { debounce } from 'lodash';
const sendUpdate = debounce((contentId, newValue) => {
  iframe.contentWindow.postMessage(/* ... */);
}, 300);
```

---

### Message Size Limits

**Recommendation**: Keep message payloads under 10KB.

**Current Payloads**:
- `CMSInitMessage`: ~100 bytes
- `ContentClickMessage`: ~200 bytes (content value up to 10KB)
- `PreviewUpdateMessage`: ~200 bytes (new value up to 10KB)

**If content exceeds 10KB**: Consider chunking (out of scope for Phase 1).

---

## Testing Strategy

### Unit Tests (Vitest)

**Test Cases**:
1. CMS sends `CONTENTFLOW_CMS_INIT` → Verify postMessage called with correct payload
2. Consuming app receives `CONTENTFLOW_CMS_INIT` → Verify ACK sent
3. Timeout triggers if no ACK received within 3 seconds
4. Origin validation rejects messages from untrusted origins
5. Malformed messages ignored without crashing

**Mock Setup**:
```typescript
const mockPostMessage = vi.fn();
window.parent.postMessage = mockPostMessage;

// Simulate message
window.dispatchEvent(new MessageEvent('message', {
  data: { type: 'CONTENTFLOW_CMS_INIT', appId: 'demo', pageId: 'home', language: 'en-US' },
  origin: 'http://localhost:3000'
}));

expect(mockPostMessage).toHaveBeenCalledWith({
  type: 'CONTENTFLOW_CMS_ACK',
  appId: 'demo',
  pageId: 'home'
}, 'http://localhost:3000');
```

---

### E2E Tests (Playwright)

**Test Cases**:
1. Load CMS → Select app/page → Verify iframe loads with `?cms-mode=true`
2. Verify ACK received → Editor panel enabled
3. Click element in iframe → Editor panel opens with correct content
4. Type in editor → Verify live preview updates in iframe
5. Click Save → Verify JSON file written, iframe reloads with new content

---

## Protocol Version Evolution

### Adding New Message Types

**Process**:
1. Add new message type constant (e.g., `CONTENTFLOW_LANGUAGE_CHANGE`)
2. Update this contract document
3. Implement sender and receiver code
4. Add validation for new type
5. Ensure old apps ignore unknown types (forward compatibility)

**Example** (Phase 2 addition):
```typescript
interface LanguageChangeMessage {
  type: 'CONTENTFLOW_LANGUAGE_CHANGE';
  newLanguage: string;  // E.g., "es-ES"
}
```

---

### Deprecating Message Types

**Process**:
1. Mark type as deprecated in this contract
2. Continue supporting for 1 major version (backward compatibility)
3. Log deprecation warning when received
4. Remove in next major version

---

## Contract Summary

**Immutable Rules** (breaking changes require major version):
- Message type constants (`CONTENTFLOW_CMS_INIT`, etc.)
- Required fields in message payloads
- Origin validation requirement

**Flexible Rules** (can evolve with minor version):
- Additional optional fields in messages
- New message types (old apps ignore unknown types)
- Timeout durations (can be made configurable)

**Phase 1 Complete**: All four message types defined and ready for implementation.
