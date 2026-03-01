#!/usr/bin/env node

import { existsSync, rmSync, mkdirSync, cpSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const serverPublicDir = resolve(rootDir, 'apps/server/public');

console.log('🚀 Building ContentFlow for deployment...\n');

// Clean server/public directory
console.log('🧹 Cleaning previous build...');
if (existsSync(serverPublicDir)) {
  rmSync(serverPublicDir, { recursive: true, force: true });
}
mkdirSync(serverPublicDir, { recursive: true });

// Step 1: Build SDK
console.log('\n📦 Building SDK...');
try {
  execSync('npm run build --workspace=packages/sdk', { 
    cwd: rootDir, 
    stdio: 'inherit' 
  });
  console.log('✅ SDK built successfully');
} catch (error) {
  console.error('❌ SDK build failed');
  process.exit(1);
}

// Step 2: Build all apps
const apps = ['cms', 'bwo-tax-forms', 'demo', 'customer-portal'];

for (const app of apps) {
  console.log(`\n📦 Building ${app}...`);
  try {
    execSync(`npm run build --workspace=apps/${app}`, { 
      cwd: rootDir, 
      stdio: 'inherit' 
    });
    console.log(`✅ ${app} built successfully`);
  } catch (error) {
    console.error(`❌ ${app} build failed`);
    process.exit(1);
  }
}

// Step 3: Copy built files to server/public
console.log('\n📋 Copying built apps to server/public/...');

const appMappings = {
  'cms': 'cms',
  'bwo-tax-forms': 'bwo',
  'demo': 'demo',
  'customer-portal': 'portal'
};

for (const [appFolder, publicName] of Object.entries(appMappings)) {
  const sourcePath = resolve(rootDir, `apps/${appFolder}/dist`);
  const destPath = resolve(serverPublicDir, publicName);
  
  if (existsSync(sourcePath)) {
    cpSync(sourcePath, destPath, { recursive: true });
    console.log(`✅ Copied ${appFolder} → server/public/${publicName}`);
  } else {
    console.warn(`⚠️  Warning: ${sourcePath} not found`);
  }
}

console.log('\n✨ Build complete! All apps ready in apps/server/public/');
console.log('\n📂 Structure:');
console.log('   apps/server/public/');
console.log('   ├── cms/       → CMS Portal');
console.log('   ├── bwo/       → BWO Tax Forms');
console.log('   ├── demo/      → Demo App');
console.log('   └── portal/    → Customer Portal');
console.log('\n🚀 Run: cd apps/server && bun run start');
