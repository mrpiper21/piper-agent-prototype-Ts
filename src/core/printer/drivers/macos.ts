// ============================================================================
// MACOS PRINTER DRIVER - macOS-specific printer operations
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../../utils/logger.js';
import { PrinterInfo, PrinterCapabilities } from '../../../types/index.js';

const execAsync = promisify(exec);

export class MacOSDriver {
  /**
   * Discover printers on macOS
   */
  async discoverPrinters(): Promise<PrinterInfo[]> {
    try {
      const command = 'lpstat -p';
      const { stdout, stderr } = await this.executeCommand(command);
      
      // Handle "No destinations added" gracefully
      if (stderr.includes('No destinations added') || !stdout.trim()) {
        logger.info('No printers configured on macOS system');
        return [];
      }
      
      return this.parseMacOSPrinterList(stdout);
    } catch (error: any) {
      // Check if it's just "no printers" error
      if (error.stderr?.includes('No destinations added')) {
        logger.info('No printers configured on macOS system');
        return [];
      }
      
      logger.error('macOS printer discovery failed:', error);
      throw error;
    }
  }

  /**
   * Get default printer on macOS
   */
  async getDefaultPrinter(): Promise<string | null> {
    try {
      const command = 'lpstat -d';
      const { stdout, stderr } = await this.executeCommand(command);
      
      // Handle "No destinations added" gracefully
      if (stderr.includes('No destinations added') || stderr.includes('no system default destination')) {
        logger.info('No default printer set on macOS system');
        return null;
      }
      
      // Parse output like "system default destination: HP_LaserJet"
      const match = stdout.match(/system default destination:\s*(.+)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
      
      return null;
    } catch (error: any) {
      // Gracefully handle "no default printer" scenarios
      if (error.stderr?.includes('No destinations added') || 
          error.stderr?.includes('no system default destination')) {
        logger.info('No default printer set on macOS system');
        return null;
      }
      
      logger.error('Failed to get default printer on macOS:', error);
      return null;
    }
  }

  /**
   * Get printer capabilities on macOS
   */
  async getCapabilities(printerName: string): Promise<PrinterCapabilities | null> {
    try {
      // Get printer options using lpoptions
      const command = `lpoptions -p "${printerName}" -l`;
      const { stdout } = await this.executeCommand(command);
      
      return this.parseMacOSCapabilities(stdout);
    } catch (error) {
      logger.error(`Failed to get capabilities for printer ${printerName}:`, error);
      return null;
    }
  }

  /**
   * Parse macOS printer list from lpstat output
   */
  private parseMacOSPrinterList(output: string): PrinterInfo[] {
    const lines = output.split('\n').filter(line => line.trim());
    const printers: PrinterInfo[] = [];
    
    for (const line of lines) {
      try {
        const printer = this.parseMacOSPrinterLine(line);
        if (printer) {
          printers.push(printer);
        }
      } catch (error) {
        logger.debug(`Failed to parse macOS printer line: ${line}`, error);
      }
    }
    
    return printers;
  }

  /**
   * Parse individual macOS printer line
   */
  private parseMacOSPrinterLine(line: string): PrinterInfo | null {
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
      
      const printerStatus = this.parseMacOSStatus(status || 'unknown', enabled);
      
      return {
        printerName: printerName || 'unknown',
        displayName: (printerName || 'unknown').replace(/_/g, ' '),
        status: printerStatus,
        isDefault: false, // Will be set separately
        driverName: 'CUPS Driver',
        location: 'Local',
        description: `macOS printer: ${printerName || 'unknown'}`,
      };
    } catch (error) {
      logger.debug(`Failed to parse macOS printer line: ${line}`, error);
      return null;
    }
  }

  /**
   * Parse macOS printer status
   */
  private parseMacOSStatus(status: string, enabled: boolean): 'online' | 'offline' | 'error' | 'busy' {
    if (!enabled) return 'offline';
    
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus === 'idle') return 'online';
    if (lowerStatus === 'printing') return 'busy';
    if (lowerStatus === 'paused') return 'offline';
    if (lowerStatus.includes('error')) return 'error';
    
    return 'offline';
  }

  /**
   * Parse macOS printer capabilities
   */
  private parseMacOSCapabilities(output: string): PrinterCapabilities {
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
   * Execute macOS command
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
      // Don't log "No destinations added" as error - it's a valid state
      if (error.stderr?.includes('No destinations added')) {
        return { stdout: '', stderr: error.stderr };
      }
      
      logger.error(`macOS command execution failed: ${command}`, error);
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
      const command = `lpq -P "${printerName}"`;
      const { stdout } = await this.executeCommand(command);
      
      return this.parseMacOSPrintQueue(stdout);
    } catch (error) {
      logger.error(`Failed to get print queue for printer ${printerName}:`, error);
      return { jobCount: 0, jobs: [] };
    }
  }

  /**
   * Parse macOS print queue
   */
  private parseMacOSPrintQueue(output: string): {
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
   * Cancel print job on macOS
   */
  async cancelPrintJob(printerName: string, jobId: string): Promise<boolean> {
    try {
      const command = `cancel -P "${printerName}" ${jobId}`;
      await this.executeCommand(command);
      
      logger.info(`Print job ${jobId} cancelled on printer ${printerName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to cancel print job ${jobId} on printer ${printerName}:`, error);
      return false;
    }
  }

  /**
   * Enable printer on macOS
   */
  async enablePrinter(printerName: string): Promise<boolean> {
    try {
      const command = `cupsenable "${printerName}"`;
      await this.executeCommand(command);
      
      logger.info(`Printer ${printerName} enabled`);
      return true;
    } catch (error) {
      logger.error(`Failed to enable printer ${printerName}:`, error);
      return false;
    }
  }

  /**
   * Disable printer on macOS
   */
  async disablePrinter(printerName: string): Promise<boolean> {
    try {
      const command = `cupsdisable "${printerName}"`;
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
      const command = `lpstat -p "${printerName}" -l`;
      const { stdout } = await this.executeCommand(command);
      
      return this.parseMacOSPrinterInfo(stdout);
    } catch (error) {
      logger.error(`Failed to get printer info for ${printerName}:`, error);
      return null;
    }
  }

  /**
   * Parse macOS printer information
   */
  private parseMacOSPrinterInfo(output: string): Record<string, string> {
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
}