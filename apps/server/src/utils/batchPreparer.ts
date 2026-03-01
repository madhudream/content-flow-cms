import type { IContentStorage } from '../services/IContentStorage';
import { logger } from './logger';
import { parseOldFilename, parseNewPath, buildContentPath, isNewStylePath } from './contentPaths';

/**
 * Batch Request for OpenAI Batch API (JSONL format)
 */
export interface BatchRequest {
  custom_id: string;  // e.g., "demo-home-es-ES"
  method: "POST";
  url: "/v1/chat/completions";
  body: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature: number;
    response_format: { type: "json_object" };
  };
}

/**
 * Bulk Translation Request
 */
export interface BulkTranslationRequest {
  sourceLang: string;         // e.g., "en-US"
  targetLangs: string[];      // e.g., ["es-ES", "fr-FR", "de-DE", "ja-JP"]
  appIds?: string[];          // Optional: filter by apps (default: all)
}

/**
 * Parse filename to extract appId, pageId, and language
 * Supports both old flat format and new folder format
 * @param filename - e.g., "demo-home-en-US.json" or "demo/en-US/home.json"
 * @returns Object with appId, pageId, lang
 */
export function parseFilename(filename: string): { appId: string; pageId: string; lang: string } | null {
  const parts = isNewStylePath(filename) ? parseNewPath(filename) : parseOldFilename(filename);
  
  if (!parts) {
    logger.warn('Invalid content filename format', { filename });
    return null;
  }

  return parts;
}

/**
 * Build translation prompt for OpenAI
 */
export function buildTranslationPrompt(
  sourceContent: any,
  targetLang: string,
  glossary: any,
  context: { appId: string; pageId: string }
): string {
  let prompt = `Translate the following web content from JSON format. Preserve ALL keys exactly as they are.\n\n`;
  prompt += `Target Language: ${targetLang}\n`;
  prompt += `Context: ${context.appId} - ${context.pageId} page\n\n`;

  // Add glossary if available
  if (glossary?.terms && Object.keys(glossary.terms).length > 0) {
    prompt += `IMPORTANT - Use these exact translations for the following terms:\n`;
    prompt += JSON.stringify(glossary.terms, null, 2) + '\n\n';
  }

  // Strip $meta from source content for translation
  const contentToTranslate = { ...sourceContent };
  delete contentToTranslate.$meta;

  prompt += `Source Content (JSON):\n`;
  prompt += JSON.stringify(contentToTranslate, null, 2) + '\n\n';
  prompt += `Return the translated content as valid JSON with the SAME keys. Do not include $meta in the response. Only translate the values, not the keys. Preserve URLs and image paths exactly as they are.`;

  return prompt;
}

/**
 * Prepare batch requests for OpenAI Batch API
 */
export async function prepareBatchRequests(
  request: BulkTranslationRequest,
  storage: IContentStorage,
  model: string,
  temperature: number,
  loadGlossary: (appId: string, lang: string) => Promise<any>
): Promise<BatchRequest[]> {
  logger.info('Preparing batch translation requests', {
    sourceLang: request.sourceLang,
    targetLangs: request.targetLangs,
    appFilter: request.appIds,
  });

  // 1. Scan all content files
  const allFiles = await storage.listContent();
  
  // Filter for source language files (supports both old and new format)
  const sourceFiles = allFiles.filter((f) => {
    // Skip config files
    if (f === 'apps.config.json' || f === 'example.json' || f.startsWith('translation-batches/') || f.startsWith('costs/') || f.startsWith('images/')) {
      return false;
    }
    
    // Check if file matches source language
    if (isNewStylePath(f)) {
      // New format: demo/en-US/home.json
      return f.includes(`/${request.sourceLang}/`) && f.endsWith('.json');
    } else {
      // Old format: demo-home-en-US.json
      return f.endsWith(`-${request.sourceLang}.json`);
    }
  });

  logger.debug('Found source files', { count: sourceFiles.length, files: sourceFiles });

  // 2. Build batch requests
  const batchRequests: BatchRequest[] = [];

  for (const sourceFile of sourceFiles) {
    const parsed = parseFilename(sourceFile);
    
    if (!parsed) {
      logger.warn('Skipping file with invalid format', { file: sourceFile });
      continue;
    }
    
    const { appId, pageId, lang } = parsed;

    // Apply appId filter if provided
    if (request.appIds && request.appIds.length > 0 && !request.appIds.includes(appId)) {
      logger.debug('Skipping file due to appId filter', { file: sourceFile, appId });
      continue;
    }

    // Load source content
    const sourceContent = await storage.readContent(sourceFile);

    // For each target language
    for (const targetLang of request.targetLangs) {
      // Skip if target is same as source
      if (targetLang === request.sourceLang) {
        logger.debug('Skipping same language', { sourceLang: request.sourceLang, targetLang });
        continue;
      }

      // Load glossary for target language
      const targetGlossary = await loadGlossary(appId, targetLang);

      const customId = `${appId}-${pageId}-${targetLang}`;
      const prompt = buildTranslationPrompt(sourceContent, targetLang, targetGlossary, { appId, pageId });

      batchRequests.push({
        custom_id: customId,
        method: "POST",
        url: "/v1/chat/completions",
        body: {
          model,
          messages: [
            {
              role: "system",
              content: `You are a professional translator. Translate JSON content to ${targetLang}. Return ONLY valid JSON with the same keys. Preserve content IDs, URLs, and image paths. Use the glossary for specific terms if provided.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature,
          response_format: { type: "json_object" }
        }
      });
    }
  }

  logger.info('Batch preparation complete', {
    totalRequests: batchRequests.length,
    sourceFiles: sourceFiles.length,
    targetLanguages: request.targetLangs.length,
  });

  return batchRequests;
}

/**
 * Convert batch requests to JSONL format
 */
export function batchRequestsToJsonl(requests: BatchRequest[]): string {
  return requests.map((req) => JSON.stringify(req)).join('\n');
}
