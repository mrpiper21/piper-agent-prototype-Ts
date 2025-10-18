// ============================================================================
// DISCOVERY SERVICE - Printer discovery across different platforms
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../utils/logger.js';
import { PrinterInfo, PrinterError, PrinterCapabilities } from '../../types/index.js';
import { platform } from '../../utils/platform.js';
import { WindowsDriver } from './drivers/windows.js';
import { MacOSDriver } from './drivers/macos.js';
import { LinuxDriver } from './drivers/linux.js';

const execAsync = promisify(exec);

interface PrinterDriver {
  discoverPrinters(): Promise<PrinterInfo[]>;
  getDefaultPrinter(): Promise<string | null>;
  getCapabilities?(printerName: string): Promise<PrinterCapabilities | null>;
}

export class DiscoveryService {
  private drivers: Map<string, PrinterDriver> = new Map();

  constructor() {
    this.initializeDrivers();
  }

  /**
   * Initialize platform-specific drivers
   */
  private initializeDrivers(): void {
    this.drivers.set('win32', new WindowsDriver());
    this.drivers.set('darwin', new MacOSDriver());
    this.drivers.set('linux', new LinuxDriver());
  }

  /**
   * Discover all available printers
   */
  async discoverPrinters(): Promise<PrinterInfo[]> {
    
    try {
      const platformName = platform.getPlatformInfo().name;
      const driver = this.drivers.get(platformName);

      console.log("discovering driver s----------", driver)

      if (!driver) {
        throw new PrinterError(`Unsupported platform: ${platformName}`);
      }

      logger.debug(`Using ${platformName} driver for printer discovery`);
      
      const printers = await driver.discoverPrinters();
      
      // Validate and enhance printer information
      const validatedPrinters = printers.map(printer => this.validateAndEnhancePrinter(printer));
      
      return validatedPrinters;
    } catch (error) {
      logger.error('Printer discovery failed:', error);
      throw new PrinterError('Failed to discover printers', error);
    }
  }

  /**
   * Get the default printer
   */
  async getDefaultPrinter(): Promise<string | null> {
    try {
      const platformName = platform.getPlatformInfo().name;
      const driver = this.drivers.get(platformName);

      if (!driver) {
        throw new PrinterError(`Unsupported platform: ${platformName}`);
      }

      return await driver.getDefaultPrinter();
    } catch (error) {
      logger.error('Failed to get default printer:', error);
      return null;
    }
  }

  /**
   * Validate and enhance printer information
   */
  private validateAndEnhancePrinter(printer: PrinterInfo): PrinterInfo {
    // Ensure required fields are present
    if (!printer.displayName) {
      printer.displayName = printer.printerName;
    }

    // Validate status
    if (!['online', 'offline', 'error', 'busy'].includes(printer.status)) {
      printer.status = 'offline';
    }

    // Add platform-specific enhancements
    return {
      ...printer,
      location: printer.location || 'Unknown',
      description: printer.description || `${printer.printerName} printer`,
    };
  }

  /**
   * Get printer details by name
   */
  async getPrinterDetails(printerName: string): Promise<PrinterInfo | null> {
    try {
      const printers = await this.discoverPrinters();
      return printers.find(p => p.printerName === printerName) || null;
    } catch (error) {
      logger.error(`Failed to get details for printer ${printerName}:`, error);
      return null;
    }
  }

  /**
   * Check if a specific printer exists
   */
  async printerExists(printerName: string): Promise<boolean> {
    try {
      const printer = await this.getPrinterDetails(printerName);
      return printer !== null;
    } catch (error) {
      logger.error(`Failed to check if printer exists: ${printerName}`, error);
      return false;
    }
  }

  /**
   * Get printer capabilities
   */
  async getPrinterCapabilities(printerName: string): Promise<PrinterCapabilities | null> {
    try {
      const platformName = platform.getPlatformInfo().name;
      const driver = this.drivers.get(platformName);

      if (!driver || !driver.getCapabilities) {
        return null;
      }

      return await driver.getCapabilities(printerName);
    } catch (error) {
      logger.error(`Failed to get capabilities for printer ${printerName}:`, error);
      return null;
    }
  }

  /**
   * Refresh printer cache
   */
  refreshCache(): void {
    logger.debug('Refreshing printer discovery cache...');
    // This would typically clear any cached printer information
    // For now, we'll just log the action
  }

  /**
   * Get discovery statistics
   */
  async getDiscoveryStats(): Promise<{
    platform: string;
    driverAvailable: boolean;
    lastDiscovery: Date;
    totalPrinters: number;
  }> {
    const platformName = platform.getPlatformInfo().name;
    const driver = this.drivers.get(platformName);
    
    try {
      const printers = await this.discoverPrinters();
      
      return {
        platform: platformName,
        driverAvailable: !!driver,
        lastDiscovery: new Date(),
        totalPrinters: printers.length,
      };
    } catch (error) {
      return {
        platform: platformName,
        driverAvailable: !!driver,
        lastDiscovery: new Date(),
        totalPrinters: 0,
      };
    }
  }

  /**
   * Execute system command and return result
   */
  protected async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 10000, // 10 second timeout
        encoding: 'utf8',
      });
      
      return { stdout, stderr };
    } catch (error: unknown) {
      logger.error(`Command execution failed: ${command}`, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new PrinterError(`Command execution failed: ${message}`);
    }
  }

  /**
   * Parse printer list from command output
   */
  protected parsePrinterList(output: string): PrinterInfo[] {
    const lines = output.split('\n').filter(line => line.trim());
    const printers: PrinterInfo[] = [];

    for (const _line of lines) {
      try {
        const printer = this.parsePrinterLine(_line);
        if (printer) {
          printers.push(printer);
        }
      } catch (error) {
        logger.debug(`Failed to parse printer line: ${_line}`, error);
      }
    }

    return printers;
  }

  /**
   * Parse individual printer line (to be overridden by platform drivers)
   */
  protected parsePrinterLine(_: string): PrinterInfo | null {
    // Base implementation - should be overridden by platform-specific drivers
    return null;
  }
}
