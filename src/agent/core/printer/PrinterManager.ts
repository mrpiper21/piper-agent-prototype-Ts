// ============================================================================
// PRINTER MANAGER - Central printer management and discovery
// ============================================================================

import { logger } from '../../utils/logger.js';
import { PrinterInfo, PrinterCapabilities, PrinterError } from '../../types/index.js';
import { DiscoveryService } from './DiscoveryService.js';
import { OSCommands } from './OSCommands.js';
import { validatePrinterName } from '../../utils/validator.js';


import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testPrint() {
  try {
    logger.info('🖨️  Testing print functionality...\n');

    const manager = new PrinterManager();
    
    // Discover printers
    const printers = await manager.discoverPrinters();
    
    if (printers.length === 0) {
      logger.error('No printers found!');
      return;
    }

    // Get the printer name (use the first one or your specific printer)
    const printerName = printers[0].printerName;
    logger.info(`Using printer: ${printerName}\n`);

    // Path to your PDF file
    const pdfPath = path.join(__dirname, 'src/testfiles/Deed Of Assignment (Mr Ayi Mensah).pdf');
    
    logger.info(`Printing file: ${pdfPath}\n`);

    // Print the file
    await manager.printFile(printerName, pdfPath, {
      copies: 1,
      colorMode: 'color',
      orientation: 'portrait',
      duplex: false
    });

    logger.info('✅ Print job sent successfully!');

  } catch (error) {
    logger.error('❌ Print failed:', error);
  }
}

testPrint();

export class PrinterManager {
  private discoveryService: DiscoveryService;
  private osCommands: OSCommands;
  private discoveredPrinters: Map<string, PrinterInfo> = new Map();
  private defaultPrinter: string | null = null;

  constructor() {
    this.discoveryService = new DiscoveryService();
    this.osCommands = new OSCommands();
  }

  /**
   * Discover all available printers
   */
  async discoverPrinters(): Promise<PrinterInfo[]> {
    try {
      logger.info('Starting printer discovery...');
      
      const printers = await this.discoveryService.discoverPrinters();

      console.log("printers -------", printers)
      
      // Clear existing printers
      this.discoveredPrinters.clear();
      
      // Add discovered printers
      for (const printer of printers) {
        this.discoveredPrinters.set(printer.printerName, printer);
        logger.debug(`Discovered printer: ${printer.displayName || printer.printerName}`);
      }

      // Get default printer
      this.defaultPrinter = await this.discoveryService.getDefaultPrinter();
      
      logger.info(`Printer discovery completed. Found ${printers.length} printer(s)`);
      if (this.defaultPrinter) {
        logger.info(`Default printer: ${this.defaultPrinter}`);
      }

      return printers;
    } catch (error) {
      logger.error('Printer discovery failed:', error);
      throw new PrinterError('Failed to discover printers', error);
    }
  }

  /**
   * Get all discovered printers
   */
  getPrinters(): PrinterInfo[] {
    return Array.from(this.discoveredPrinters.values());
  }

  /**
   * Get printer by name
   */
  getPrinter(printerName: string): PrinterInfo | null {
    return this.discoveredPrinters.get(printerName) || null;
  }

  /**
   * Get default printer
   */
  getDefaultPrinter(): PrinterInfo | null {
    if (!this.defaultPrinter) {
      return null;
    }
    return this.getPrinter(this.defaultPrinter);
  }

  /**
   * Check if printer exists
   */
  hasPrinter(printerName: string): boolean {
    return this.discoveredPrinters.has(printerName);
  }

  /**
   * Get printer status
   */
  async getPrinterStatus(printerName: string): Promise<'online' | 'offline' | 'error' | 'busy'> {
    try {
      if (!this.hasPrinter(printerName)) {
        throw new PrinterError(`Printer not found: ${printerName}`);
      }

      const status = await this.osCommands.getPrinterStatus(printerName);
      
      // Update cached printer status
      const printer = this.discoveredPrinters.get(printerName);
      if (printer) {
        printer.status = status;
      }

      return status;
    } catch (error) {
      logger.error(`Failed to get status for printer ${printerName}:`, error);
      return 'error';
    }
  }

  /**
   * Get printer capabilities
   */
  async getPrinterCapabilities(printerName: string): Promise<PrinterCapabilities | null> {
    try {
      if (!this.hasPrinter(printerName)) {
        throw new PrinterError(`Printer not found: ${printerName}`);
      }

      return await this.osCommands.getPrinterCapabilities(printerName);
    } catch (error) {
      logger.error(`Failed to get capabilities for printer ${printerName}:`, error);
      return null;
    }
  }

  /**
   * Print a file to the specified printer
   */
  async printFile(
    printerName: string,
    filePath: string,
    options: {
      copies?: number;
      colorMode?: 'color' | 'grayscale' | 'black-white';
      orientation?: 'portrait' | 'landscape';
      paperSize?: string;
      duplex?: boolean;
    } = {}
  ): Promise<void> {
    try {
      if (!this.hasPrinter(printerName)) {
        throw new PrinterError(`Printer not found: ${printerName}`);
      }

      if (!validatePrinterName(printerName)) {
        throw new PrinterError(`Invalid printer name: ${printerName}`);
      }

      logger.info(`Printing file to ${printerName}: ${filePath}`);

      await this.osCommands.printFile(printerName, filePath, options);
      
      logger.info(`Print job completed successfully on ${printerName}`);
    } catch (error) {
      logger.error(`Print job failed on ${printerName}:`, error);
      throw new PrinterError(`Failed to print file to ${printerName}`, error);
    }
  }

  /**
   * Refresh printer list
   */
  async refreshPrinters(): Promise<PrinterInfo[]> {
    logger.info('Refreshing printer list...');
    return await this.discoverPrinters();
  }

  /**
   * Monitor printer status changes
   */
  startPrinterMonitoring(interval: number = 30000): void {
    logger.info(`Starting printer monitoring with ${interval}ms interval`);
    
    setInterval(() => {
      void (async () => {
        try {
          await this.updatePrinterStatuses();
        } catch (error) {
          logger.error('Printer monitoring error:', error);
        }
      })();
    }, interval);
  }

  /**
   * Update all printer statuses
   */
  private async updatePrinterStatuses(): Promise<void> {
    for (const [printerName] of this.discoveredPrinters) {
      try {
        await this.getPrinterStatus(printerName);
      } catch (error) {
        logger.debug(`Failed to update status for printer ${printerName}:`, error);
      }
    }
  }

  /**
   * Get printer statistics
   */
  getPrinterStats(): {
    totalPrinters: number;
    onlinePrinters: number;
    offlinePrinters: number;
    errorPrinters: number;
    busyPrinters: number;
  } {
    const stats = {
      totalPrinters: this.discoveredPrinters.size,
      onlinePrinters: 0,
      offlinePrinters: 0,
      errorPrinters: 0,
      busyPrinters: 0,
    };

    for (const printer of this.discoveredPrinters.values()) {
      switch (printer.status) {
        case 'online':
          stats.onlinePrinters++;
          break;
        case 'offline':
          stats.offlinePrinters++;
          break;
        case 'error':
          stats.errorPrinters++;
          break;
        case 'busy':
          stats.busyPrinters++;
          break;
      }
    }

    return stats;
  }

  /**
   * Validate printer configuration
   */
  validatePrinterConfig(printerName: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!printerName) {
      errors.push('Printer name is required');
    } else if (!validatePrinterName(printerName)) {
      errors.push('Invalid printer name format');
    }

    if (!this.hasPrinter(printerName)) {
      errors.push('Printer not found');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available paper sizes for a printer
   */
  async getAvailablePaperSizes(printerName: string): Promise<string[]> {
    try {
      const capabilities = await this.getPrinterCapabilities(printerName);
      return capabilities?.paperSizes || ['A4', 'Letter'];
    } catch (error) {
      logger.error(`Failed to get paper sizes for printer ${printerName}:`, error);
      return ['A4', 'Letter']; // Default paper sizes
    }
  }

  /**
   * Check if printer supports color printing
   */
  async supportsColor(printerName: string): Promise<boolean> {
    try {
      const capabilities = await this.getPrinterCapabilities(printerName);
      return capabilities?.color || false;
    } catch (error) {
      logger.error(`Failed to check color support for printer ${printerName}:`, error);
      return false;
    }
  }

  /**
   * Check if printer supports duplex printing
   */
  async supportsDuplex(printerName: string): Promise<boolean> {
    try {
      const capabilities = await this.getPrinterCapabilities(printerName);
      return capabilities?.duplex || false;
    } catch (error) {
      logger.error(`Failed to check duplex support for printer ${printerName}:`, error);
      return false;
    }
  }
}
