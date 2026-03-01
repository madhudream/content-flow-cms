export const isKebabCase = (str: string): boolean => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
export const isLanguageCode = (str: string): boolean => /^[a-z]{2,3}(-[A-Z]{2})?$/.test(str);

export const validateFilename = (filename: string): { valid: boolean; error?: string } => {
  // Must end with .json
  if (!filename.endsWith('.json')) {
    return {valid: false, error: 'Filename must end with .json' };
  }
  
  // Remove .json
  const nameWithoutExt = filename.slice(0, -5);
  const parts = nameWithoutExt.split('-');
  
  // Must have at least 3 parts: appId-pageId-lang (e.g., demo-home-en or demo-home-en-US)
  if (parts.length < 3) {
    return { valid: false, error: 'Filename must follow pattern: {appId}-{pageId}-{lang}.json' };
  }
  
  // Extract language code (last 1 or 2 parts for patterns like "en" or "en-US")
  let langParts: string[];
  let appPageParts: string[];
  
  // Check if last part looks like country code (2 uppercase letters)
  const lastPart = parts[parts.length - 1];
  const secondLastPart = parts[parts.length - 2];
  
  if (parts.length >= 4 && lastPart && /^[A-Z]{2}$/.test(lastPart)) {
    // Pattern: demo-home-en-US
    langParts = [secondLastPart || '', lastPart];
    appPageParts = parts.slice(0, -2);
  } else {
    // Pattern: demo-home-en
    langParts = [lastPart || ''];
    appPageParts = parts.slice(0, -1);
  }
  
  // Validate app and page parts are kebab-case
  const appPageName = appPageParts.join('-');
  if (!isKebabCase(appPageName)) {
    return { valid: false, error: 'App and page IDs must use kebab-case format (lowercase with hyphens)' };
  }
  
  // Validate language code
  const langCode = langParts.join('-');
  if (!isLanguageCode(langCode)) {
    return { valid: false, error: 'Language code must be valid BCP 47 format (e.g., en, en-US, es-ES)' };
  }
  
  return { valid: true };
};

export const validateContentKey = (key: string): { valid: boolean; error?: string } => {
  if (key === '$meta') {
    return { valid: false, error: 'Content key cannot be $meta (reserved)' };
  }
  
  if (!isKebabCase(key)) {
    return { valid: false, error: `Content key "${key}" must use kebab-case format` };
  }
  
  if (key.length < 3 || key.length > 100) {
    return { valid: false, error: `Content key "${key}" must be between 3-100 characters` };
  }
  
  return { valid: true };
};