/**
 * Content Path Utilities
 * 
 * Handles conversion between old flat structure and new folder structure
 * Old: demo-home-en-US.json
 * New: demo/en-US/home.json
 */

export interface ContentPathParts {
  appId: string;
  pageId: string;
  lang: string;
}

// Known app IDs (should match apps.config.json)
const KNOWN_APP_IDS = ['demo', 'bwo-taxforms', 'customer-portal'];

// Known page IDs per app (should match apps.config.json) 
const KNOWN_PAGE_IDS: Record<string, string[]> = {
  'demo': ['home', 'about', 'services', 'contact'],
  'bwo-taxforms': ['home', 'personal-info', 'income'],
  'customer-portal': ['home', 'about', 'customers'],
};

/**
 * Parse old-style filename to extract parts (using known app/page IDs)
 * @param filename - e.g., "demo-home-en-US.json" or "bwo-taxforms-personal-info-en-US.json"
 * @returns Parts: { appId, pageId, lang }
 */
export function parseOldFilename(filename: string): ContentPathParts | null {
  // Remove .json extension
  const withoutExt = filename.replace(/\.json$/, '');
  
  // Lang is always last two parts (e.g., en-US, fr-FR)
  const parts = withoutExt.split('-');
  
  if (parts.length < 4) {
    return null; // Invalid format
  }
  
  // Last two parts are language (e.g., "en", "US")
  const lang = `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
  
  // Try to match against known app IDs (from longest to shortest)
  const sortedAppIds = [...KNOWN_APP_IDS].sort((a, b) => b.length - a.length);
  
  for (const appId of sortedAppIds) {
    if (withoutExt.startsWith(appId + '-')) {
      // Extract everything between appId and lang as pageId
      const withoutApp = withoutExt.slice(appId.length + 1); // +1 for the hyphen
      const withoutLang = withoutApp.slice(0, -(lang.length + 1)); // +1 for the hyphen
      const pageId = withoutLang;
      
      // Validate against known page IDs if available
      if (KNOWN_PAGE_IDS[appId] && !KNOWN_PAGE_IDS[appId].includes(pageId)) {
        continue; // Not a valid page for this app, try next app
      }
      
      return { appId, pageId, lang };
    }
  }
  
  // Fallback: assume single-word app ID
  const pageIdIndex = parts.length - 3;
  if (pageIdIndex < 1) {
    return null; // Not enough parts
  }
  
  const pageId = parts[pageIdIndex];
  const appId = parts.slice(0, pageIdIndex).join('-');
  
  if (!pageId || !appId) {
    return null;
  }
  
  return { appId, pageId, lang };
}

/**
 * Convert old-style filename to new folder structure path
 * @param filename - e.g., "demo-home-en-US.json"
 * @returns New path: "demo/en-US/home.json"
 */
export function convertToNewPath(filename: string): string | null {
  const parts = parseOldFilename(filename);
  if (!parts) return null;
  
  return `${parts.appId}/${parts.lang}/${parts.pageId}.json`;
}

/**
 * Build new-style path from components
 * @param appId - e.g., "demo"
 * @param lang - e.g., "en-US"
 * @param pageId - e.g., "home"
 * @returns Path: "demo/en-US/home.json"
 */
export function buildContentPath(appId: string, lang: string, pageId: string): string {
  return `${appId}/${lang}/${pageId}.json`;
}

/**
 * Parse new-style path to extract parts
 * @param path - e.g., "demo/en-US/home.json"
 * @returns Parts: { appId, pageId, lang }
 */
export function parseNewPath(path: string): ContentPathParts | null {
  // Remove .json extension
  const withoutExt = path.replace(/\.json$/, '');
  
  // Split by /
  const parts = withoutExt.split('/');
  
  if (parts.length !== 3) {
    return null; // Invalid format
  }
  
  const [appId, lang, pageId] = parts;
  
  if (!appId || !lang || !pageId) {
    return null;
  }
  
  return { appId, pageId, lang };
}

/**
 * Check if path is old-style (flat) or new-style (folder)
 * @param path - Path to check
 * @returns true if new-style, false if old-style
 */
export function isNewStylePath(path: string): boolean {
  return path.includes('/');
}

/**
 * Convert old filename to new path, or return as-is if already new style
 * @param pathOrFilename - Old or new style path
 * @returns New style path
 */
export function normalizeContentPath(pathOrFilename: string): string {
  if (isNewStylePath(pathOrFilename)) {
    return pathOrFilename; // Already new style
  }
  
  const converted = convertToNewPath(pathOrFilename);
  return converted || pathOrFilename; // Fallback to original if conversion fails
}
