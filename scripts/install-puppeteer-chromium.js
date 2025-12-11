#!/usr/bin/env node

/**
 * Postinstall script to download Chromium for Puppeteer
 * This ensures Chromium is available for whatsapp-web.js
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const puppeteerPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'whatsapp-web.js',
  'node_modules',
  'puppeteer'
);

const installScriptPath = path.join(puppeteerPath, 'install.js');

console.log('🔍 Checking for Puppeteer Chromium...');

// Check if puppeteer directory exists
if (!fs.existsSync(puppeteerPath)) {
  console.log('⚠️  Puppeteer not found at:', puppeteerPath);
  console.log('   This is normal if whatsapp-web.js dependencies are not installed yet.');
  console.log('   Chromium will be downloaded when you run npm install.');
  process.exit(0);
}

// Check if install script exists
if (!fs.existsSync(installScriptPath)) {
  console.log('⚠️  Puppeteer install script not found at:', installScriptPath);
  process.exit(0);
}

// Check if Chromium is already downloaded
const chromiumPath = path.join(
  puppeteerPath,
  'node_modules',
  'puppeteer-core',
  '.local-chromium'
);

if (fs.existsSync(chromiumPath)) {
  console.log('✅ Chromium already downloaded');
  process.exit(0);
}

// Download Chromium
console.log('📥 Downloading Chromium for Puppeteer...');
try {
  // Remove PUPPETEER_SKIP_DOWNLOAD if it's set
  const env = { ...process.env };
  delete env.PUPPETEER_SKIP_DOWNLOAD;
  
  execSync('node install.js', {
    cwd: puppeteerPath,
    stdio: 'inherit',
    env: env,
  });
  
  console.log('✅ Chromium downloaded successfully');
} catch (error) {
  console.error('❌ Failed to download Chromium:', error.message);
  console.log('⚠️  You can manually download it by running:');
  console.log(`   cd ${puppeteerPath}`);
  console.log('   node install.js');
  // Don't exit with error - this is not critical for the build
  process.exit(0);
}

