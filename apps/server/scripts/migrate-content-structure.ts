#!/usr/bin/env bun
/**
 * Migration Script: Flat to Folder Structure
 * 
 * Migrates content files from old flat structure to new folder structure:
 * Old: demo-home-en-US.json
 * New: demo/en-US/home.json
 * 
 * Usage: bun run migrate-content-structure.ts
 */

import { join } from 'path';
import { readdir, rename, mkdir, copyFile } from 'fs/promises';
import { file } from 'bun';
import { parseOldFilename, buildContentPath } from '../src/utils/contentPaths';

const CONTENT_DIR = join(__dirname, '../content');
const DRY_RUN = process.argv.includes('--dry-run');

async function migrateContentStructure() {
  console.log('🔄 Starting content structure migration...');
  console.log(`📁 Content directory: ${CONTENT_DIR}`);
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No files will be moved\n');
  } else {
    console.log('✅ LIVE MODE - Files will be moved\n');
  }

  // Read all files in content directory
  const files = await readdir(CONTENT_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('.') && f !== 'apps.config.json');

  console.log(`Found ${jsonFiles.length} content files to migrate\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const filename of jsonFiles) {
    // Skip if already in folder structure (contains /)
    if (filename.includes('/')) {
      console.log(`⏭️  Skip: ${filename} (already in folder structure)`);
      skipped++;
      continue;
    }

    // Parse old filename
    const parts = parseOldFilename(filename);
    
    if (!parts) {
      console.log(`❌ Skip: ${filename} (invalid format)`);
      skipped++;
      continue;
    }

    // Build new path
    const newPath = buildContentPath(parts.appId, parts.lang, parts.pageId);
    const oldFilePath = join(CONTENT_DIR, filename);
    const newFilePath = join(CONTENT_DIR, newPath);

    console.log(`📝 ${filename} → ${newPath}`);

    if (!DRY_RUN) {
      try {
        // Create directory structure
        const dir = join(CONTENT_DIR, parts.appId, parts.lang);
        await mkdir(dir, { recursive: true });

        // Copy file to new location (keep original for safety)
        await copyFile(oldFilePath, newFilePath);
        
        // Verify the copy succeeded
        const newFileHandle = file(newFilePath);
        if (await newFileHandle.exists()) {
          migrated++;
          console.log(`   ✅ Migrated successfully`);
          
          // Uncomment the line below to delete old file after successful migration
          // await unlink(oldFilePath);
        } else {
          failed++;
          console.log(`   ❌ Failed to verify migrated file`);
        }
      } catch (error) {
        failed++;
        console.log(`   ❌ Error: ${error}`);
      }
    } else {
      migrated++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (DRY_RUN) {
    console.log(`\n💡 Run without --dry-run to actually migrate files`);
  } else {
    console.log(`\n✅ Migration complete!`);
    console.log(`⚠️  Old files are kept for safety. After verifying, you can delete them manually.`);
  }
}

// Run migration
migrateContentStructure().catch(console.error);
