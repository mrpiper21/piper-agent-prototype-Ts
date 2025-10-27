// // ============================================================================
// // TAMPER DETECTION - Detect tampering with agent files and configuration
// // ============================================================================

// import fs from 'fs-extra';
// import crypto from 'crypto';
// import path from 'path';
// import { logger } from '../../utils/logger.js';
// import { TamperResult, SecurityError } from '../../types/index.js';
// import { platform } from '../../utils/platform.js';

// export class TamperDetection {
//   private checksumFile: string;
//   private monitoredFiles: Set<string> = new Set();
//   private isMonitoring: boolean = false;
//   private monitoringInterval: NodeJS.Timeout | null = null;
//   private checkCount: number = 0;
//   private detectionCount: number = 0;
//   private fileChecksums: Map<string, string> = new Map();

//   constructor() {
//     this.checksumFile = path.join(platform.getConfigDirectory(), 'file-checksums.json');
//   }

//   /**
//    * Initialize tamper detection
//    */
//   async initialize(): Promise<void> {
//     try {
//       // Ensure config directory exists
//       await fs.ensureDir(platform.getConfigDirectory());

//       // Load existing checksums
//       await this.loadChecksums();

//       // Add critical files to monitoring
//       await this.addCriticalFiles();

//       logger.debug('Tamper detection initialized');
//     } catch (error) {
//       logger.error('Failed to initialize tamper detection:', error);
//       throw new SecurityError('Tamper detection initialization failed', error);
//     }
//   }

//   /**
//    * Start monitoring for tampering
//    */
//   async startMonitoring(): Promise<void> {
//     try {
//       if (this.isMonitoring) {
//         logger.warn('Tamper detection is already monitoring');
//         return;
//       }

//       // Calculate initial checksums
//       await this.calculateChecksums();

//       // Start periodic monitoring
//       this.monitoringInterval = setInterval(async () => {
//         try {
//           await this.checkForTampering();
//         } catch (error) {
//           logger.error('Tamper detection check failed:', error);
//         }
//       }, 60000); // Check every minute

//       this.isMonitoring = true;
//       logger.info('Tamper detection monitoring started');
//     } catch (error) {
//       logger.error('Failed to start tamper detection monitoring:', error);
//       throw new SecurityError('Failed to start tamper detection', error);
//     }
//   }

//   /**
//    * Stop monitoring for tampering
//    */
//   async stopMonitoring(): Promise<void> {
//     try {
//       if (!this.isMonitoring) {
//         return;
//       }

//       if (this.monitoringInterval) {
//         clearInterval(this.monitoringInterval);
//         this.monitoringInterval = null;
//       }

//       this.isMonitoring = false;
//       logger.info('Tamper detection monitoring stopped');
//     } catch (error) {
//       logger.error('Failed to stop tamper detection monitoring:', error);
//     }
//   }

//   /**
//    * Check for tampering
//    */
//   async checkForTampering(): Promise<TamperResult> {
//     try {
//       this.checkCount++;

//       for (const filePath of this.monitoredFiles) {
//         const result = await this.checkFileTampering(filePath);
//         if (result.isTampered) {
//           this.detectionCount++;
//           return result;
//         }
//       }

//       return {
//         isTampered: false,
//         reason: 'No tampering detected',
//       };
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
//    * Check individual file for tampering
//    */
//   private async checkFileTampering(filePath: string): Promise<TamperResult> {
//     try {
//       // Check if file exists
//       if (!await fs.pathExists(filePath)) {
//         return {
//           isTampered: true,
//           reason: 'Critical file missing',
//           details: { filePath, issue: 'file_missing' },
//         };
//       }

//       // Calculate current checksum
//       const currentChecksum = await this.calculateFileChecksum(filePath);
      
//       // Get stored checksum
//       const storedChecksum = this.fileChecksums.get(filePath);

//       if (storedChecksum && currentChecksum !== storedChecksum) {
//         return {
//           isTampered: true,
//           reason: 'File checksum mismatch',
//           details: {
//             filePath,
//             storedChecksum,
//             currentChecksum,
//             issue: 'checksum_mismatch',
//           },
//         };
//       }

//       // Check file permissions
//       const stats = await fs.stat(filePath);
//       if (this.isFilePermissionTampered(stats)) {
//         return {
//           isTampered: true,
//           reason: 'File permissions tampered',
//           details: {
//             filePath,
//             mode: stats.mode,
//             issue: 'permission_tampered',
//           },
//         };
//       }

//       return {
//         isTampered: false,
//         reason: 'File integrity verified',
//       };
//     } catch (error) {
//       logger.error(`Failed to check file tampering for ${filePath}:`, error);
//       return {
//         isTampered: true,
//         reason: 'File check failed',
//         details: {
//           filePath,
//           error: error instanceof Error ? error.message : 'Unknown error',
//           issue: 'check_failed',
//         },
//       };
//     }
//   }

//   /**
//    * Check if file permissions have been tampered with
//    */
//   private isFilePermissionTampered(stats: fs.Stats): boolean {
//     // Check if file is writable by others (security risk)
//     const mode = stats.mode;
//     const othersWrite = (mode & 0o002) !== 0;
//     const groupWrite = (mode & 0o020) !== 0;
    
//     // Allow group write for some files, but not others write
//     return othersWrite;
//   }

//   /**
//    * Calculate checksum for a file
//    */
//   private async calculateFileChecksum(filePath: string): Promise<string> {
//     try {
//       const data = await fs.readFile(filePath);
//       return crypto.createHash('sha256').update(data).digest('hex');
//     } catch (error) {
//       logger.error(`Failed to calculate checksum for ${filePath}:`, error);
//       return '';
//     }
//   }

//   /**
//    * Calculate checksums for all monitored files
//    */
//   private async calculateChecksums(): Promise<void> {
//     try {
//       for (const filePath of this.monitoredFiles) {
//         if (await fs.pathExists(filePath)) {
//           const checksum = await this.calculateFileChecksum(filePath);
//           this.fileChecksums.set(filePath, checksum);
//         }
//       }

//       // Save checksums to file
//       await this.saveChecksums();
//     } catch (error) {
//       logger.error('Failed to calculate checksums:', error);
//     }
//   }

//   /**
//    * Add critical files to monitoring
//    */
//   private async addCriticalFiles(): Promise<void> {
//     try {
//       // Add configuration files
//       const configDir = platform.getConfigDirectory();
//       this.monitoredFiles.add(path.join(configDir, 'agent.config.json'));

//       // Add executable files (if in development, monitor source files)
//       if (process.env.NODE_ENV === 'development') {
//         const srcDir = path.join(process.cwd(), 'src');
//         if (await fs.pathExists(srcDir)) {
//           // Add core source files
//           this.monitoredFiles.add(path.join(srcDir, 'index.ts'));
//           this.monitoredFiles.add(path.join(srcDir, 'core', 'agent.ts'));
//           this.monitoredFiles.add(path.join(srcDir, 'core', 'config', 'ConfigManager.ts'));
//         }
//       }

//       // Add package.json
//       const packageJsonPath = path.join(process.cwd(), 'package.json');
//       if (await fs.pathExists(packageJsonPath)) {
//         this.monitoredFiles.add(packageJsonPath);
//       }

//       logger.debug(`Added ${this.monitoredFiles.size} files to tamper detection monitoring`);
//     } catch (error) {
//       logger.error('Failed to add critical files to monitoring:', error);
//     }
//   }

//   /**
//    * Add file to monitoring
//    */
//   async addFileToMonitoring(filePath: string): Promise<void> {
//     try {
//       if (!await fs.pathExists(filePath)) {
//         throw new Error(`File does not exist: ${filePath}`);
//       }

//       this.monitoredFiles.add(filePath);
      
//       // Calculate and store checksum
//       const checksum = await this.calculateFileChecksum(filePath);
//       this.fileChecksums.set(filePath, checksum);
      
//       await this.saveChecksums();
      
//       logger.debug(`Added file to tamper detection: ${filePath}`);
//     } catch (error) {
//       logger.error(`Failed to add file to monitoring: ${filePath}`, error);
//       throw error;
//     }
//   }

//   /**
//    * Remove file from monitoring
//    */
//   async removeFileFromMonitoring(filePath: string): Promise<void> {
//     try {
//       this.monitoredFiles.delete(filePath);
//       this.fileChecksums.delete(filePath);
      
//       await this.saveChecksums();
      
//       logger.debug(`Removed file from tamper detection: ${filePath}`);
//     } catch (error) {
//       logger.error(`Failed to remove file from monitoring: ${filePath}`, error);
//       throw error;
//     }
//   }

//   /**
//    * Load checksums from file
//    */
//   private async loadChecksums(): Promise<void> {
//     try {
//       if (await fs.pathExists(this.checksumFile)) {
//         const data = await fs.readJson(this.checksumFile);
        
//         if (data.checksums) {
//           for (const [filePath, checksum] of Object.entries(data.checksums)) {
//             this.fileChecksums.set(filePath, checksum as string);
//           }
//         }
        
//         logger.debug(`Loaded ${this.fileChecksums.size} file checksums`);
//       }
//     } catch (error) {
//       logger.error('Failed to load checksums:', error);
//     }
//   }

//   /**
//    * Save checksums to file
//    */
//   private async saveChecksums(): Promise<void> {
//     try {
//       const data = {
//         checksums: Object.fromEntries(this.fileChecksums),
//         lastUpdated: new Date().toISOString(),
//         version: '1.0.0',
//       };

//       await fs.writeJson(this.checksumFile, data, { spaces: 2 });
//     } catch (error) {
//       logger.error('Failed to save checksums:', error);
//     }
//   }

//   /**
//    * Update checksum for a file
//    */
//   async updateFileChecksum(filePath: string): Promise<void> {
//     try {
//       if (this.monitoredFiles.has(filePath)) {
//         const checksum = await this.calculateFileChecksum(filePath);
//         this.fileChecksums.set(filePath, checksum);
//         await this.saveChecksums();
        
//         logger.debug(`Updated checksum for file: ${filePath}`);
//       }
//     } catch (error) {
//       logger.error(`Failed to update checksum for file ${filePath}:`, error);
//     }
//   }

//   /**
//    * Check if monitoring is active
//    */
//   isMonitoring(): boolean {
//     return this.isMonitoring;
//   }

//   /**
//    * Get monitored files
//    */
//   getMonitoredFiles(): string[] {
//     return Array.from(this.monitoredFiles);
//   }

//   /**
//    * Get check count
//    */
//   getCheckCount(): number {
//     return this.checkCount;
//   }

//   /**
//    * Get detection count
//    */
//   getDetectionCount(): number {
//     return this.detectionCount;
//   }

//   /**
//    * Get tamper detection statistics
//    */
//   getStats(): {
//     monitoredFiles: number;
//     totalChecks: number;
//     detections: number;
//     isMonitoring: boolean;
//   } {
//     return {
//       monitoredFiles: this.monitoredFiles.size,
//       totalChecks: this.checkCount,
//       detections: this.detectionCount,
//       isMonitoring: this.isMonitoring,
//     };
//   }

//   /**
//    * Update configuration
//    */
//   async updateConfig(config: any): Promise<void> {
//     try {
//       // Update monitoring interval if provided
//       if (config.checkInterval) {
//         if (this.monitoringInterval) {
//           clearInterval(this.monitoringInterval);
//         }

//         if (this.isMonitoring) {
//           this.monitoringInterval = setInterval(async () => {
//             try {
//               await this.checkForTampering();
//             } catch (error) {
//               logger.error('Tamper detection check failed:', error);
//             }
//           }, config.checkInterval);
//         }
//       }

//       logger.info('Tamper detection configuration updated');
//     } catch (error) {
//       logger.error('Failed to update tamper detection configuration:', error);
//       throw error;
//     }
//   }
// }
