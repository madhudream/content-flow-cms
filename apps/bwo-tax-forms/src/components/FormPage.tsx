import { useState, useEffect } from 'react';
import type { FormPageMeta, FieldError } from '../types';
import { FormField } from './FormField';

interface FormPageProps {
  pageId: string;
}

/**
 * FormPage component - Metadata-driven form page renderer
 * Loads metadata from JSON files and renders form with validation
 */
export function FormPage({ pageId }: FormPageProps) {
  const [metadata, setMetadata] = useState<FormPageMeta | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load metadata for the page
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const metadataModule = await import(`../metadata/${pageId}.json`);
        setMetadata(metadataModule.default);
      } catch (error) {
        console.error(`Failed to load metadata for page: ${pageId}`, error);
      }
    };
    
    loadMetadata();
  }, [pageId]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    
    // Clear error for this field when user types
    setErrors((prev) => prev.filter((error) => error.fieldId !== fieldId));
  };

  const validateForm = (): boolean => {
    if (!metadata) return false;

    const newErrors: FieldError[] = [];

    // Validate all fields in all sections
    metadata.sections.forEach((section) => {
      section.fields.forEach((field) => {
        const value = formData[field.id] || '';

        // Required field validation
        if (field.required && !value.trim()) {
          newErrors.push({
            fieldId: field.id,
            message: field.validation?.errorMessage || `${field.label} is required`,
          });
          return;
        }

        // Skip other validations if field is empty and not required
        if (!value.trim()) return;

        const validation = field.validation;
        if (!validation) return;

        // Pattern validation
        if (validation.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            newErrors.push({
              fieldId: field.id,
              message: validation.errorMessage || `Invalid format for ${field.label}`,
            });
            return;
          }
        }

        // Length validation
        if (validation.minLength && value.length < validation.minLength) {
          newErrors.push({
            fieldId: field.id,
            message: validation.errorMessage || `${field.label} must be at least ${validation.minLength} characters`,
          });
          return;
        }

        if (validation.maxLength && value.length > validation.maxLength) {
          newErrors.push({
            fieldId: field.id,
            message: validation.errorMessage || `${field.label} must not exceed ${validation.maxLength} characters`,
          });
          return;
        }

        // Number validation
        if (field.type === 'number') {
          const numValue = parseFloat(value);
          
          if (validation.min !== undefined && numValue < validation.min) {
            newErrors.push({
              fieldId: field.id,
              message: validation.errorMessage || `${field.label} must be at least ${validation.min}`,
            });
            return;
          }

          if (validation.max !== undefined && numValue > validation.max) {
            newErrors.push({
              fieldId: field.id,
              message: validation.errorMessage || `${field.label} must not exceed ${validation.max}`,
            });
            return;
          }
        }
      });
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstError = errors[0];
      if (firstError) {
        const errorElement = document.getElementById(firstError.fieldId);
        errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      console.log('Form submitted:', formData);
      alert('Form submitted successfully!');
      setIsSubmitting(false);
    }, 1000);
  };

  if (!metadata) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading form...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{metadata.title}</h1>

      <form onSubmit={handleSubmit} noValidate>
        {metadata.sections.map((section) => (
          <div key={section.id} className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-200">
              {section.title}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.fields.map((field) => (
                <div
                  key={field.id}
                  className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                >
                  <FormField
                    field={field}
                    value={formData[field.id] || ''}
                    onChange={handleFieldChange}
                    error={errors.find((e) => e.fieldId === field.id) || null}
                    pageId={pageId}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={() => setFormData({})}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Clear Form
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              px-8 py-3 rounded-lg font-medium transition-all
              ${isSubmitting
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
              }
            `}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </button>
        </div>
        
        {errors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium mb-2">
              Please fix the following errors:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {errors.map((error) => (
                <li key={error.fieldId}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}
