# Implementation Plan: Configurable Input Help Text

## Tech Stack

**SDK:**
- TypeScript 5.9.2
- React 18 (for React integration)
- Zustand (existing store pattern, same as ContentComponent)
- Vite (build)

**Styling:**
- Tailwind CSS (consistent with existing apps)
- No external tooltip library (custom implementation)

**Storage:**
- Same content files as text content (no separate tooltip files)
- `inputHelp` property within each page JSON
- Azure Blob Storage (existing infrastructure)

## Architecture

### File Structure

```
packages/sdk/src/
├── react/
│   ├── InputHelpComponent.tsx    # NEW: Input help icon + popup
│   ├── useInputHelp.ts           # NEW: React hook for help access
│   └── index.ts                  # MODIFY: Export new components
├── core/
│   ├── store.ts                  # MODIFY: Add inputHelp state
│   └── types.ts                  # MODIFY: Add InputHelpContent type
└── index.ts                      # MODIFY: Export new types

apps/bwo-tax-forms/src/
├── components/
│   └── FormField.tsx             # MODIFY: Add InputHelpComponent
├── metadata/
│   ├── personal-info.json        # MODIFY: Add inputHelpId to fields
│   └── income.json               # MODIFY: Add inputHelpId to fields
└── types.ts                      # MODIFY: Add inputHelpId to FormField type

apps/server/content/bwo-taxforms/
├── en-US/
│   ├── personal-info.json        # MODIFY: Add inputHelp property
│   └── income.json               # MODIFY: Add inputHelp property
├── es-ES/
│   ├── personal-info.json        # MODIFY: Add inputHelp property
│   └── income.json               # MODIFY: Add inputHelp property
└── (same for fr-FR, de-DE, ja-JP)

apps/cms/src/
├── components/
│   ├── InputHelpEditor.tsx       # NEW: CMS editor panel
│   └── PreviewIframe.tsx         # MODIFY: Scan for input-help-id
└── stores/
    └── editorStore.ts            # MODIFY: Add input help editing
```

## Component Design

### 1. InputHelpComponent (React)

**Location:** `packages/sdk/src/react/InputHelpComponent.tsx`

```typescript
interface InputHelpComponentProps {
  inputHelpId: string;
  defaultMessage?: string;
  defaultIconType?: 'info' | 'exclamation';
  position?: 'right' | 'left' | 'top' | 'bottom';
  className?: string;
  'data-input-help-id': string;  // Required for CMS discovery
}

export function InputHelpComponent({
  inputHelpId,
  defaultMessage = '',
  defaultIconType = 'info',
  position = 'right',
  className = '',
  'data-input-help-id': dataInputHelpId
}: InputHelpComponentProps) {
  const helpContent = useInputHelp(inputHelpId);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Don't render if not enabled
  if (!helpContent?.enabled) return null;
  
  const message = helpContent.message || defaultMessage;
  const iconType = helpContent.iconType || defaultIconType;
  
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  const iconClasses = iconType === 'info' 
    ? 'text-blue-500 hover:text-blue-700' 
    : 'text-amber-500 hover:text-amber-700';
  
  return (
    <div 
      ref={containerRef}
      className={`absolute inset-y-0 -right-8 flex items-center ${className}`} 
      data-input-help-id={dataInputHelpId}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${iconClasses} focus:outline-none focus:ring-2 focus:ring-opacity-50 rounded-full`}
        aria-label="Show help"
        type="button"
      >
        {iconType === 'info' ? (
          <InfoIcon className="w-5 h-5" />
        ) : (
          <ExclamationIcon className="w-5 h-5" />
        )}
      </button>
      
      {isOpen && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 2. useInputHelp Hook

**Location:** `packages/sdk/src/react/useInputHelp.ts`

```typescript
export function useInputHelp(inputHelpId: string) {
  const helpContent = useContentStore((state) => state.getInputHelp(inputHelpId));
  return helpContent;
}
```

### 3. Store Extensions

**Location:** `packages/sdk/src/core/store.ts`

```typescript
interface InputHelpContent {
  enabled: boolean;
  message: string;
  iconType: 'info' | 'exclamation';
}

interface ContentFlowStore {
  // ... existing fields
  
  inputHelp: Record<string, InputHelpContent>;
  
  getInputHelp: (inputHelpId: string) => InputHelpContent | undefined;
}

// In fetchPageContent(), extract inputHelp from content file:
fetchPageContent: async (pageId: string) => {
  // ... existing fetch logic
  const data = await adapter.read(filename);
  
  // Extract content map
  const contentMap: ContentMap = {};
  const pageInputHelp: Record<string, InputHelpContent> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (key === '$meta') {
      // Skip metadata
    } else if (key === 'inputHelp' && typeof value === 'object') {
      // Extract input help
      Object.assign(pageInputHelp, value);
    } else if (typeof value === 'string') {
      // Extract content
      contentMap[key] = value;
    }
  });
  
  // Update store
  set((state) => ({
    contentMaps: { ...state.contentMaps, [pageId]: contentMap },
    inputHelp: { ...state.inputHelp, ...pageInputHelp },
    status: { ...state.status, [pageId]: 'loaded' }
  }));
}
```

### 4. Types

**Location:** `packages/sdk/src/types.ts`

```typescript
export interface InputHelpContent {
  enabled: boolean;
  message: string;
  iconType: 'info' | 'exclamation';
}

export interface ContentFile {
  $meta: ContentMeta;
  inputHelp?: Record<string, InputHelpContent>;
  [contentId: string]: string | ContentMeta | Record<string, InputHelpContent> | undefined;
}
```

## Integration Strategy

### BWO Tax Forms Integration

**Update:** `apps/bwo-tax-forms/src/components/FormField.tsx`

```tsx
import { ContentComponent, InputHelpComponent } from '@contentflow/sdk/react';

export function FormField({ field, value, onChange, error, pageId }: FormFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700">
        <ContentComponent
          contentId={field.contentId}
          pageId={pageId}
          defaultText={field.label}
          data-content-id={field.contentId}
        />
      </label>
      
      {/* Input with help icon positioned next to it */}
      <div className="relative">
        <input
          type={field.type}
          value={value}
          onChange={(e) => onChange(field.id, e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2"
        />
        
        {/* NEW: Input help icon appears here */}
        {field.inputHelpId && (
          <InputHelpComponent
            inputHelpId={field.inputHelpId}
            defaultMessage={field.inputHelpMessage}
            position="right"
            data-input-help-id={field.inputHelpId}
          />
        )}
      </div>
      
      <ValidationError error={error} />
    </div>
  );
}
```

### Metadata Updates

**Update:** Form metadata to include input help references

```typescript
// apps/bwo-tax-forms/src/metadata/personal-info.json
{
  "fields": [
    {
      "id": "ssn",
      "type": "text",
      "label": "Social Security Number",
      "contentId": "bwo-field-ssn",
      "inputHelpId": "ssn-help",                    // NEW
      "inputHelpMessage": "Enter 9-digit SSN",      // NEW (fallback)
      "validation": { "required": true, "pattern": "^\\d{3}-\\d{2}-\\d{4}$" }
    }
  ]
}
```

**Update:** `apps/bwo-tax-forms/src/types.ts`

```typescript
export interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea';
  label: string;
  contentId?: string;
  inputHelpId?: string;        // NEW
  inputHelpMessage?: string;   // NEW
  // ... other fields
}
```

## Data Flow

### Initialization Sequence

```
1. App loads → ContentFlowSDK.initialize()
2. SDK loads content files → store.fetchPageContent()
3. During fetch, extract both content strings AND inputHelp
4. Store updates: contentMaps + inputHelp
5. Components render with content + input help
```

### Input Help Display Flow

```
1. User views form field
2. InputHelpComponent checks store.getInputHelp(inputHelpId)
3. If enabled === true, render info/exclamation icon
4. User clicks icon → popup appears with message
5. User clicks outside or icon again → popup closes
```

### CMS Editing Flow

```
1. CMS loads BWO app in iframe with ?cms-mode=true
2. CMS scans for data-input-help-id attributes
3. User hovers over input → pencil icon appears
4. User clicks pencil → InputHelpEditor panel opens
5. User edits: enabled, iconType, message
6. User clicks Save → CMS updates content file (inputHelp property)
7. CMS sends CONTENTFLOW_PREVIEW_UPDATE → iframe updates
8. User publishes → CDN purge → changes live
```

## Storage Schema

### Content File with Input Help

**Location:** `apps/server/content/bwo-taxforms/en-US/personal-info.json`

```json
{
  "$meta": {
    "appId": "bwo-taxforms",
    "pageId": "personal-info",
    "lang": "en-US",
    "version": 1,
    "updatedAt": "2026-03-01T23:30:00Z"
  },
  "bwo-field-first-name": "First Name",
  "bwo-field-last-name": "Last Name",
  "bwo-field-ssn": "Social Security Number",
  "inputHelp": {
    "firstName-help": {
      "enabled": true,
      "message": "Enter your legal first name as it appears on your Social Security card",
      "iconType": "info"
    },
    "lastName-help": {
      "enabled": true,
      "message": "Enter your legal last name as it appears on your Social Security card",
      "iconType": "info"
    },
    "ssn-help": {
      "enabled": true,
      "message": "Enter your 9-digit Social Security Number without dashes (e.g., 123456789)",
      "iconType": "exclamation"
    }
  }
}
```

Note: `inputHelp` is at the same level as content strings, embedded in the page content file.

## API Changes

### SDK Public API Extensions

```typescript
// packages/sdk/src/index.ts
export { TooltipComponent } from './react/TooltipComponent';
export { useTooltip } from './react/useTooltip';
export type { TooltipContent, TooltipConfig } from './core/types';
```

## Build Process

1. **SDK Build**: `npm run build --workspace=packages/sdk`
2. **BWO Build**: `npm run build --workspace=apps/bwo-tax-forms`
3. **Deploy**: `npm run build:deploy`

No changes needed to build scripts.

## Configuration

### Environment Variables

No new environment variables required. Uses existing:
- `BLOB_STORAGE_BASE_URL` for content loading
- `STORAGE_TYPE` for local vs Azure

### SDK Initialization

```typescript
// apps/bwo-tax-forms/src/main.tsx
await ContentFlowSDK.initialize({
  appId: 'bwo-taxforms',
  language: selectedLanguage,
  storageUrl: import.meta.env.VITE_STORAGE_URL,
  pages: ['home', 'personal-info', 'income'],
  loadTooltips: true,  // NEW: Optional flag (default: true)
});
```

## API Changes

### SDK Public API Extensions

```typescript
// packages/sdk/src/index.ts
export { InputHelpComponent } from './react/InputHelpComponent';
export { useInputHelp } from './react/useInputHelp';
export type { InputHelpContent } from './types';
```

### No Breaking Changes

- Existing ContentComponent and content loading unchanged
- InputHelpComponent is purely additive
- All input help features are opt-in

## Build Process

1. **SDK Build**: `npm run build --workspace=packages/sdk`
2. **BWO Build**: `npm run build --workspace=apps/bwo-tax-forms`
3. **CMS Build**: `npm run build --workspace=apps/cms`
4. **Deploy**: `npm run build:deploy`

No changes needed to build scripts.

## Configuration

### Environment Variables

No new environment variables required. Uses existing:
- `VITE_STORAGE_URL` for content loading
- `AZURE_STORAGE_CONNECTION_STRING` for CDN publish

### SDK Initialization

```typescript
// apps/bwo-tax-forms/src/main.tsx
await ContentFlowSDK.initialize({
  appId: 'bwo-taxforms',
  language: selectedLanguage,
  storageUrl: import.meta.env.VITE_STORAGE_URL,
  pages: ['home', 'personal-info', 'income']
});

// Input help loaded automatically with page content
// No separate initialization needed
```

## Performance Considerations

1. **Bundle Size**: ~3KB added for InputHelpComponent (icon + popup)
2. **Network**: No additional requests (embedded in page content files)
3. **Memory**: Minimal (input help cached in Zustand store with content)
4. **Rendering**: No performance impact (conditional rendering, only when enabled)

## Accessibility

- Use semantic HTML (`<button>` for icon)
- Add `aria-label` to help icon trigger
- Keyboard navigation support (Enter/Space to toggle)
- Screen reader announces help messages
- Focus management (trap focus in open popup)
- ESC key to close popup
- High contrast mode support

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)
- Touch-friendly icon size (5x5 minimum)

## Rollback Plan

If input help causes issues:
1. Remove `inputHelp` property from content files
2. Remove InputHelpComponent from FormField
3. Redeploy (help icons hidden, no breaking changes)

InputHelpComponent is purely additive - removal doesn't break existing functionality.
