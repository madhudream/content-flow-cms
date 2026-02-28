import { useContentStore } from '../core/store';

/**
 * React hook to access content value for a specific contentId
 * Automatically determines pageId from current route context (simplified for Phase 1)
 *
 * @param contentId - Unique identifier for the content
 * @param pageId - Page identifier (optional, inferred from context if not provided)
 * @returns Content value or undefined if not found
 */
export function useContent(contentId: string, pageId?: string): string | undefined {
  const { config, contentMaps } = useContentStore((state) => ({
    config: state.config,
    contentMaps: state.contentMaps,
  }));

  if (!config || !pageId) {
    return undefined;
  }

  return contentMaps[pageId]?.[contentId];
}
