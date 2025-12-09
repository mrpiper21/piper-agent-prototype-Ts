const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../src/main/whatsapp-service.js');
const dest = path.join(__dirname, '../out/main/whatsapp-service.js');

const destDir = path.dirname(dest);
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(source, dest);
console.log('✓ Copied whatsapp-service.js to out/main/');