import { ContentComponent } from '@contentflow/sdk/react';
import type { FormField as FormFieldType, FieldError } from '../types';
import { ValidationError } from './ValidationError';

interface FormFieldProps {
  field: FormFieldType;
  value: string;
  onChange: (fieldId: string, value: string) => void;
  error: FieldError | null;
  pageId: string;  // Add pageId prop to look up translated content
}

/**
 * FormField component - Renders individual form field based on metadata
 * Uses ContentComponent for editable labels
 */
export function FormField({ field, value, onChange, error, pageId }: FormFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange(field.id, e.target.value);
  };

  const inputClasses = `
    mt-1 block w-full rounded-md shadow-sm
    ${error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }
    px-3 py-2 text-gray-900 placeholder-gray-400
    focus:outline-none focus:ring-2
  `;

  // Render label with ContentComponent if contentId provided, otherwise plain label
  const renderLabel = () => {
    if (field.contentId) {
      return (
        <ContentComponent
          contentId={field.contentId}
          pageId={pageId}
          defaultText={field.label}
          data-content-id={field.contentId}
          className="block text-sm font-medium text-gray-700"
        />
      );
    }
    return (
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  };

  return (
    <div className="mb-4">
      {renderLabel()}
      
      {field.type === 'textarea' ? (
        <textarea
          id={field.id}
          value={value}
          onChange={handleChange}
          placeholder={field.placeholder}
          required={field.required}
          className={inputClasses + ' min-h-[100px]'}
          maxLength={field.validation?.maxLength}
        />
      ) : field.type === 'select' ? (
        <select
          id={field.id}
          value={value}
          onChange={handleChange}
          required={field.required}
          className={inputClasses}
        >
          <option value="">-- Please Select --</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type}
          id={field.id}
          value={value}
          onChange={handleChange}
          placeholder={field.placeholder}
          required={field.required}
          className={inputClasses}
          pattern={field.validation?.pattern}
          minLength={field.validation?.minLength}
          maxLength={field.validation?.maxLength}
          min={field.validation?.min}
          max={field.validation?.max}
        />
      )}
      
      <ValidationError error={error} />
    </div>
  );
}
