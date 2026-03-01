import { useContentStore } from '../core/store';

/**
 * Infer pageId from current browser URL path
 * Handles base paths like /portal/, /bwo/, /demo/
 * Examples:
 *   / -> home
 *   /portal -> home
 *   /portal/ -> home
 *   /portal/about -> about
 *   /bwo/personal-info -> personal-info
 *   /demo/contact -> contact
 */
function inferPageIdFromUrl(): string {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  
  // If no segments (root path), default to 'home'
  if (segments.length === 0) {
    return 'home';
  }
  
  // If only one segment and it's a known app base (portal, bwo, demo, cms), default to 'home'
  const knownAppBases = ['portal', 'bwo', 'demo', 'cms'];
  if (segments.length === 1 && knownAppBases.includes(segments[0])) {
    return 'home';
  }
  
  // If path has an app base as first segment, return the second segment as pageId
  if (segments.length >= 2 && knownAppBases.includes(segments[0])) {
    return segments[1];
  }
  
  // Otherwise return last segment as pageId
  return segments[segments.length - 1];
}

/**
 * React hook to access content value for a specific contentId
 * Automatically determines pageId from current route context (simplified for Phase 1)
 *
 * @param contentId - Unique identifier for the content
 * @param pageId - Page identifier (optional, inferred from URL if not provided)
 * @returns Content value or undefined if not found
 */
export function useContent(contentId: string, pageId?: string): string | undefined {
  const { config, contentMaps } = useContentStore((state) => ({
    config: state.config,
    contentMaps: state.contentMaps,
  }));

  if (!config) {
    return undefined;
  }

  // Use provided pageId or infer from URL
  const resolvedPageId = pageId || inferPageIdFromUrl();

  return contentMaps[resolvedPageId]?.[contentId];
}
