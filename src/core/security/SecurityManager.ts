// // ============================================================================
// // SECURITY MANAGER - Central security management
// // ============================================================================

// import { logger } from '../../utils/logger.js';
// import { SecurityError, TamperResult } from '../../types/index.js';
// import { ConfigManager } from '../config/ConfigManager.js';
// import { TamperDetection } from './TamperDetection.js';
// import { FileWatcher } from './FileWatcher.js';
// import { Encryption } from './Encryption.js';
// import { MachineId } from './MachineId.js';

// export class SecurityManager {
//   private configManager: ConfigManager;
//   private tamperDetection: TamperDetection;
//   private fileWatcher: FileWatcher;
//   private encryption: Encryption;
//   private machineId: MachineId;
//   private isMonitoring: boolean = false;

//   constructor(configManager: ConfigManager) {
//     this.configManager = configManager;
//     this.tamperDetection = new TamperDetection();
//     this.fileWatcher = new FileWatcher();
//     this.encryption = new Encryption();
//     this.machineId = new MachineId();
//   }

//   /**
//    * Initialize security manager
//    */
//   async initialize(): Promise<void> {
//     try {
//       logger.info('Initializing security manager...');

//       // Initialize tamper detection
//       await this.tamperDetection.initialize();
//       logger.debug('Tamper detection initialized');

//       // Initialize file watcher
//       await this.fileWatcher.initialize();
//       logger.debug('File watcher initialized');

//       // Initialize encryption
//       await this.encryption.initialize();
//       logger.debug('Encryption initialized');

//       // Initialize machine ID
//       await this.machineId.initialize();
//       logger.debug('Machine ID initialized');

//       logger.info('Security manager initialized successfully');
//     } catch (error) {
//       logger.error('Failed to initialize security manager:', error);
//       throw new SecurityError('Security initialization failed', error);
//     }
//   }

//   /**
//    * Start security monitoring
//    */
//   async startMonitoring(): Promise<void> {
//     try {
//       if (this.isMonitoring) {
//         logger.warn('Security monitoring is already running');
//         return;
//       }

//       logger.info('Starting security monitoring...');

//       // Start tamper detection monitoring
//       await this.tamperDetection.startMonitoring();
      
//       // Start file watching
//       await this.fileWatcher.startWatching();
      
//       this.isMonitoring = true;
//       logger.info('Security monitoring started');
//     } catch (error) {
//       logger.error('Failed to start security monitoring:', error);
//       throw new SecurityError('Failed to start security monitoring', error);
//     }
//   }

//   /**
//    * Stop security monitoring
//    */
//   async stopMonitoring(): Promise<void> {
//     try {
//       if (!this.isMonitoring) {
//         return;
//       }

//       logger.info('Stopping security monitoring...');

//       // Stop tamper detection
//       await this.tamperDetection.stopMonitoring();
      
//       // Stop file watching
//       await this.fileWatcher.stopWatching();
      
//       this.isMonitoring = false;
//       logger.info('Security monitoring stopped');
//     } catch (error) {
//       logger.error('Failed to stop security monitoring:', error);
//     }
//   }

//   /**
//    * Check for tampering
//    */
//   async checkForTampering(): Promise<TamperResult> {
//     try {
//       logger.debug('Performing tamper detection check...');
      
//       const result = await this.tamperDetection.checkForTampering();
      
//       if (result.isTampered) {
//         logger.securityAlert('Tampering detected', result);
//         await this.handleTamperingDetected(result);
//       }
      
//       return result;
//     } catch (error) {
//       logger.error('Tamper detection check failed:', error);
//       return {
//         isTampered: false,
//         reason: 'Check failed',
//         details: { error: error instanceof Error ? error.message : 'Unknown error' },
//       };
//     }
//   }

//   /**
//    * Handle tampering detected
//    */
//   private async handleTamperingDetected(result: TamperResult): Promise<void> {
//     try {
//       logger.error('🚨 SECURITY ALERT: Tampering detected!');
//       logger.error(`Reason: ${result.reason}`);
      
//       if (result.details) {
//         logger.error('Details:', result.details);
//       }

//       // Take security actions
//       await this.takeSecurityActions(result);
      
//     } catch (error) {
//       logger.error('Failed to handle tampering detection:', error);
//     }
//   }

//   /**
//    * Take security actions when tampering is detected
//    */
//   private async takeSecurityActions(result: TamperResult): Promise<void> {
//     try {
//       // Log security event
//       logger.securityAlert('Security breach detected', result);
      
//       // Disable agent operations
//       await this.disableAgent();
      
//       // Notify cloud server (if possible)
//       await this.notifyCloudOfSecurityBreach(result);
      
//       // Create security report
//       await this.createSecurityReport(result);
      
//     } catch (error) {
//       logger.error('Failed to take security actions:', error);
//     }
//   }

//   /**
//    * Disable agent operations
//    */
//   private async disableAgent(): Promise<void> {
//     try {
//       // This would typically involve stopping the agent or putting it in a secure state
//       logger.error('Agent disabled due to security breach');
//     } catch (error) {
//       logger.error('Failed to disable agent:', error);
//     }
//   }

//   /**
//    * Notify cloud server of security breach
//    */
//   private async notifyCloudOfSecurityBreach(result: TamperResult): Promise<void> {
//     try {
//       // This would send a security alert to the cloud server
//       logger.info('Security breach notification would be sent to cloud server');
//     } catch (error) {
//       logger.error('Failed to notify cloud of security breach:', error);
//     }
//   }

//   /**
//    * Create security report
//    */
//   private async createSecurityReport(result: TamperResult): Promise<void> {
//     try {
//       const report = {
//         timestamp: new Date().toISOString(),
//         event: 'tampering_detected',
//         reason: result.reason,
//         details: result.details,
//         machineId: await this.machineId.getMachineId(),
//         agentId: process.env.AGENT_ID,
//       };

//       // Save security report
//       const reportPath = this.configManager.getConfigDir() + '/security-report.json';
//       const fs = await import('fs-extra');
//       await fs.writeJson(reportPath, report, { spaces: 2 });
      
//       logger.info(`Security report created: ${reportPath}`);
//     } catch (error) {
//       logger.error('Failed to create security report:', error);
//     }
//   }

//   /**
//    * Encrypt sensitive data
//    */
//   async encryptData(data: string): Promise<string> {
//     try {
//       return await this.encryption.encrypt(data);
//     } catch (error) {
//       logger.error('Failed to encrypt data:', error);
//       throw new SecurityError('Encryption failed', error);
//     }
//   }

//   /**
//    * Decrypt sensitive data
//    */
//   async decryptData(encryptedData: string): Promise<string> {
//     try {
//       return await this.encryption.decrypt(encryptedData);
//     } catch (error) {
//       logger.error('Failed to decrypt data:', error);
//       throw new SecurityError('Decryption failed', error);
//     }
//   }

//   /**
//    * Get machine ID
//    */
//   async getMachineId(): Promise<string> {
//     try {
//       return await this.machineId.getMachineId();
//     } catch (error) {
//       logger.error('Failed to get machine ID:', error);
//       throw new SecurityError('Failed to get machine ID', error);
//     }
//   }

//   /**
//    * Validate machine ID
//    */
//   async validateMachineId(expectedMachineId: string): Promise<boolean> {
//     try {
//       const currentMachineId = await this.getMachineId();
//       return currentMachineId === expectedMachineId;
//     } catch (error) {
//       logger.error('Failed to validate machine ID:', error);
//       return false;
//     }
//   }

//   /**
//    * Get security status
//    */
//   getSecurityStatus(): {
//     isMonitoring: boolean;
//     tamperDetectionActive: boolean;
//     fileWatcherActive: boolean;
//     encryptionAvailable: boolean;
//     machineIdValid: boolean;
//   } {
//     return {
//       isMonitoring: this.isMonitoring,
//       tamperDetectionActive: this.tamperDetection.isMonitoring(),
//       fileWatcherActive: this.fileWatcher.isWatching(),
//       encryptionAvailable: this.encryption.isAvailable(),
//       machineIdValid: this.machineId.isValid(),
//     };
//   }

//   /**
//    * Run security audit
//    */
//   async runSecurityAudit(): Promise<{
//     passed: boolean;
//     issues: string[];
//     recommendations: string[];
//   }> {
//     try {
//       logger.info('Running security audit...');
      
//       const issues: string[] = [];
//       const recommendations: string[] = [];

//       // Check tamper detection
//       const tamperResult = await this.checkForTampering();
//       if (tamperResult.isTampered) {
//         issues.push(`Tampering detected: ${tamperResult.reason}`);
//       }

//       // Check file integrity
//       const fileIntegrityResult = await this.fileWatcher.checkFileIntegrity();
//       if (!fileIntegrityResult.valid) {
//         issues.push('File integrity check failed');
//       }

//       // Check encryption availability
//       if (!this.encryption.isAvailable()) {
//         issues.push('Encryption not available');
//         recommendations.push('Ensure encryption keys are properly configured');
//       }

//       // Check machine ID validity
//       if (!this.machineId.isValid()) {
//         issues.push('Machine ID validation failed');
//         recommendations.push('Verify machine ID configuration');
//       }

//       const passed = issues.length === 0;

//       logger.info(`Security audit ${passed ? 'passed' : 'failed'}`, {
//         issues: issues.length,
//         recommendations: recommendations.length,
//       });

//       return {
//         passed,
//         issues,
//         recommendations,
//       };
//     } catch (error) {
//       logger.error('Security audit failed:', error);
//       return {
//         passed: false,
//         issues: ['Security audit failed'],
//         recommendations: ['Check security configuration'],
//       };
//     }
//   }

//   /**
//    * Update security configuration
//    */
//   async updateSecurityConfig(config: any): Promise<void> {
//     try {
//       // Update tamper detection configuration
//       if (config.tamperDetection) {
//         await this.tamperDetection.updateConfig(config.tamperDetection);
//       }

//       // Update file watcher configuration
//       if (config.fileWatcher) {
//         await this.fileWatcher.updateConfig(config.fileWatcher);
//       }

//       // Update encryption configuration
//       if (config.encryption) {
//         await this.encryption.updateConfig(config.encryption);
//       }

//       logger.info('Security configuration updated');
//     } catch (error) {
//       logger.error('Failed to update security configuration:', error);
//       throw new SecurityError('Failed to update security configuration', error);
//     }
//   }

//   /**
//    * Get security statistics
//    */
//   getSecurityStats(): {
//     totalTamperChecks: number;
//     tamperDetections: number;
//     filesMonitored: number;
//     encryptionOperations: number;
//   } {
//     return {
//       totalTamperChecks: this.tamperDetection.getCheckCount(),
//       tamperDetections: this.tamperDetection.getDetectionCount(),
//       filesMonitored: this.fileWatcher.getMonitoredFileCount(),
//       encryptionOperations: this.encryption.getOperationCount(),
//     };
//   }
// }
