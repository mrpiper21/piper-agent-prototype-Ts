const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get version from package.json
const packageJson = require('../package.json');
const version = packageJson.version;
const versionDir = path.join(__dirname, '../release', version);

console.log(`🧹 Cleaning release directory for version ${version}...`);

function removeDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log('Version directory does not exist, skipping cleanup.');
    return;
  }

  try {
    // First, try to kill any processes that might be locking files
    try {
      execSync('taskkill /F /IM "PrintMyFile Agent.exe" 2>nul', { stdio: 'ignore' });
    } catch (e) {
      // Ignore if no processes found
    }

    // Try to remove the directory with retries
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log('✅ Version directory cleaned successfully');
        return;
      } catch (error) {
        lastError = error;
        if (error.code === 'EBUSY') {
          console.log(`⚠️  Files locked, retrying... (${retries} attempts left)`);
          // Wait 2 seconds before retry
          const start = Date.now();
          while (Date.now() - start < 2000) {
            // Busy wait
          }
          retries--;
        } else {
          throw error;
        }
      }
    }

    // If all retries failed, try to rename the directory
    if (lastError && lastError.code === 'EBUSY') {
      console.warn('⚠️  Files are still locked after retries');
      console.warn('⚠️  Attempting to rename directory to allow build to continue...');
      
      const timestamp = Date.now();
      const backupDir = `${dirPath}.locked.${timestamp}`;
      try {
        // Try to rename just the version directory
        fs.renameSync(dirPath, backupDir);
        console.log(`✅ Renamed locked directory to: ${path.basename(backupDir)}`);
        console.log('✅ electron-builder can now create a fresh directory');
        console.log(`💡 You can manually delete ${backupDir} later when files are unlocked`);
        return;
      } catch (renameError) {
        console.warn('⚠️  Could not rename directory (likely OneDrive is syncing)');
        console.warn('⚠️  Attempting workaround: electron-builder may still succeed');
        console.warn('💡 If build fails, try:');
        console.warn('   1. Pause OneDrive sync temporarily');
        console.warn('   2. Close File Explorer windows');
        console.warn('   3. Manually delete: release\\' + version);
        // Don't exit with error - let electron-builder try
        return;
      }
    } else {
      throw lastError;
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Directory already removed');
      return;
    }
    console.warn('⚠️  Error cleaning directory:', error.message);
    console.warn('⚠️  Continuing - electron-builder will attempt to handle it');
    // Don't exit with error - let electron-builder try
  }
}

removeDir(versionDir);

