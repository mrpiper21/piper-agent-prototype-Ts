// ============================================================================
// MACHINE ID - Generate and manage unique machine identifier
// ============================================================================

import crypto from 'crypto';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { logger } from '../../utils/logger.js';
import { SecurityError } from '../../types/index.js';
import { platform } from '../../utils/platform.js';

export class MachineId {
  private machineId: string | null = null;
  private machineIdFile: string;
  private isValid: boolean = false;

  constructor() {
    this.machineIdFile = path.join(platform.getConfigDirectory(), 'machine-id');
  }

  /**
   * Initialize machine ID
   */
  async initialize(): Promise<void> {
    try {
      // Try to load existing machine ID
      await this.loadMachineId();
      
      // If no machine ID exists, generate a new one
      if (!this.machineId) {
        await this.generateMachineId();
      }

      this.isValid = true;
      logger.debug('Machine ID initialized');
    } catch (error) {
      logger.error('Failed to initialize machine ID:', error);
      this.isValid = false;
      throw new SecurityError('Machine ID initialization failed', error);
    }
  }

  /**
   * Generate unique machine ID
   */
  private async generateMachineId(): Promise<void> {
    try {
      const identifier = this.createMachineIdentifier();
      this.machineId = crypto.createHash('sha256').update(identifier).digest('hex');
      
      await this.saveMachineId();
      
      logger.info('Generated new machine ID');
    } catch (error) {
      logger.error('Failed to generate machine ID:', error);
      throw new SecurityError('Machine ID generation failed', error);
    }
  }

  /**
   * Create machine identifier from system information
   */
  private createMachineIdentifier(): string {
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const release = os.release();

    // Get MAC address from first non-internal interface
    const interfaces = os.networkInterfaces();
    let macAddress = '';

    for (const [, addrs] of Object.entries(interfaces)) {
      if (addrs) {
        for (const addr of addrs) {
          if (!addr.internal && addr.mac && addr.mac !== '00:00:00:00:00:00') {
            macAddress = addr.mac;
            break;
          }
        }
        if (macAddress) break;
      }
    }

    // Get CPU information
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0]?.model : '';

    // Get system memory (for additional uniqueness)
    const totalMemory = os.totalmem();

    // Create unique identifier
    const identifier = [
      hostname,
      platform,
      arch,
      release,
      macAddress,
      cpuModel,
      totalMemory.toString(),
    ].join('|');

    return identifier;
  }

  /**
   * Save machine ID to file
   */
  private async saveMachineId(): Promise<void> {
    try {
      if (!this.machineId) {
        throw new Error('No machine ID to save');
      }

      // Ensure config directory exists
      await fs.ensureDir(platform.getConfigDirectory());

      // Save machine ID with restricted permissions
      await fs.writeFile(this.machineIdFile, this.machineId, { mode: 0o600 });
      
      logger.debug('Machine ID saved');
    } catch (error) {
      logger.error('Failed to save machine ID:', error);
      throw new SecurityError('Machine ID save failed', error);
    }
  }

  /**
   * Load machine ID from file
   */
  private async loadMachineId(): Promise<void> {
    try {
      if (await fs.pathExists(this.machineIdFile)) {
        this.machineId = await fs.readFile(this.machineIdFile, 'utf8');
        
        // Validate machine ID format
        if (this.machineId && this.machineId.length === 64) {
          logger.debug('Machine ID loaded');
        } else {
          logger.warn('Invalid machine ID format, will regenerate');
          this.machineId = null;
        }
      }
    } catch (error) {
      logger.error('Failed to load machine ID:', error);
      this.machineId = null;
    }
  }

  /**
   * Get machine ID
   */
  getMachineId(): string {
    if (!this.machineId) {
      throw new SecurityError('Machine ID not available');
    }
    return this.machineId;
  }

  /**
   * Validate machine ID
   */
  async validateMachineId(expectedId?: string): Promise<boolean> {
    try {
      if (!this.machineId) {
        return false;
      }

      // Check format
      if (this.machineId.length !== 64) {
        return false;
      }

      // Check against expected ID if provided
      if (expectedId && this.machineId !== expectedId) {
        return false;
      }

      // Verify machine ID is still valid for this machine
      const currentIdentifier = this.createMachineIdentifier();
      const expectedMachineId = await Promise.resolve(crypto.createHash('sha256').update(currentIdentifier).digest('hex'));
      
      // Allow for some tolerance in case of minor system changes
      return this.machineId === expectedMachineId;
    } catch (error) {
      logger.error('Machine ID validation failed:', error);
      return false;
    }
  }

  /**
   * Regenerate machine ID
   */
  async regenerateMachineId(): Promise<string> {
    try {
      logger.info('Regenerating machine ID...');
      
      // Remove old machine ID file
      if (await fs.pathExists(this.machineIdFile)) {
        await fs.remove(this.machineIdFile);
      }

      // Generate new machine ID
      await this.generateMachineId();
      
      if (!this.machineId) {
        throw new Error('Failed to generate new machine ID');
      }

      logger.info('Machine ID regenerated successfully');
      return this.machineId;
    } catch (error) {
      logger.error('Failed to regenerate machine ID:', error);
      throw new SecurityError('Machine ID regeneration failed', error);
    }
  }

  /**
   * Get machine information
   */
  getMachineInfo(): {
    hostname: string;
    platform: string;
    arch: string;
    release: string;
    cpus: number;
    memory: number;
    networkInterfaces: string[];
  } {
    const interfaces = os.networkInterfaces();
    const networkInterfaces: string[] = [];

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (addrs) {
        for (const addr of addrs) {
          if (!addr.internal && addr.mac) {
            networkInterfaces.push(`${name}:${addr.mac}`);
          }
        }
      }
    }

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      cpus: os.cpus().length,
      memory: os.totalmem(),
      networkInterfaces,
    };
  }

  /**
   * Get machine fingerprint
   */
  getMachineFingerprint(): string {
    const info = this.getMachineInfo();
    const fingerprint = [
      info.hostname,
      info.platform,
      info.arch,
      info.release,
      info.cpus.toString(),
      info.memory.toString(),
      info.networkInterfaces.sort().join(','),
    ].join('|');

    return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 16);
  }

  /**
   * Check if machine ID is valid
   */
  isMachineIdValid(): boolean {
    return this.isValid && !!this.machineId;
  }

  /**
   * Get machine ID file path
   */
  getMachineIdFilePath(): string {
    return this.machineIdFile;
  }

  /**
   * Export machine ID for backup
   */
  async exportMachineId(): Promise<{
    machineId: string;
    fingerprint: string;
    timestamp: string;
    version: string;
  }> {
    try {
      if (!this.machineId) {
        throw new SecurityError('Machine ID not available for export');
      }

      return {
        machineId: this.machineId,
        fingerprint: await Promise.resolve(this.getMachineFingerprint()),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
    } catch (error) {
      logger.error('Failed to export machine ID:', error);
      throw new SecurityError('Machine ID export failed', error);
    }
  }

  /**
   * Import machine ID from backup
   */
  async importMachineId(backup: {
    machineId: string;
    fingerprint?: string;
    timestamp?: string;
  }): Promise<void> {
    try {
      if (!backup.machineId) {
        throw new Error('Invalid backup data');
      }

      // Validate machine ID format
      if (backup.machineId.length !== 64) {
        throw new Error('Invalid machine ID format');
      }

      // Optionally validate fingerprint
      if (backup.fingerprint) {
        const currentFingerprint = await Promise.resolve(this.getMachineFingerprint());
        if (backup.fingerprint !== currentFingerprint) {
          logger.warn('Machine fingerprint mismatch - machine may have changed');
        }
      }

      this.machineId = backup.machineId;
      await this.saveMachineId();
      
      logger.info('Machine ID imported successfully');
    } catch (error) {
      logger.error('Failed to import machine ID:', error);
      throw new SecurityError('Machine ID import failed', error);
    }
  }

  /**
   * Get machine ID statistics
   */
  getStats(): {
    isInitialized: boolean;
    isValid: boolean;
    hasFile: boolean;
    filePath: string;
  } {
    return {
      isInitialized: !!this.machineId,
      isValid: this.isValid,
      hasFile: false, // Would need async check
      filePath: this.machineIdFile,
    };
  }
}
