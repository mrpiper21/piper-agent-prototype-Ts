// ============================================================================
// CONFIGURATION MANAGER - Loads and validates configuration
// ============================================================================

import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import path from 'path';
import { logger } from '../../utils/logger.js';
import { AgentConfig, ValidationResult } from '../../types/index.js';
import { validateAgentId, validateApiKey, validateEnv } from '../../utils/validator.js';

export class ConfigManager {
  private configDir: string;
  private configFile: string;

  constructor() {
    // Use platform-specific directory instead of relative path (fixes permission issues)
    if (process.env.CONFIG_DIR) {
      this.configDir = process.env.CONFIG_DIR;
    } else {
      try {
        const { platform } = require('../../utils/platform.js');
        this.configDir = platform.getConfigDirectory();
      } catch {
        // Fallback only if platform utils are not available
        this.configDir = './.config';
      }
    }
    this.configFile = path.join(this.configDir, 'agent.config.json');
    this.ensureConfigDir();
  }

  /**
   * Ensure config directory exists
   */
  private ensureConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
      logger.debug(`Created config directory: ${this.configDir}`);
    }
  }

  /**
   * Load configuration from environment and file
   */
  loadConfig(): AgentConfig {
    // Validate environment variables
    const envValidation = validateEnv();
    if (!envValidation.valid) {
      logger.error('❌ Environment validation failed:');
      envValidation.errors.forEach((err) => logger.error(`   - ${err}`));
      throw new Error('Invalid environment configuration');
    }

    // Validate agent ID
    if (!validateAgentId(process.env.AGENT_ID || '')) {
      throw new Error('Invalid AGENT_ID format');
    }

    // Validate API key
    if (!validateApiKey(process.env.API_KEY || '')) {
      logger.warn('⚠️  API_KEY format seems invalid (should start with sk_)');
    }

    // Create config object from environment
    const config: AgentConfig = {
      cloudUrl: process.env.CLOUD_URL || '',
      agentId: process.env.AGENT_ID || '',
      locationName: process.env.LOCATION_NAME || 'Default Location',
      apiKey: process.env.API_KEY || '',
      licenseKey: process.env.LICENSE_KEY || '',
      machineId: this.generateMachineId(),
      installDate: new Date().toISOString(),
      version: '1.0.0',
      checksumVerified: true,
    };

    // Save config for reference
    this.saveConfig(config);

    return config;
  }

  /**
   * Generate unique machine ID
   */
  private generateMachineId(): string {

    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();

    // Get MAC address from first non-internal interface
    const interfaces = os.networkInterfaces();
    let macAddress = '';

    for (const [, addrs] of Object.entries(interfaces)) {
      if (addrs) {
        for (const addr of addrs) {
          if (!addr.internal) {
            macAddress = addr.mac;
            break;
          }
        }
        if (macAddress) break;
      }
    }

    const identifier = `${hostname}-${platform}-${arch}-${macAddress}`;
    return crypto.createHash('sha256').update(identifier).digest('hex');
  }

  /**
   * Save configuration to file
   */
  private saveConfig(config: AgentConfig): void {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2), {
        mode: 0o600, // Read/write for owner only
      });
      logger.debug(`Configuration saved to ${this.configFile}`);
    } catch (error: unknown) {
      logger.warn(`Failed to save configuration: ${error}`);
    }
  }

  /**
   * Load configuration from file
   */
  // private loadConfigFromFile(): AgentConfig | null {
  //   try {
  //     if (!fs.existsSync(this.configFile)) {
  //       return null;
  //     }
  // 
  //     const data = fs.readFileSync(this.configFile, 'utf-8');
  //     return JSON.parse(data) as AgentConfig;
  //   } catch (error: any) {
  //     logger.warn(`Failed to load config file: ${error}`);
  //     return null;
  //   }
  // }

  /**
   * Verify configuration integrity
   */
  verifyIntegrity(config: AgentConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.cloudUrl) errors.push('Missing cloudUrl');
    if (!config.agentId) errors.push('Missing agentId');
    if (!config.apiKey) errors.push('Missing apiKey');
    if (!config.machineId) errors.push('Missing machineId');

    try {
      new URL(config.cloudUrl);
    } catch {
      errors.push('Invalid cloudUrl format');
    }

    if (!validateAgentId(config.agentId)) {
      errors.push('Invalid agentId format');
    }

    if (!validateApiKey(config.apiKey)) {
      errors.push('Invalid apiKey format');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get configuration file path
   */
  getConfigFilePath(): string {
    return this.configFile;
  }

  /**
   * Get configuration directory
   */
  getConfigDir(): string {
    return this.configDir;
  }
}