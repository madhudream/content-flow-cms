# Spec 004: Configurable Input Help Text (Tooltips)

## Overview

Make form input controls configurable in the CMS, similar to how text content is editable with ContentComponent. Input controls will optionally display an info/help icon, and clicking it shows a configurable help message. This follows the same CMS editing pattern as text content.

## Problem Statement

- **Text content** (labels, headings, etc.) is editable through CMS using ContentComponent with a pencil icon
- **Input controls** (text fields, selects, etc.) have no CMS-editable help/tooltip configuration
- Users need contextual help for complex form fields but editors cannot add/edit this help text
- No consistent pattern for making input control metadata editable

## Goals

1. Make input controls configurable like text content (using ContentComponent pattern)
2. Store input help configuration in content files alongside text content
3. Enable CMS editing with same UX pattern (pencil icon → editor panel)
4. Display info/help icon next to input controls when configured
5. Support multiple languages for help messages using existing translation workflow

## Non-Goals

- Changing the core form input behavior (validation, submission, etc.)
- Rich media in help messages (text only for Phase 1)
- Usage analytics or A/B testing
- AI-generated help text (manual configuration only)
- Tooltip configuration for non-input elements (use ContentComponent for labels)

## User Stories

### Content Editor (in CMS)
- As a CMS editor, I want to see a pencil icon next to input controls (like I do for text)
- As a CMS editor, I want to click the pencil to configure help text for an input
- As a CMS editor, I want to enable/disable the help icon for each input
- As a CMS editor, I want to preview the help icon and message before publishing

### End User (in Form App)
- As a form user, I see an info icon (ℹ️) next to complex input fields
- As a form user, I click the icon to see helpful guidance
- As a form user, I see help text in my selected language

## Technical Design

### Key Concept: Input Help as Configurable Content

Just like `ContentComponent` makes text editable via CMS:
- Text has `contentId` → displays in CMS editor → shows pencil icon
- Inputs have `inputHelpId` → displays in CMS editor → shows pencil icon

### Architecture Pattern

```
ContentComponent (existing)          InputHelpComponent (new)
├─ data-content-id attribute         ├─ data-input-help-id attribute
├─ Stores text content               ├─ Stores help configuration
├─ CMS: pencil icon on hover         ├─ CMS: pencil icon on hover
├─ CMS: text editor panel            ├─ CMS: help config panel
└─ SDK: useContent hook              └─ SDK: useInputHelp hook
```

### Storage Format

Input help stored in same content files as text (e.g., `personal-info.json`):

```json
{
  "$meta": {
    "appId": "bwo-taxforms",
    "pageId": "personal-info",
    "lang": "en-US",
    "version": 1
  },
  "bwo-field-first-name": "First Name",
  "bwo-field-ssn": "Social Security Number",
  "inputHelp": {
    "ssn-help": {
      "enabled": true,
      "message": "Enter your 9-digit SSN without dashes (e.g., 123456789)",
      "iconType": "info"
    },
    "income-help": {
      "enabled": true,
      "message": "Add up Box 1 from all W-2 forms you received",
      "iconType": "exclamation"
    }
  }
}
```

### Component Structure

**InputHelpComponent** (SDK):
```tsx
interface InputHelpComponentProps {
  inputHelpId: string;           // Unique ID (e.g., "ssn-help")
  defaultMessage?: string;       // Fallback if not in content
  defaultIconType?: 'info' | 'exclamation';
  position?: 'right' | 'left' | 'top' | 'bottom';
  'data-input-help-id': string;  // Required for CMS discovery
}

// Renders nothing if not enabled, or:
// <button (info icon)> + <popup with message>
```

**FormField Usage** (BWO Tax Forms):
```tsx
<div className="relative">
  <input {...props} />
  <InputHelpComponent
    inputHelpId="ssn-help"
    defaultMessage="Enter your SSN"
    data-input-help-id="ssn-help"
    position="right"
  />
</div>
```

### SDK Store Extension

```typescript
interface InputHelpContent {
  enabled: boolean;
  message: string;
  iconType: 'info' | 'exclamation';
}

interface ContentStoreState {
  // ... existing fields
  inputHelp: Record<string, InputHelpContent>;
  getInputHelp: (inputHelpId: string) => InputHelpContent | undefined;
}
```

### CMS Integration

**Discovery:**
- CMS iframe scans for `data-input-help-id` attributes
- Highlights input controls with help configuration

**Editing:**
- Click pencil icon → opens editor panel
- Panel shows:
  - Toggle: Enable/Disable help icon
  - Dropdown: Icon type (info ℹ️ / exclamation ⚠️)
  - Textarea: Help message
  - Preview button

**Save:**
- Updates `inputHelp` object in content file
- Sends preview update to iframe
- CDN publish on save

## UI Design

### End User View (Form App)

**Input with Help:**
```
[First Name Label]  
┌─────────────────────────┐  ℹ️  ← Info icon appears here
│ Enter first name        │
└─────────────────────────┘
```

**On Icon Click:**
- Popup appears (white background, shadow, max 300px)
- Shows help message
- Click outside or icon again to close

**Icon Types:**
- `info` (ℹ️): Blue color, for helpful guidance
- `exclamation` (⚠️): Amber color, for warnings/important notes

### CMS Editor View

**Hovering over input with help:**
```
[SSN Label]
┌─────────────────────────┐
│ XXX-XX-XXXX             │ 🖊️ ← Pencil icon on hover
└─────────────────────────┘  ℹ️
```

**Editor Panel (when pencil clicked):**
```
┌─ Input Help Configuration ───────┐
│ Input ID: ssn-help               │
│                                   │
│ [✓] Enable help icon             │
│                                   │
│ Icon Type:  ⊙ info  ○ exclamation│
│                                   │
│ Help Message:                     │
│ ┌───────────────────────────────┐│
│ │ Enter your 9-digit SSN       ││
│ │ without dashes               ││
│ └───────────────────────────────┘│
│                                   │
│ [Preview] [Cancel] [Save]        │
└────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: SDK Component
- Create `InputHelpComponent` in SDK
- Add `inputHelp` state to Zustand store
- Implement `useInputHelp` hook
- Load `inputHelp` from content files automatically
- Render info/exclamation icon with popup

### Phase 2: BWO Integration
- Add `inputHelpId` to FormField metadata
- Update FormField component to render InputHelpComponent
- Add help configuration to personal-info.json and income.json
- Test in all 5 languages

### Phase 3: CMS Integration
- Add `data-input-help-id` scanning to CMS
- Create InputHelpEditor panel component
- Wire up save/preview/publish workflow
- Add to CMS highlight mode

### Phase 4: Deploy & Test
- Build and deploy to Azure
- Verify in production
- Test language switching
- Verify translation workflow

## Success Criteria

1. ✅ Input controls have `data-input-help-id` attribute (like ContentComponent has `data-content-id`)
2. ✅ Info/exclamation icon appears next to inputs when configured
3. ✅ Clicking icon shows help message popup
4. ✅ Help messages load from content files (same as text content)
5. ✅ CMS shows pencil icon when hovering over inputs with help
6. ✅ CMS editor panel allows enable/disable, icon selection, message editing
7. ✅ Changes save to content files and update preview in real-time
8. ✅ Works in all 5 languages (en-US, es-ES, fr-FR, de-DE, ja-JP)
9. ✅ Translation workflow same as ContentComponent
10. ✅ No breaking changes to existing forms

## Dependencies

- Existing ContentFlow SDK infrastructure
- Zustand store pattern (same as ContentComponent)
- Content file structure with `inputHelp` property
- CMS iframe communication (postMessage)
- CMS highlight mode and editor panels

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Help config not loading | Provide defaultMessage fallback |
| CMS cannot detect inputs | Use `data-input-help-id` attribute consistently |
| Icon positioning conflicts | Use CSS positioning relative to input container |
| Mobile UX issues | Responsive popup positioning, touch-friendly icon size |
| Translation delays | Use same translation workflow as ContentComponent |
| Breaking existing forms | InputHelpComponent is optional, purely additive |

## Comparison with ContentComponent

| Feature | ContentComponent | InputHelpComponent |
|---------|------------------|-------------------|
| **Purpose** | Editable text content | Configurable input help |
| **Attribute** | `data-content-id` | `data-input-help-id` |
| **Storage** | Top-level in content file | Under `inputHelp` property |
| **CMS Edit** | Text editor | Help config panel |
| **Render** | Text/image node | Icon + popup |
| **Optional** | No (needs defaultText) | Yes (can be disabled) |

## Future Enhancements

- Rich HTML in help messages (bold, links, lists)
- Video/GIF support for visual guidance
- AI-suggested help text based on field name/validation
- Analytics on help icon clicks (which fields need more help?)
- Adaptive help (show different messages based on user errors)
- Voice-narrated help for accessibility
- Inline help text (below input) as alternative to popup
