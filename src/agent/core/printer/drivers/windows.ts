// ============================================================================
// WINDOWS PRINTER DRIVER - Windows-specific printer operations
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../../utils/logger.js';
import { PrinterInfo, PrinterCapabilities } from '../../../types/index.js';

const execAsync = promisify(exec);

export class WindowsDriver {
  /**
   * Discover printers on Windows
   */
  async discoverPrinters(): Promise<PrinterInfo[]> {
    try {
      const command = 'wmic printer get name,status,default /format:csv';
      const { stdout } = await this.executeCommand(command);
      
      return this.parseWindowsPrinterList(stdout);
    } catch (error) {
      logger.error('Windows printer discovery failed:', error);
      throw error;
    }
  }

  /**
   * Get default printer on Windows
   */
  async getDefaultPrinter(): Promise<string | null> {
    try {
      const command = 'wmic printer where "Default=True" get name /format:list';
      const { stdout } = await this.executeCommand(command);
      
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('Name=')) {
          const name = line.split('=')[1]?.trim();
          if (name && name !== '') {
            return name;
          }
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get default printer on Windows:', error);
      return null;
    }
  }

  /**
   * Get printer capabilities on Windows
   */
  async getCapabilities(printerName: string): Promise<PrinterCapabilities | null> {
    try {
      // Get basic printer information
      const command = `wmic printer where "name='${printerName}'" get capabilities /format:list`;
      const { stdout } = await this.executeCommand(command);
      
      return this.parseWindowsCapabilities(stdout);
    } catch (error) {
      logger.error(`Failed to get capabilities for printer ${printerName}:`, error);
      return null;
    }
  }

  /**
   * Parse Windows printer list from WMIC output
   */
  private parseWindowsPrinterList(output: string): PrinterInfo[] {
    const lines = output.split('\n').filter(line => line.trim());
    const printers: PrinterInfo[] = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line?.trim()) continue;
      
      try {
        const printer = this.parseWindowsPrinterLine(line || '');
        if (printer) {
          printers.push(printer);
        }
      } catch (error) {
        logger.debug(`Failed to parse Windows printer line: ${line}`, error);
      }
    }
    
    return printers;
  }

  /**
   * Parse individual Windows printer line
   */
  private parseWindowsPrinterLine(line: string): PrinterInfo | null {
    try {
      // WMIC CSV format: Node,Name,Status,Default
      const parts = line.split(',');
      
      if (parts.length < 4) {
        return null;
      }
      
      const [, name, status, isDefault] = parts;
      
      if (!name || name.trim() === '') {
        return null;
      }
      
      const printerName = name.trim();
      const displayName = (printerName || 'unknown');
      const printerStatus = this.parseWindowsStatus(status?.trim() || 'unknown');
      const defaultPrinter = isDefault?.trim().toLowerCase() === 'true';
      
      return {
        printerName: printerName || 'unknown',
        displayName,
        status: printerStatus,
        isDefault: defaultPrinter,
        driverName: 'Windows Driver',
        location: 'Local',
        description: `Windows printer: ${printerName || 'unknown'}`,
      };
    } catch (error) {
      logger.debug(`Failed to parse Windows printer line: ${line}`, error);
      return null;
    }
  }

  /**
   * Parse Windows printer status
   */
  private parseWindowsStatus(status: string): 'online' | 'offline' | 'error' | 'busy' {
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('idle')) return 'online';
    if (lowerStatus.includes('printing')) return 'busy';
    if (lowerStatus.includes('error')) return 'error';
    if (lowerStatus.includes('offline')) return 'offline';
    if (lowerStatus.includes('paused')) return 'offline';
    
    return 'offline';
  }

  /**
   * Parse Windows printer capabilities
   */
  private parseWindowsCapabilities(output: string): PrinterCapabilities {
    const capabilities: PrinterCapabilities = {
      color: false,
      duplex: false,
      paperSizes: ['A4', 'Letter', 'Legal', 'Tabloid'],
      orientations: ['portrait'],
      resolutions: [300, 600, 1200],
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
    
    // Add landscape orientation if supported
    if (lowerOutput.includes('landscape')) {
      capabilities.orientations.push('landscape');
    }
    
    return capabilities;
  }

  /**
   * Execute Windows command
   */
  private async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 10000,
        encoding: 'utf8',
        shell: 'cmd.exe',
      });
      
      return { stdout, stderr };
    } catch (error: unknown) {
      logger.error(`Windows command execution failed: ${command}`, error);
      throw error;
    }
  }

  /**
   * Get printer queue information
   */
  async getPrinterQueue(printerName: string): Promise<{
    jobCount: number;
    jobs: Array<{
      jobId: string;
      document: string;
      status: string;
      size: string;
    }>;
  }> {
    try {
      const command = `wmic printjob where "printername='${printerName}'" get jobid,documentname,status,totalsize /format:csv`;
      const { stdout } = await this.executeCommand(command);
      
      return this.parseWindowsPrintQueue(stdout);
    } catch (error) {
      logger.error(`Failed to get print queue for printer ${printerName}:`, error);
      return { jobCount: 0, jobs: [] };
    }
  }

  /**
   * Parse Windows print queue
   */
  private parseWindowsPrintQueue(output: string): {
    jobCount: number;
    jobs: Array<{
      jobId: string;
      document: string;
      status: string;
      size: string;
    }>;
  } {
    const lines = output.split('\n').filter(line => line.trim());
    const jobs: Array<{
      jobId: string;
      document: string;
      status: string;
      size: string;
    }> = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line?.trim()) continue;
      
      try {
        const parts = line?.split(',') || [];
        if (parts.length >= 5) {
          const [, jobId, document, status, size] = parts;
          
          jobs.push({
            jobId: jobId?.trim() || '',
            document: document?.trim() || '',
            status: status?.trim() || '',
            size: size?.trim() || '',
          });
        }
      } catch (error) {
        logger.debug(`Failed to parse print queue line: ${line}`, error);
      }
    }
    
    return {
      jobCount: jobs.length,
      jobs,
    };
  }

  /**
   * Cancel print job on Windows
   */
  async cancelPrintJob(printerName: string, jobId: string): Promise<boolean> {
    try {
      const command = `wmic printjob where "jobid=${jobId} and printername='${printerName}'" delete`;
      await this.executeCommand(command);
      
      logger.info(`Print job ${jobId} cancelled on printer ${printerName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to cancel print job ${jobId} on printer ${printerName}:`, error);
      return false;
    }
  }

  /**
   * Pause printer on Windows
   */
  async pausePrinter(printerName: string): Promise<boolean> {
    try {
      const command = `wmic printer where "name='${printerName}'" call pauseprinter`;
      await this.executeCommand(command);
      
      logger.info(`Printer ${printerName} paused`);
      return true;
    } catch (error) {
      logger.error(`Failed to pause printer ${printerName}:`, error);
      return false;
    }
  }

  /**
   * Resume printer on Windows
   */
  async resumePrinter(printerName: string): Promise<boolean> {
    try {
      const command = `wmic printer where "name='${printerName}'" call resumeprinter`;
      await this.executeCommand(command);
      
      logger.info(`Printer ${printerName} resumed`);
      return true;
    } catch (error) {
      logger.error(`Failed to resume printer ${printerName}:`, error);
      return false;
    }
  }
}
