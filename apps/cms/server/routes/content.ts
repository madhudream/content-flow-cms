import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../../../data');

// Validation helpers
const isKebabCase = (str: string): boolean => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
const isLanguageCode = (str: string): boolean => /^[a-z]{2,3}(-[A-Z]{2})?$/.test(str);

const validateFilename = (filename: string): { valid: boolean; error?: string } => {
  // Must end with .json
  if (!filename.endsWith('.json')) {
    return { valid: false, error: 'Filename must end with .json' };
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
  if (parts.length >= 4 && /^[A-Z]{2}$/.test(parts[parts.length - 1])) {
    // Pattern: demo-home-en-US
    langParts = [parts[parts.length - 2], parts[parts.length - 1]];
    appPageParts = parts.slice(0, -2);
  } else {
    // Pattern: demo-home-en
    langParts = [parts[parts.length - 1]];
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

const validateContentKey = (key: string): { valid: boolean; error?: string } => {
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

// GET /api/content/:filename - Read content file
router.get('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename
    const validation = validateFilename(filename);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    const filePath = path.join(DATA_DIR, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Content file not found' });
    }
    
    // Read and parse file
    const data = fs.readFileSync(filePath, 'utf-8');
    const content = JSON.parse(data);
    
    res.json(content);
  } catch (error) {
    console.error('Error reading content file:', error);
    if (error instanceof SyntaxError) {
      return res.status(500).json({ error: 'Invalid JSON in content file' });
    }
    res.status(500).json({ error: 'Failed to read content file' });
  }
});

// POST /api/content/:filename - Write content file
router.post('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const payload = req.body;
    
    // Validate filename
    const filenameValidation = validateFilename(filename);
    if (!filenameValidation.valid) {
      return res.status(400).json({ error: filenameValidation.error });
    }
    
    // Validate payload has $meta
    if (!payload.$meta) {
      return res.status(400).json({ error: 'Payload must include $meta object' });
    }
    
    // Extract $meta and content keys
    const { $meta, ...contentKeys } = payload;
    
    // Validate content keys
    for (const key of Object.keys(contentKeys)) {
      const keyValidation = validateContentKey(key);
      if (!keyValidation.valid) {
        return res.status(400).json({ error: keyValidation.error });
      }
    }
    
    // Validate $meta fields
    if (!$meta.appId || !$meta.pageId || !$meta.lang) {
      return res.status(400).json({ 
        error: '$meta must include appId, pageId, and lang fields' 
      });
    }
    
    // Verify filename matches $meta
    const expectedFilename = `${$meta.appId}-${$meta.pageId}-${$meta.lang}.json`;
    if (filename !== expectedFilename) {
      return res.status(400).json({ 
        error: `Filename "${filename}" does not match $meta fields. Expected: "${expectedFilename}"` 
      });
    }
    
    const filePath = path.join(DATA_DIR, filename);
    
    // Auto-increment version if file exists
    let version = 1;
    if (fs.existsSync(filePath)) {
      const existingData = fs.readFileSync(filePath, 'utf-8');
      const existingContent = JSON.parse(existingData);
      version = (existingContent.$meta?.version || 0) + 1;
    }
    
    // Create final content with updated $meta
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
    fs.writeFileSync(filePath, JSON.stringify(finalContent, null, 2), 'utf-8');
    
    console.log(`✅ Saved content file: ${filename} (v${version})`);
    res.json(finalContent);
  } catch (error) {
    console.error('Error writing content file:', error);
    if (error instanceof SyntaxError) {
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    res.status(500).json({ error: 'Failed to write content file' });
  }
});

export default router;
