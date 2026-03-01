import { getStorageService } from '../services/StorageFactory';
import { logger } from '../utils/logger';

export default async function contentRoutes(req: Request, corsHeaders: HeadersInit) {
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
    
    // Validate filename format
    if (!filename.match(/^[a-z0-9-]+-[a-z0-9-]+-[a-z]{2}-[A-Z]{2}\.json$/i)) {
      return Response.json(
        { error: 'Invalid filename format. Expected: {appId}-{pageId}-{lang}.json' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    try {
      const content = await storage.readContent(filename);
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
    
    // Validate filename format
    if (!filename.match(/^[a-z0-9-]+-[a-z0-9-]+-[a-z]{2}-[A-Z]{2}\.json$/i)) {
      return Response.json(
        { error: 'Invalid filename format. Expected: {appId}-{pageId}-{lang}.json' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    let payload;
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
    const expectedFilename = `${payload.$meta.appId}-${payload.$meta.pageId}-${payload.$meta.lang}.json`;
    if (filename !== expectedFilename) {
      return Response.json(
        { error: `Filename "${filename}" does not match $meta fields. Expected: "${expectedFilename}"` },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Auto-increment version if file exists
    let version = 1;
    try {
      if (await storage.contentExists(filename)) {
        const existingContent = await storage.readContent(filename);
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
    
    // Write file
    try {
      await storage.writeContent(filename, finalContent);
      logger.info('Content saved', { filename, version });
      return Response.json(finalContent, { headers: corsHeaders });
    } catch (error: any) {
      logger.error('Failed to write content', { filename, error: error.message });
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