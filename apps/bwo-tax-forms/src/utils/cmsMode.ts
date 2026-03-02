/**
 * CMS Mode Detection Utility
 * Detects if the app is running inside CMS iframe
 * Uses multiple detection methods to ensure reliability across navigation
 */

// Store CMS mode globally to survive React Router navigation
let isCMSModeCache: boolean | null = null;

export function detectCMSMode(): boolean {
  // Return cached value if already detected
  if (isCMSModeCache !== null) {
    return isCMSModeCache;
  }

  // Method 1: Check query parameter (works on initial load)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('cms-mode') === 'true') {
    isCMSModeCache = true;
    sessionStorage.setItem('contentflow-cms-mode', 'true');
    console.log('[CMS Mode] ✅ Detected via query parameter');
    return true;
  }

  // Method 2: Check sessionStorage (persists across navigation)
  if (sessionStorage.getItem('contentflow-cms-mode') === 'true') {
    isCMSModeCache = true;
    console.log('[CMS Mode] ✅ Detected via sessionStorage');
    return true;
  }

  // Method 3: Check if running inside iframe
  if (window.parent !== window) {
    isCMSModeCache = true;
    sessionStorage.setItem('contentflow-cms-mode', 'true');
    console.log('[CMS Mode] ✅ Detected via iframe check');
    return true;
  }

  // Not in CMS mode
  isCMSModeCache = false;
  console.log('[CMS Mode] ❌ Not detected');
  return false;
}

// Reset cache (for testing)
export function resetCMSModeCache() {
  isCMSModeCache = null;
}

// Export singleton instance
export const isCMSMode = detectCMSMode();
