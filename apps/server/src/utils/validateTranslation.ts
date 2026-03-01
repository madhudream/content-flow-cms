import { logger } from './logger';

/**
 * Translation Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate translated content against source content
 * 
 * Checks:
 * - All source keys exist in translation
 * - No empty translations
 * - Detects potentially untranslated content (same as source)
 * 
 * @param source - Source content object (without $meta)
 * @param translated - Translated content object (without $meta)
 * @param minLengthForSameCheck - Minimum string length to check for identical content (default: 5)
 * @returns Validation result with errors and warnings
 */
export function validateTranslation(
  source: Record<string, string>,
  translated: Record<string, string>,
  minLengthForSameCheck: number = 5
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Skip $meta key if present
  const sourceKeys = Object.keys(source).filter((k) => k !== '$meta');
  const translatedKeys = Object.keys(translated).filter((k) => k !== '$meta');

  logger.debug('Validating translation', {
    sourceKeys: sourceKeys.length,
    translatedKeys: translatedKeys.length,
  });

  // 1. Check all source keys exist in translation
  for (const key of sourceKeys) {
    if (!(key in translated)) {
      errors.push(`Missing key in translation: ${key}`);
    }
  }

  // 2. Check for empty translations
  for (const [key, value] of Object.entries(translated)) {
    if (key === '$meta') continue;

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`Empty translation for key: ${key}`);
    }
  }

  // 3. Check for potentially untranslated content (same as source)
  // Skip if it's a URL or very short text (likely brand names, codes, etc.)
  for (const key of sourceKeys) {
    if (key in translated) {
      const sourceValue = source[key];
      const translatedValue = translated[key];

      // Skip if values are not strings
      if (typeof sourceValue !== 'string' || typeof translatedValue !== 'string') {
        continue;
      }

      // Skip if it's a URL (starts with http:// or https://)
      if (sourceValue.startsWith('http://') || sourceValue.startsWith('https://')) {
        continue;
      }

      // Skip if it's a path (starts with /)
      if (sourceValue.startsWith('/')) {
        continue;
      }

      // Skip very short strings (likely brand names, codes, etc.)
      if (sourceValue.length < minLengthForSameCheck) {
        continue;
      }

      // Check if translation is identical to source
      if (sourceValue === translatedValue) {
        warnings.push(`Possible untranslated content for key: ${key} (value: "${sourceValue}")`);
      }
    }
  }

  // 4. Check for extra keys in translation (not in source)
  for (const key of translatedKeys) {
    if (!(key in source)) {
      warnings.push(`Extra key in translation not in source: ${key}`);
    }
  }

  const result = {
    valid: errors.length === 0,
    errors,
    warnings,
  };

  logger.debug('Translation validation complete', {
    valid: result.valid,
    errorCount: errors.length,
    warningCount: warnings.length,
  });

  return result;
}

/**
 * Validate translated content file (with $meta)
 */
export function validateTranslationFile(
  sourceFile: any,
  translatedFile: any
): ValidationResult {
  // Remove $meta for validation
  const { $meta: sourceMeta, ...sourceContent } = sourceFile;
  const { $meta: translatedMeta, ...translatedContent } = translatedFile;

  return validateTranslation(sourceContent, translatedContent);
}
