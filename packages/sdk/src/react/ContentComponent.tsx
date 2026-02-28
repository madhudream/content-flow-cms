import React, { useEffect, useState } from 'react';
import { useContent } from './hooks';

/**
 * Props for ContentComponent
 */
export interface ContentComponentProps {
  /**
   * Unique identifier for this content element
   */
  contentId: string;

  /**
   * Page identifier - required to look up content
   */
  pageId: string;

  /**
   * Default text to display when no override exists
   */
  defaultText?: string;

  /**
   * Default image src to display when type=image and no override exists
   */
  defaultSrc?: string;

  /**
   * Content type
   */
  type?: 'text' | 'image';

  /**
   * CSS class name
   */
  className?: string;

  /**
   * Image alt text (for type=image)
   */
  alt?: string;

  /**
   * HTML element tag to render (default: span for text, img for image)
   */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * ContentComponent - Framework component for rendering editable content
 *
 * Shows content override from CMS or falls back to defaultText/defaultSrc.
 * Always includes data-content-id attribute for CMS highlight discovery.
 *
 * @example
 * ```tsx
 * <ContentComponent
 *   contentId="hero-title"
 *   pageId="home"
 *   defaultText="Welcome to ContentFlow"
 *   data-content-id="hero-title"
 * />
 * ```
 */
export function ContentComponent({
  contentId,
  pageId,
  defaultText = '',
  defaultSrc = '',
  type = 'text',
  className = '',
  alt = '',
  as,
}: ContentComponentProps): React.ReactElement {
  const override = useContent(contentId, pageId);
  const [content, setContent] = useState<string>(override || (type === 'image' ? defaultSrc : defaultText));

  // Update content when override changes (for live preview)
  useEffect(() => {
    const newContent = override || (type === 'image' ? defaultSrc : defaultText);
    setContent(newContent);
  }, [override, defaultText, defaultSrc, type]);

  // Listen for CMS preview updates
  useEffect(() => {
    const handlePreviewUpdate = (event: MessageEvent) => {
      if (event.data?.type === 'CONTENTFLOW_PREVIEW_UPDATE') {
        const { contentId: updatedId, newValue } = event.data;
        if (updatedId === contentId) {
          setContent(newValue);
        }
      }
    };

    window.addEventListener('message', handlePreviewUpdate);
    return () => window.removeEventListener('message', handlePreviewUpdate);
  }, [contentId]);

  // Render image
  if (type === 'image') {
    const Element = (as || 'img') as 'img';
    return (
      <Element
        src={content}
        alt={alt}
        className={className}
        data-content-id={contentId}
      />
    );
  }

  // Render text
  const Element = (as || 'span') as 'span';
  return (
    <Element className={className} data-content-id={contentId}>
      {content}
    </Element>
  );
}
