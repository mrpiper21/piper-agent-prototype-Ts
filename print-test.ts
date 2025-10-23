import { PrinterManager } from './src/core/printer/PrinterManager.js';
import { logger } from './src/utils/logger.js';
import path from 'path';

async function main() {
  try {
    // Create printer manager
    const manager = new PrinterManager();
    
    // Discover printers
    console.log('🔍 Discovering printers...');
    const printers = await manager.discoverPrinters();
    
    console.log(`✅ Found ${printers.length} printer(s)\n`);
    
    if (printers.length === 0) {
      console.error('❌ No printers found!');
      return;
    }

    // Show available printers
    console.log('Available printers:');
    printers.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.displayName} (${p.status})`);
    });
    console.log('');

    // Select first printer
    const printer = printers[0];
    console.log(`🖨️  Using: ${printer.displayName}\n`);

    // PDF file path
    const pdfPath = path.resolve('src/testfiles/Ansah Farms mobile app sprint.pdf');
    
    console.log(`📄 File: ${pdfPath}\n`);

    // Check if file exists
    const fs = await import('fs');
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found!');
      console.error(`   Looking for: ${pdfPath}`);
      return;
    }

    console.log('📤 Sending to printer...\n');

    // Print the file
    await manager.printFile(printer.printerName, pdfPath, {
      copies: 1,
      colorMode: 'color',
      orientation: 'portrait',
      duplex: false
    });

    console.log('✅ Print job sent successfully!\n');
    console.log('Check your printer - it should be printing now! 🎉');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();