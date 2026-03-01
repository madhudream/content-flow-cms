import { getStorageService } from '../services/StorageFactory';
import { logger } from '../utils/logger';
import { parseOldFilename, parseNewPath, buildContentPath, normalizeContentPath, isNewStylePath } from '../utils/contentPaths';

export default async function contentRoutes(req: Request, corsHeaders: Record<string, string>) {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/content', '');
  const storage = getStorageService();
  
  // GET /api/content/:filename - Read content file
  if (req.method === 'GET' && path.startsWith('/')) {
    const filename = path.slice(1);
    
    if (!filename) {
      return Response.json(
        { error: 'Filename required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Parse filename to validate format (supports both old and new formats)
    const parts = isNewStylePath(filename) ? parseNewPath(filename) : parseOldFilename(filename);
    
    if (!parts) {
      return Response.json(
        { error: 'Invalid filename format. Expected: {appId}-{pageId}-{lang}.json or {appId}/{lang}/{pageId}.json' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    try {
      // Try to read from new path first, fallback to old path
      let content;
      const newPath = buildContentPath(parts.appId, parts.lang, parts.pageId);
      
      try {
        content = await storage.readContent(newPath);
      } catch (error) {
        // Fallback to old path format
        const oldPath = `${parts.appId}-${parts.pageId}-${parts.lang}.json`;
        content = await storage.readContent(oldPath);
      }
      
      return Response.json(content, { headers: corsHeaders });
    } catch (error: any) {
      logger.error('Failed to read content', { filename, error: error.message });
      return Response.json(
        { error: error.message || 'Content file not found' },
        { status: 404, headers: corsHeaders }
      );
    }
  }
  
  // POST /api/content/:filename - Write content file
  if (req.method === 'POST' && path.startsWith('/')) {
    const filename = path.slice(1);
    
    if (!filename) {
      return Response.json(
        { error: 'Filename required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Parse filename to validate format (supports both old and new formats)
    const parts = isNewStylePath(filename) ? parseNewPath(filename) : parseOldFilename(filename);
    
    if (!parts) {
      return Response.json(
        { error: 'Invalid filename format. Expected: {appId}-{pageId}-{lang}.json or {appId}/{lang}/{pageId}.json' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    let payload: any;
    try {
      payload = await req.json();
    } catch (error) {
      return Response.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate payload has $meta
    if (!payload.$meta) {
      return Response.json(
        { error: 'Payload must include $meta object' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate $meta fields
    if (!payload.$meta.appId || !payload.$meta.pageId || !payload.$meta.lang) {
      return Response.json(
        { error: '$meta must include appId, pageId, and lang fields' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Verify filename matches $meta
    if (parts.appId !== payload.$meta.appId || parts.pageId !== payload.$meta.pageId || parts.lang !== payload.$meta.lang) {
      return Response.json(
        { error: `Filename does not match $meta fields` },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Always write to new path format
    const newPath = buildContentPath(parts.appId, parts.lang, parts.pageId);
    
    // Auto-increment version if file exists
    let version = 1;
    try {
      if (await storage.contentExists(newPath)) {
        const existingContent = await storage.readContent(newPath);
        version = (existingContent.$meta?.version || 0) + 1;
      }
    } catch (error) {
      // If existing file is corrupted, start fresh
      version = 1;
    }
    
    // Create final content with updated $meta
    const { $meta, ...contentKeys } = payload;
    const finalContent = {
      $meta: {
        appId: $meta.appId,
        pageId: $meta.pageId,
        lang: $meta.lang,
        version,
        updatedAt: new Date().toISOString(),
      },
      ...contentKeys,
    };
    
    // Write file to new path
    try {
      await storage.writeContent(newPath, finalContent);
      logger.info('Content saved', { path: newPath, version });
      return Response.json(finalContent, { headers: corsHeaders });
    } catch (error: any) {
      logger.error('Failed to write content', { path: newPath, error: error.message });
      return Response.json(
        { error: 'Failed to write content file' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
  
  return Response.json(
    { error: 'Method not allowed' },
    { status: 405, headers: corsHeaders }
  );
}