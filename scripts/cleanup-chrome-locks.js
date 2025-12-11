#!/usr/bin/env node

/**
 * Utility script to clean up Chrome debug log files that may be locked
 * Run this if you encounter EBUSY errors with chrome_debug.log
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

const userDataPath = process.platform === 'win32'
  ? path.join(process.env.APPDATA || process.env.USERPROFILE, 'printmyfile-agent')
  : process.platform === 'darwin'
  ? path.join(os.homedir(), 'Library', 'Application Support', 'printmyfile-agent')
  : path.join(os.homedir(), '.config', 'printmyfile-agent');

const debugLogPath = path.join(userDataPath, '.wwebjs_auth', 'session', 'Default', 'chrome_debug.log');

console.log('🧹 Cleaning up Chrome debug log...');
console.log('Path:', debugLogPath);

if (!fs.existsSync(debugLogPath)) {
  console.log('✅ No debug log file found');
  process.exit(0);
}

try {
  // Try to delete the file
  fs.unlinkSync(debugLogPath);
  console.log('✅ Successfully deleted chrome_debug.log');
} catch (error) {
  if (error.code === 'EBUSY' || error.code === 'EPERM') {
    console.log('⚠️  File is locked. This usually means Chrome is still running.');
    console.log('   Please:');
    console.log('   1. Close the PrintMyFile Agent application');
    console.log('   2. Check Task Manager for any Chrome/Chromium processes');
    console.log('   3. Kill any remaining Chrome processes');
    console.log('   4. Run this script again');
    
    if (process.platform === 'win32') {
      console.log('\n   Or run this command to kill Chrome processes:');
      console.log('   taskkill /F /IM chrome.exe /T');
      console.log('   taskkill /F /IM chromium.exe /T');
    }
  } else {
    console.error('❌ Error deleting file:', error.message);
  }
  process.exit(1);
}

