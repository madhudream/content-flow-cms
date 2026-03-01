#!/usr/bin/env bun
/**
 * Content ID Extraction Script
 * 
 * Scans all apps and extracts content IDs from:
 * 1. React components (ContentComponent contentId props)
 * 2. BWO metadata JSON files (field contentId properties)
 * 
 * Generates a comprehensive report grouped by app and page.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

interface ContentIdEntry {
  id: string;
  file: string;
  line: number;
  type: 'text' | 'image' | 'metadata' | 'unknown';
}

interface AppReport {
  appId: string;
  pages: Map<string, ContentIdEntry[]>;
  totalIds: number;
}

const APPS_DIR = join(import.meta.dir, '../apps');
const APPS = ['demo', 'customer-portal', 'bwo-tax-forms'];

/**
 * Walk directory recursively
 */
function* walkDir(dir: string): Generator<string> {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      yield* walkDir(filePath);
    } else if (stat.isFile()) {
      yield filePath;
    }
  }
}

/**
 * Extract content IDs from React/TypeScript files
 */
function extractFromReactFile(filePath: string): ContentIdEntry[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const entries: ContentIdEntry[] = [];
  
  // Pattern 1: contentId="something"
  const contentIdPattern = /contentId=["']([^"']+)["']/g;
  
  // Pattern 2: data-content-id="something" (not needed since it's usually paired)
  // We'll just extract from contentId to avoid duplicates
  
  lines.forEach((line, index) => {
    let match;
    while ((match = contentIdPattern.exec(line)) !== null) {
      const id = match[1];
      
      // Determine type from context
      let type: 'text' | 'image' | 'unknown' = 'text';
      if (line.includes('type="image"') || id.includes('image') || id.includes('hero')) {
        type = 'image';
      }
      
      entries.push({
        id,
        file: filePath,
        line: index + 1,
        type,
      });
    }
    
    // Reset lastIndex for next line
    contentIdPattern.lastIndex = 0;
  });
  
  return entries;
}

/**
 * Extract content IDs from BWO metadata JSON files
 */
function extractFromMetadata(filePath: string): ContentIdEntry[] {
  const content = readFileSync(filePath, 'utf-8');
  const metadata = JSON.parse(content);
  const entries: ContentIdEntry[] = [];
  
  // Extract from sections -> fields -> contentId
  if (metadata.sections && Array.isArray(metadata.sections)) {
    for (const section of metadata.sections) {
      if (section.fields && Array.isArray(section.fields)) {
        for (const field of section.fields) {
          if (field.contentId) {
            entries.push({
              id: field.contentId,
              file: filePath,
              line: 0, // JSON doesn't have line numbers in our simple extraction
              type: 'metadata',
            });
          }
        }
      }
    }
  }
  
  return entries;
}

/**
 * Determine page ID from file path
 */
function inferPageId(filePath: string): string {
  // For React page files (e.g., /apps/demo/src/pages/HomePage.tsx -> home)
  if (filePath.includes('/pages/')) {
    const match = filePath.match(/\/pages\/([^/]+)\.(tsx?|jsx?)$/);
    if (match) {
      // Remove "Page" suffix if present
      const fileName = match[1].replace(/Page$/, '');
      return fileName.toLowerCase();
    }
  }
  
  // For metadata files (e.g., /apps/bwo-tax-forms/src/metadata/personal-info.json -> personal-info)
  if (filePath.includes('/metadata/')) {
    const match = filePath.match(/\/metadata\/([^/]+)\.json$/);
    if (match) {
      return match[1].toLowerCase();
    }
  }
  
  // For components like Header
  if (filePath.includes('/components/')) {
    return 'shared';
  }
  
  return 'unknown';
}

/**
 * Scan an app directory
 */
function scanApp(appId: string): AppReport {
  const appDir = join(APPS_DIR, appId, 'src');
  const report: AppReport = {
    appId,
    pages: new Map(),
    totalIds: 0,
  };
  
  if (!existsSync(appDir)) {
    console.warn(`⚠️  App directory not found: ${appDir}`);
    return report;
  }
  
  // Walk all files
  for (const filePath of walkDir(appDir)) {
    let entries: ContentIdEntry[] = [];
    
    // React/TypeScript files
    if (filePath.match(/\.(tsx?|jsx?)$/)) {
      entries = extractFromReactFile(filePath);
    }
    
    // BWO metadata JSON files
    if (filePath.includes('/metadata/') && filePath.endsWith('.json')) {
      entries = extractFromMetadata(filePath);
    }
    
    // Group by page
    if (entries.length > 0) {
      const pageId = inferPageId(filePath);
      
      if (!report.pages.has(pageId)) {
        report.pages.set(pageId, []);
      }
      
      report.pages.get(pageId)!.push(...entries);
      report.totalIds += entries.length;
    }
  }
  
  return report;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Extracting Content IDs from all apps...\n');
  
  const reports: AppReport[] = [];
  let grandTotal = 0;
  
  // Scan each app
  for (const appId of APPS) {
    console.log(`📦 Scanning ${appId}...`);
    const report = scanApp(appId);
    reports.push(report);
    grandTotal += report.totalIds;
    console.log(`   Found ${report.totalIds} content IDs across ${report.pages.size} pages\n`);
  }
  
  // Print detailed report
  console.log('\n' + '='.repeat(80));
  console.log('📊 CONTENT ID EXTRACTION REPORT');
  console.log('='.repeat(80) + '\n');
  
  for (const report of reports) {
    console.log(`\n${'▸'.repeat(3)} ${report.appId.toUpperCase()} (${report.totalIds} total)`);
    console.log('─'.repeat(80));
    
    // Sort pages
    const sortedPages = Array.from(report.pages.entries()).sort((a, b) => 
      a[0].localeCompare(b[0])
    );
    
    for (const [pageId, entries] of sortedPages) {
      console.log(`\n  📄 ${pageId} (${entries.length} IDs)`);
      
      // Sort entries by ID
      const sortedEntries = entries.sort((a, b) => a.id.localeCompare(b.id));
      
      for (const entry of sortedEntries) {
        const typeIcon = entry.type === 'image' ? '🖼️ ' : entry.type === 'metadata' ? '📋' : '📝';
        const filePath = relative(APPS_DIR, entry.file);
        console.log(`     ${typeIcon}  ${entry.id.padEnd(40)} ${filePath}:${entry.line || 'N/A'}`);
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`✅ Total: ${grandTotal} content IDs across ${APPS.length} apps`);
  console.log('='.repeat(80) + '\n');
  
  // Generate JSON output for programmatic use
  const jsonOutput = reports.map(r => ({
    appId: r.appId,
    totalIds: r.totalIds,
    pages: Array.from(r.pages.entries()).map(([pageId, entries]) => ({
      pageId,
      contentIds: entries.map(e => ({
        id: e.id,
        type: e.type,
        file: relative(APPS_DIR, e.file),
        line: e.line,
      })),
    })),
  }));
  
  const outputPath = join(import.meta.dir, '../specs/001-contentflow-cms/content-ids-report.json');
  const fs = require('fs');
  fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));
  console.log(`📁 JSON report saved to: ${relative(process.cwd(), outputPath)}\n`);
}

// Run
main();
