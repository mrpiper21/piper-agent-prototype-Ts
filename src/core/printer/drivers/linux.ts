// ============================================================================
// LINUX PRINTER DRIVER - Linux-specific printer operations
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../../utils/logger.js';
import { PrinterInfo, PrinterCapabilities } from '../../../types/index.js';

const execAsync = promisify(exec);

export class LinuxDriver {
  /**
   * Discover printers on Linux
   */
  async discoverPrinters(): Promise<PrinterInfo[]> {
    try {
      const command = 'lpstat -p';
      const { stdout } = await this.executeCommand(command);
      
      return this.parseLinuxPrinterList(stdout);
    } catch (error) {
      logger.error('Linux printer discovery failed:', error);
      throw error;
    }
  }

  /**
   * Get default printer on Linux
   */
  async getDefaultPrinter(): Promise<string | null> {
    try {
      const command = 'lpstat -d';
      const { stdout } = await this.executeCommand(command);
      
      // Parse output like "system default destination: HP_LaserJet"
      const match = stdout.match(/system default destination:\s*(.+)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get default printer on Linux:', error);
      return null;
    }
  }

  /**
   * Get printer capabilities on Linux
   */
  async getCapabilities(printerName: string): Promise<PrinterCapabilities | null> {
    try {
      // Get printer options using lpoptions
      const command = `lpoptions -p ${printerName} -l`;
      const { stdout } = await this.executeCommand(command);
      
      return this.parseLinuxCapabilities(stdout);
    } catch (error) {
      logger.error(`Failed to get capabilities for printer ${printerName}:`, error);
      return null;
    }
  }

  /**
   * Parse Linux printer list from lpstat output
   */
  private parseLinuxPrinterList(output: string): PrinterInfo[] {
    const lines = output.split('\n').filter(line => line.trim());
    const printers: PrinterInfo[] = [];
    
    for (const line of lines) {
      try {
        const printer = this.parseLinuxPrinterLine(line);
        if (printer) {
          printers.push(printer);
        }
      } catch (error) {
        logger.debug(`Failed to parse Linux printer line: ${line}`, error);
      }
    }
    
    return printers;
  }

  /**
   * Parse individual Linux printer line
   */
  private parseLinuxPrinterLine(line: string): PrinterInfo | null {
    try {
      // lpstat -p output format: "printer HP_LaserJet is idle.  enabled since Mon Jan 01 12:00:00 2024"
      const match = line.match(/printer\s+(\S+)\s+is\s+(\w+)/i);
      
      if (!match || match.length < 3) {
        return null;
      }
      
      const printerName = match[1];
      const status = match[2];
      
      // Check if it's enabled
      const enabled = line.includes('enabled');
      
      const printerStatus = this.parseLinuxStatus(status || 'unknown', enabled);
      
      return {
        printerName: printerName || 'unknown',
        displayName: (printerName || 'unknown').replace(/_/g, ' '),
        status: printerStatus,
        isDefault: false, // Will be set separately
        driverName: 'CUPS Driver',
        location: 'Local',
        description: `Linux printer: ${printerName || 'unknown'}`,
      };
    } catch (error) {
      logger.debug(`Failed to parse Linux printer line: ${line}`, error);
      return null;
    }
  }

  /**
   * Parse Linux printer status
   */
  private parseLinuxStatus(status: string, enabled: boolean): 'online' | 'offline' | 'error' | 'busy' {
    if (!enabled) return 'offline';
    
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus === 'idle') return 'online';
    if (lowerStatus === 'printing') return 'busy';
    if (lowerStatus === 'paused') return 'offline';
    if (lowerStatus.includes('error')) return 'error';
    
    return 'offline';
  }

  /**
   * Parse Linux printer capabilities
   */
  private parseLinuxCapabilities(output: string): PrinterCapabilities {
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
    if (lowerOutput.includes('duplex') || lowerOutput.includes('sides')) {
      capabilities.duplex = true;
    }
    
    // Parse paper sizes
    const paperSizeMatches = output.match(/(\w+[x×]\w+|\w+)/gi);
    if (paperSizeMatches) {
      capabilities.paperSizes = paperSizeMatches.slice(0, 10);
    }
    
    // Add landscape orientation if supported
    if (lowerOutput.includes('landscape') || lowerOutput.includes('orientation')) {
      capabilities.orientations.push('landscape');
    }
    
    return capabilities;
  }

  /**
   * Execute Linux command
   */
  private async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 10000,
        encoding: 'utf8',
        shell: '/bin/bash',
      });
      
      return { stdout, stderr };
    } catch (error: any) {
      logger.error(`Linux command execution failed: ${command}`, error);
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
      const command = `lpq -P ${printerName}`;
      const { stdout } = await this.executeCommand(command);
      
      return this.parseLinuxPrintQueue(stdout);
    } catch (error) {
      logger.error(`Failed to get print queue for printer ${printerName}:`, error);
      return { jobCount: 0, jobs: [] };
    }
  }

  /**
   * Parse Linux print queue
   */
  private parseLinuxPrintQueue(output: string): {
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
    
    // Skip header lines
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      if (!line?.trim()) continue;
      
      try {
        // lpq output format: "Rank   Owner   Job    File(s)                         Total Size"
        const parts = line?.trim().split(/\s+/) || [];
        if (parts.length >= 4) {
          const [, , jobId, document, ...sizeParts] = parts;
          
          jobs.push({
            jobId: jobId || '',
            document: document || '',
            status: 'queued',
            size: sizeParts.join(' ') || '',
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
   * Cancel print job on Linux
   */
  async cancelPrintJob(printerName: string, jobId: string): Promise<boolean> {
    try {
      const command = `cancel -P ${printerName} ${jobId}`;
      await this.executeCommand(command);
      
      logger.info(`Print job ${jobId} cancelled on printer ${printerName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to cancel print job ${jobId} on printer ${printerName}:`, error);
      return false;
    }
  }

  /**
   * Enable printer on Linux
   */
  async enablePrinter(printerName: string): Promise<boolean> {
    try {
      const command = `cupsenable ${printerName}`;
      await this.executeCommand(command);
      
      logger.info(`Printer ${printerName} enabled`);
      return true;
    } catch (error) {
      logger.error(`Failed to enable printer ${printerName}:`, error);
      return false;
    }
  }

  /**
   * Disable printer on Linux
   */
  async disablePrinter(printerName: string): Promise<boolean> {
    try {
      const command = `cupsdisable ${printerName}`;
      await this.executeCommand(command);
      
      logger.info(`Printer ${printerName} disabled`);
      return true;
    } catch (error) {
      logger.error(`Failed to disable printer ${printerName}:`, error);
      return false;
    }
  }

  /**
   * Get printer information using lpinfo
   */
  async getPrinterInfo(printerName: string): Promise<any> {
    try {
      const command = `lpstat -p ${printerName} -l`;
      const { stdout } = await this.executeCommand(command);
      
      return this.parseLinuxPrinterInfo(stdout);
    } catch (error) {
      logger.error(`Failed to get printer info for ${printerName}:`, error);
      return null;
    }
  }

  /**
   * Parse Linux printer information
   */
  private parseLinuxPrinterInfo(output: string): Record<string, string> {
    const info: Record<string, string> = {};
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':', 2);
        if (key && value) {
          info[key.trim().toLowerCase()] = value.trim();
        }
      }
    }
    
    return info;
  }

  /**
   * Check if CUPS is running
   */
  async isCUPSRunning(): Promise<boolean> {
    try {
      const command = 'systemctl is-active cups';
      const { stdout } = await this.executeCommand(command);
      
      return stdout.trim() === 'active';
    } catch (error) {
      logger.debug('CUPS status check failed:', error);
      return false;
    }
  }

  /**
   * Start CUPS service
   */
  async startCUPS(): Promise<boolean> {
    try {
      const command = 'sudo systemctl start cups';
      await this.executeCommand(command);
      
      logger.info('CUPS service started');
      return true;
    } catch (error) {
      logger.error('Failed to start CUPS service:', error);
      return false;
    }
  }

  /**
   * Stop CUPS service
   */
  async stopCUPS(): Promise<boolean> {
    try {
      const command = 'sudo systemctl stop cups';
      await this.executeCommand(command);
      
      logger.info('CUPS service stopped');
      return true;
    } catch (error) {
      logger.error('Failed to stop CUPS service:', error);
      return false;
    }
  }
}
