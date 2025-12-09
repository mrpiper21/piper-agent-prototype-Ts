const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../src/main/whatsapp-service.js');
const dest = path.join(__dirname, '../out/main/whatsapp-service.js');

// Check if source file exists
if (!fs.existsSync(source)) {
  console.error(`❌ ERROR: Source file not found: ${source}`);
  process.exit(1);
}

// Ensure destination directory exists
const destDir = path.dirname(dest);
if (!fs.existsSync(destDir)) {
  console.log(`📁 Creating directory: ${destDir}`);
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy the file
try {
  fs.copyFileSync(source, dest);
  console.log(`✅ Copied whatsapp-service.js to ${dest}`);
  
  // Verify the copy was successful
  if (fs.existsSync(dest)) {
    const stats = fs.statSync(dest);
    console.log(`✅ Verified: File exists (${stats.size} bytes)`);
  } else {
    console.error(`❌ ERROR: Copy failed - destination file not found: ${dest}`);
    process.exit(1);
  }
} catch (error) {
  console.error(`❌ ERROR: Failed to copy file: ${error.message}`);
  process.exit(1);
}