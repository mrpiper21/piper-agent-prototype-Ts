// ============================================================================
// OS COMMANDS - Cross-platform operating system commands
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../utils/logger.js';
import { PrinterCapabilities, PrinterError } from '../../types/index.js';
import { platform } from '../../utils/platform.js';

const execAsync = promisify(exec);

export class OSCommands {
  private platformName: string;

  constructor() {
    this.platformName = platform.getPlatformInfo().name;
  }

  /**
   * Get printer status
   */
  async getPrinterStatus(printerName: string): Promise<'online' | 'offline' | 'error' | 'busy'> {
    try {
      let command: string;
      
      switch (this.platformName) {
        case 'win32':
          command = `wmic printer where "name='${printerName}'" get status /format:list`;
          break;
        case 'darwin':
          command = `lpstat -p ${printerName}`;
          break;
        case 'linux':
          command = `lpstat -p ${printerName}`;
          break;
        default:
          throw new PrinterError(`Unsupported platform: ${this.platformName}`);
      }

      const { stdout, stderr } = await this.executeCommand(command);
      
      if (stderr && !stdout) {
        return 'error';
      }

      return this.parsePrinterStatus(stdout, this.platformName);
    } catch (error) {
      logger.error(`Failed to get printer status for ${printerName}:`, error);
      return 'error';
    }
  }

  /**
   * Get printer capabilities
   */
  async getPrinterCapabilities(printerName: string): Promise<PrinterCapabilities | null> {
    try {
      let command: string;
      
      switch (this.platformName) {
        case 'win32':
          command = `wmic printer where "name='${printerName}'" get capabilities /format:list`;
          break;
        case 'darwin':
          command = `lpoptions -p ${printerName} -l`;
          break;
        case 'linux':
          command = `lpoptions -p ${printerName} -l`;
          break;
        default:
          throw new PrinterError(`Unsupported platform: ${this.platformName}`);
      }

      const { stdout } = await this.executeCommand(command);
      return this.parsePrinterCapabilities(stdout, this.platformName);
    } catch (error) {
      logger.error(`Failed to get printer capabilities for ${printerName}:`, error);
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
      const command = this.buildPrintCommand(printerName, filePath, options);
      
      logger.debug(`Executing print command: ${command}`);
      
      const { stdout, stderr } = await this.executeCommand(command);
      
      if (stderr && !stdout) {
        throw new PrinterError(`Print command failed: ${stderr}`);
      }

      logger.info(`Print job submitted successfully to ${printerName}`);
    } catch (error) {
      logger.error(`Failed to print file to ${printerName}:`, error);
      throw new PrinterError(`Print job failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build platform-specific print command
   */
  private buildPrintCommand(
    printerName: string,
    filePath: string,
    options: {
      copies?: number;
      colorMode?: 'color' | 'grayscale' | 'black-white';
      orientation?: 'portrait' | 'landscape';
      paperSize?: string;
      duplex?: boolean;
    }
  ): string {
    const args: string[] = [];

    // Add copies
    if (options.copies && options.copies > 1) {
      args.push(`-n ${options.copies}`);
    }

    // Add printer
    args.push(`-P "${printerName}"`);

    // Add paper size
    if (options.paperSize) {
      args.push(`-o media=${options.paperSize}`);
    }

    // Add orientation
    if (options.orientation === 'landscape') {
      args.push('-o landscape');
    }

    // Add duplex
    if (options.duplex) {
      args.push('-o sides=two-sided-long-edge');
    }

    // Add color mode
    if (options.colorMode === 'grayscale' || options.colorMode === 'black-white') {
      args.push('-o ColorMode=Grayscale');
    }

    // Build command based on platform
    switch (this.platformName) {
      case 'win32': {
        // Windows uses different commands for different file types
        const extension = filePath.split('.').pop()?.toLowerCase();
        if (extension === 'pdf') {
          return `"C:\\Program Files\\Adobe\\Acrobat Reader DC\\Reader\\AcroRd32.exe" /t "${filePath}" "${printerName}"`;
        } else {
          return `notepad /p "${filePath}"`;
        }
      }
        
      case 'darwin':
      case 'linux':
        return `lp ${args.join(' ')} "${filePath}"`;
        
      default:
        throw new PrinterError(`Unsupported platform: ${this.platformName}`);
    }
  }

  /**
   * Parse printer status from command output
   */
  private parsePrinterStatus(output: string, _platform: string): 'online' | 'offline' | 'error' | 'busy' {
    const lowerOutput = output.toLowerCase();

    switch (_platform) {
      case 'win32':
        if (lowerOutput.includes('idle')) return 'online';
        if (lowerOutput.includes('printing')) return 'busy';
        if (lowerOutput.includes('error')) return 'error';
        return 'offline';
        
      case 'darwin':
      case 'linux':
        if (lowerOutput.includes('idle')) return 'online';
        if (lowerOutput.includes('printing')) return 'busy';
        if (lowerOutput.includes('paused')) return 'offline';
        if (lowerOutput.includes('error')) return 'error';
        return 'offline';
        
      default:
        return 'error';
    }
  }

  /**
   * Parse printer capabilities from command output
   */
  private parsePrinterCapabilities(output: string, _platform: string): PrinterCapabilities {
    const capabilities: PrinterCapabilities = {
      color: false,
      duplex: false,
      paperSizes: ['A4', 'Letter'],
      orientations: ['portrait'],
      resolutions: [300, 600],
    };

    const lowerOutput = output.toLowerCase();

    // Check for color support
    if (lowerOutput.includes('color') || lowerOutput.includes('colour')) {
      capabilities.color = true;
    }

    // Check for duplex support
    if (lowerOutput.includes('duplex') || lowerOutput.includes('two-sided')) {
      capabilities.duplex = true;
    }

    // Parse paper sizes
    const paperSizeMatches = output.match(/(\w+[x×]\w+|\w+)/gi);
    if (paperSizeMatches) {
      capabilities.paperSizes = paperSizeMatches.slice(0, 10); // Limit to 10 sizes
    }

    // Add landscape orientation if supported
    if (lowerOutput.includes('landscape')) {
      capabilities.orientations.push('landscape');
    }

    return capabilities;
  }

  /**
   * Execute system command
   */
  private async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 second timeout
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
   * Check if printer command is available
   */
  async isPrinterCommandAvailable(): Promise<boolean> {
    try {
      let command: string;
      
      switch (this.platformName) {
        case 'win32':
          command = 'wmic printer get name';
          break;
        case 'darwin':
        case 'linux':
          command = 'lpstat -p';
          break;
        default:
          return false;
      }

      await this.executeCommand(command);
      return true;
    } catch (error) {
      logger.debug(`Printer command not available: ${String(error)}`);
      return false;
    }
  }

  /**
   * Get system printer information
   */
  async getSystemPrinterInfo(): Promise<{
    totalPrinters: number;
    defaultPrinter: string | null;
    spoolerStatus: string;
  }> {
    try {
      let command: string;
      
      switch (this.platformName) {
        case 'win32':
          command = 'wmic printer get name,status /format:csv';
          break;
        case 'darwin':
          command = 'lpstat -p';
          break;
        case 'linux':
          command = 'lpstat -p';
          break;
        default:
          throw new PrinterError(`Unsupported platform: ${this.platformName}`);
      }

      const { stdout } = await this.executeCommand(command);
      return this.parseSystemPrinterInfo(stdout, this.platformName);
    } catch (error) {
      logger.error('Failed to get system printer info:', error);
      return {
        totalPrinters: 0,
        defaultPrinter: null,
        spoolerStatus: 'unknown',
      };
    }
  }

  /**
   * Parse system printer information
   */
  private parseSystemPrinterInfo(output: string, _platform: string): {
    totalPrinters: number;
    defaultPrinter: string | null;
    spoolerStatus: string;
  } {
    const lines = output.split('\n').filter(line => line.trim());
    
    return {
      totalPrinters: lines.length,
      defaultPrinter: null, // Would need additional parsing logic
      spoolerStatus: 'running',
    };
  }
}
