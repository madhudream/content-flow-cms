/**
 * BWO Tax Forms - TypeScript Type Definitions
 */

/**
 * Metadata schema for form pages
 */
export interface FormPageMeta {
  pageId: string;                  // Matches Page.id (e.g., "personal-info")
  title: string;                   // Page title (e.g., "Personal Information")
  sections: FormSection[];         // Array of form sections
}

/**
 * Form section grouping related fields
 */
export interface FormSection {
  id: string;                      // Section unique ID (e.g., "name-section")
  title: string;                   // Section heading (e.g., "Full Name")
  fields: FormField[];             // Array of fields in this section
}

/**
 * Individual form field definition
 */
export interface FormField {
  id: string;                      // Field unique ID (e.g., "first-name")
  type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea';
  label: string;                   // Plain text label (fallback)
  contentId?: string;              // Optional: content-id for editable label
  placeholder?: string;            // Optional placeholder text
  required?: boolean;              // Whether field is required
  validation?: FieldValidation;    // Optional validation rules
  options?: SelectOption[];        // For type='select' only
}

/**
 * Field validation rules
 */
export interface FieldValidation {
  pattern?: string;                // Regex pattern for input validation
  minLength?: number;              // Minimum length
  maxLength?: number;              // Maximum length
  min?: number;                    // Minimum value (for type='number')
  max?: number;                    // Maximum value (for type='number')
  errorMessage?: string;           // Custom error message
}

/**
 * Select field option
 */
export interface SelectOption {
  value: string;                   // Option value
  label: string;                   // Option display label
}

/**
 * Form field error state
 */
export interface FieldError {
  fieldId: string;
  message: string;
}
