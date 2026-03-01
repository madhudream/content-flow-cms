import OpenAI from 'openai';
import type { IContentStorage } from './IContentStorage';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  type BulkTranslationRequest,
  type BatchRequest,
  prepareBatchRequests,
  batchRequestsToJsonl,
} from '../utils/batchPreparer';
import { validateTranslation } from '../utils/validateTranslation';
import { parseOldFilename, buildContentPath } from '../utils/contentPaths';

/**
 * Translation Service using OpenAI Batch API
 * 
 * Handles bulk translation of content files using OpenAI's Batch API
 * for cost-effective translation (50% discount vs standard API).
 */
export class TranslationService {
  private openai: OpenAI;
  private storage: IContentStorage;
  private model: string;
  private temperature: number;

  constructor(storage: IContentStorage) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey,
    });

    this.storage = storage;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.3');

    logger.info('TranslationService initialized', {
      model: this.model,
      temperature: this.temperature,
    });
  }

  /**
   * Test connection to OpenAI Batch API
   */
  async testConnection(): Promise<boolean> {
    try {
      // List batches to verify API access
      const batches = await this.openai.batches.list({ limit: 1 });
      logger.info('OpenAI Batch API connection successful', {
        batchesAvailable: batches.data.length,
      });
      return true;
    } catch (error) {
      logger.error('Failed to connect to OpenAI Batch API', { error });
      throw new Error(`OpenAI Batch API connection failed: ${error}`);
    }
  }

  /**
   * Load glossary for a specific app and language
   * Returns empty glossary if not found
   */
  private async loadGlossary(appId: string, lang: string): Promise<any> {
    try {
      const glossaryFile = `glossaries/${appId}-${lang}.json`;
      const glossary = await this.storage.readContent(glossaryFile);
      logger.debug('Glossary loaded', { appId, lang, termCount: Object.keys(glossary.terms || {}).length });
      return glossary;
    } catch (error) {
      // Glossary not found - return empty
      logger.debug('Glossary not found, using empty', { appId, lang });
      return { terms: {} };
    }
  }

  /**
   * Prepare batch translation requests (JSONL format)
   */
  async prepareBulkTranslation(request: BulkTranslationRequest): Promise<{
    batchRequests: BatchRequest[];
    jsonl: string;
  }> {
    logger.info('Preparing bulk translation', {
      sourceLang: request.sourceLang,
      targetLangs: request.targetLangs,
      appIds: request.appIds,
    });

    const batchRequests = await prepareBatchRequests(
      request,
      this.storage,
      this.model,
      this.temperature,
      this.loadGlossary.bind(this)
    );

    const jsonl = batchRequestsToJsonl(batchRequests);

    logger.info('Batch preparation complete', {
      totalRequests: batchRequests.length,
    });

    return { batchRequests, jsonl };
  }

  /**
   * Upload batch file and create batch job
   */
  async uploadAndCreateBatch(
    jsonlContent: string,
    metadata: {
      sourceLang: string;
      targetLangs: string[];
      totalRequests: number;
      fileIds: string[];
      appIds?: string[];  // Optional app filter
    }
  ): Promise<string> {
    logger.info('Uploading batch file to OpenAI', {
      size: jsonlContent.length,
      requests: metadata.totalRequests,
    });

    try {
      // 1. Create a temporary file-like object from the JSONL content
      const blob = new Blob([jsonlContent], { type: 'application/jsonl' });
      const file = new File([blob], `batch-${Date.now()}.jsonl`, { type: 'application/jsonl' });

      // 2. Upload to OpenAI Files API
      const uploadedFile = await this.openai.files.create({
        file: file,
        purpose: 'batch',
      });

      logger.info('File uploaded to OpenAI', {
        fileId: uploadedFile.id,
        filename: uploadedFile.filename,
        bytes: uploadedFile.bytes,
      });

      // 3. Create batch job
      const batch = await this.openai.batches.create({
        input_file_id: uploadedFile.id,
        endpoint: '/v1/chat/completions',
        completion_window: '24h',
        metadata: {
          source_lang: metadata.sourceLang,
          target_langs: metadata.targetLangs.join(','),
          file_count: String(metadata.totalRequests),
        },
      });

      logger.info('Batch job created', {
        batchId: batch.id,
        status: batch.status,
        inputFileId: uploadedFile.id,
      });

      // 4. Store batch metadata in storage
      const batchMetadata = {
        batchId: batch.id,
        status: batch.status,
        sourceLang: metadata.sourceLang,
        targetLangs: metadata.targetLangs,
        totalRequests: metadata.totalRequests,
        fileIds: metadata.fileIds,
        appIds: metadata.appIds,  // Store appIds for filtering
        inputFileId: uploadedFile.id,
        model: this.model,  // Track which model was used
        temperature: this.temperature,  // Track temperature setting
        createdAt: new Date().toISOString(),
        completedAt: null,
      };

      await this.saveBatchMetadata(batch.id, batchMetadata);

      logger.info('Batch metadata saved', { batchId: batch.id, model: this.model });

      return batch.id;
    } catch (error) {
      logger.error('Failed to upload and create batch', { error });
      throw new Error(`Batch upload failed: ${error}`);
    }
  }

  /**
   * Save batch metadata to storage
   */
  private async saveBatchMetadata(batchId: string, metadata: any): Promise<void> {
    try {
      const filename = `translation-batches/${batchId}.json`;
      await this.storage.writeContent(filename, metadata);
      logger.debug('Batch metadata saved', { batchId, filename });
    } catch (error) {
      logger.error('Failed to save batch metadata', { batchId, error });
      // Don't throw - this is not critical, batch is already created in OpenAI
    }
  }

  /**
   * Read batch metadata from storage
   */
  private async readBatchMetadata(batchId: string): Promise<any> {
    try {
      const filename = `translation-batches/${batchId}.json`;
      const metadata = await this.storage.readContent(filename);
      return metadata;
    } catch (error) {
      logger.warn('Failed to read batch metadata', { batchId, error });
      return null;
    }
  }

  /**
   * Update batch metadata with completion status
   */
  private async updateBatchMetadata(batchId: string, updates: any): Promise<void> {
    try {
      const current = await this.readBatchMetadata(batchId);
      if (current) {
        const updated = { ...current, ...updates };
        await this.saveBatchMetadata(batchId, updated);
        logger.info('Batch metadata updated', { batchId, updates });
      }
    } catch (error) {
      logger.error('Failed to update batch metadata', { batchId, error });
    }
  }

  /**
   * Check batch status from OpenAI
   */
  async checkBatchStatus(batchId: string): Promise<{
    batchId: string;
    status: string;
    progress: {
      total: number;
      completed: number;
      failed: number;
    };
    createdAt: string;
    completedAt: string | null;
    outputFileId?: string;
    errorFileId?: string;
  }> {
    try {
      logger.info('Checking batch status', { batchId });

      const batch = await this.openai.batches.retrieve(batchId);

      const status = {
        batchId: batch.id,
        status: batch.status,
        progress: {
          total: batch.request_counts?.total || 0,
          completed: batch.request_counts?.completed || 0,
          failed: batch.request_counts?.failed || 0,
        },
        createdAt: new Date(batch.created_at * 1000).toISOString(),
        completedAt: batch.completed_at ? new Date(batch.completed_at * 1000).toISOString() : null,
        outputFileId: batch.output_file_id,
        errorFileId: batch.error_file_id,
      };

      logger.info('Batch status retrieved', {
        batchId,
        status: status.status,
        progress: status.progress,
      });

      return status;
    } catch (error) {
      logger.error('Failed to check batch status', { batchId, error });
      throw new Error(`Failed to retrieve batch status: ${error}`);
    }
  }

  /**
   * Process batch results after completion
   */
  async processBatchResults(batchId: string): Promise<{
    filesTranslated: number;
    filesFailed: number;
    savedFiles: string[];
    failedFiles: string[];
    totalInputTokens: number;
    totalOutputTokens: number;
    appIds: string[];  // Track which apps were translated
  }> {
    try {
      logger.info('Processing batch results', { batchId });

      // 1. Retrieve batch info
      const batch = await this.openai.batches.retrieve(batchId);

      if (batch.status !== 'completed') {
        throw new Error(`Batch not completed yet. Current status: ${batch.status}`);
      }

      if (!batch.output_file_id) {
        throw new Error('Batch completed but no output file available');
      }

      // 2. Download output file
      logger.info('Downloading batch output file', { fileId: batch.output_file_id });
      const outputFile = await this.openai.files.content(batch.output_file_id);
      const outputText = await outputFile.text();

      // 3. Parse JSONL output (one result per line)
      const results = outputText
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => JSON.parse(line));

      logger.info('Parsed batch results', { totalResults: results.length });

      // 4. Process each result
      const savedFiles: string[] = [];
      const failedFiles: string[] = [];
      const appIdsSet = new Set<string>();  // Track unique app IDs
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      for (const result of results) {
        const customId = result.custom_id; // e.g., "demo-home-es-ES"

        try {
          if (result.response?.status_code === 200) {
            // Extract translated content from response
            const messageContent = result.response.body.choices[0].message.content;
            const translatedContent = JSON.parse(messageContent);

            // Parse custom_id to get filename components
            // customId format: "{appId}-{pageId}-{targetLang}"
            const parts = parseOldFilename(`${customId}.json`);
            
            if (!parts) {
              logger.error('Failed to parse customId', { customId });
              failedFiles.push(customId);
              continue;
            }
            
            const { appId, pageId, lang } = parts;
            
            // Track app ID
            appIdsSet.add(appId);

            // Load the original source file to get $meta and validate
            // Try new path first, fallback to old path
            const sourcePathNew = buildContentPath(appId, 'en-US', pageId);
            const sourcePathOld = `${appId}-${pageId}-en-US.json`;
            
            let sourceMeta;
            let sourceContent;
            try {
              let sourceData;
              try {
                sourceData = await this.storage.readContent(sourcePathNew);
              } catch (error) {
                sourceData = await this.storage.readContent(sourcePathOld);
              }
              
              sourceMeta = sourceData.$meta;
              const { $meta, ...content } = sourceData;
              sourceContent = content;

              // Validate translation
              const validation = validateTranslation(sourceContent, translatedContent);
              if (!validation.valid) {
                logger.warn('Translation validation failed', {
                  customId,
                  errors: validation.errors,
                  warnings: validation.warnings,
                });
                // Continue anyway but log the issues
              } else if (validation.warnings.length > 0) {
                logger.info('Translation has warnings', {
                  customId,
                  warnings: validation.warnings,
                });
              }
            } catch (error) {
              logger.warn('Failed to load source file for validation', { customId, error });
              sourceMeta = {
                appId,
                pageId,
                lang,
                version: 1,
              };
              sourceContent = {};
            }

            // Create final translated content with $meta
            const finalContent = {
              $meta: {
                ...sourceMeta,
                appId,
                pageId,
                lang,
                version: (sourceMeta?.version || 0) + 1,
                updatedAt: new Date().toISOString(),
                translatedFrom: 'en-US',
                translatedAt: new Date().toISOString(),
              },
              ...translatedContent,
            };

            // Save to storage using new path format
            const newPath = buildContentPath(appId, lang, pageId);
            await this.storage.writeContent(newPath, finalContent);
            savedFiles.push(newPath);

            // Accumulate token usage
            const usage = result.response.body.usage;
            if (usage) {
              totalInputTokens += usage.prompt_tokens || 0;
              totalOutputTokens += usage.completion_tokens || 0;
            }

            logger.info('Translation saved', { path: newPath, customId });
          } else {
            // Translation failed
            const errorMsg = result.error?.message || result.response?.body?.error?.message || 'Unknown error';
            logger.error('Translation failed for custom_id', { 
              customId, 
              statusCode: result.response?.status_code,
              error: errorMsg 
            });
            failedFiles.push(customId);
          }
        } catch (error) {
          logger.error('Failed to process translation result', { customId, error });
          failedFiles.push(customId);
        }
      }

      const summary = {
        filesTranslated: savedFiles.length,
        filesFailed: failedFiles.length,
        savedFiles,
        failedFiles,
        totalInputTokens,
        totalOutputTokens,
        appIds: Array.from(appIdsSet),  // Convert Set to Array
      };

      logger.info('Batch results processing complete', summary);

      // Update batch metadata with completion status
      await this.updateBatchMetadata(batchId, {
        status: 'completed',
        completedAt: new Date(batch.completed_at! * 1000).toISOString(),
        filesTranslated: savedFiles.length,
        filesFailed: failedFiles.length,
        totalCost: this.calculateCost(totalInputTokens, totalOutputTokens).totalCost,
        appIds: Array.from(appIdsSet),  // Store in metadata too
      });

      return summary;
    } catch (error) {
      logger.error('Failed to process batch results', { batchId, error });
      throw new Error(`Batch results processing failed: ${error}`);
    }
  }

  /**
   * Calculate translation cost from token usage
   * Uses OpenAI Batch API pricing for GPT-5.1 (50% discount already applied):
   * - Input: $0.625 per 1M tokens (batch pricing)
   * - Output: $5.00 per 1M tokens (batch pricing)
   */
  calculateCost(inputTokens: number, outputTokens: number): {
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
    costPerFile: number;
    filesTranslated: number;
  } {
    // Batch API pricing (GPT-5.1 with 50% discount)
    const INPUT_COST_PER_1M = 0.625; // $0.625 per 1M tokens
    const OUTPUT_COST_PER_1M = 5.0; // $5.00 per 1M tokens

    const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_1M;
    const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M;
    const totalCost = inputCost + outputCost;

    logger.info('Cost calculated', {
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
      totalCost,
    });

    return {
      inputTokens,
      outputTokens,
      inputCost: parseFloat(inputCost.toFixed(6)),
      outputCost: parseFloat(outputCost.toFixed(6)),
      totalCost: parseFloat(totalCost.toFixed(6)),
      costPerFile: 0, // Will be calculated after processing
      filesTranslated: 0, // Will be set after processing
    };
  }

  /**
   * Get OpenAI client instance (for testing)
   */
  getClient(): OpenAI {
    return this.openai;
  }
}
