// // ============================================================================
// // FILE WATCHER - Monitor file system changes for security
// // ============================================================================

// import fs from 'fs-extra';
// import path from 'path';
// import chokidar from 'chokidar';
// import { logger } from '../../utils/logger.js';
// import { SecurityError } from '../../types/index.js';
// import { platform } from '../../utils/platform.js';

// export class FileWatcher {
//   private watcher: chokidar.FSWatcher | null = null;
//   private watchedPaths: Set<string> = new Set();
//   private isWatching: boolean = false;
//   private allowedPaths: Set<string> = new Set();
//   private blockedPaths: Set<string> = new Set();
//   private monitoredFileCount: number = 0;
//   private changeEvents: Map<string, any[]> = new Map();

//   constructor() {
//     this.initializeAllowedPaths();
//     this.initializeBlockedPaths();
//   }

//   /**
//    * Initialize file watcher
//    */
//   async initialize(): Promise<void> {
//     try {
//       logger.debug('File watcher initialized');
//     } catch (error) {
//       logger.error('Failed to initialize file watcher:', error);
//       throw new SecurityError('File watcher initialization failed', error);
//     }
//   }

//   /**
//    * Start watching files
//    */
//   async startWatching(): Promise<void> {
//     try {
//       if (this.isWatching) {
//         logger.warn('File watcher is already running');
//         return;
//       }

//       // Create watcher instance
//       this.watcher = chokidar.watch([], {
//         ignored: /(^|[\/\\])\../, // ignore dotfiles
//         persistent: true,
//         ignoreInitial: true,
//         followSymlinks: false,
//         depth: 2, // Limit depth to prevent excessive monitoring
//       });

//       // Set up event handlers
//       // this.setupEventHandlers();

//       // Add paths to watch
//       await this.addPathsToWatch();

//       this.isWatching = true;
//       logger.info('File watcher started');
//     } catch (error) {
//       logger.error('Failed to start file watcher:', error);
//       throw new SecurityError('Failed to start file watcher', error);
//     }
//   }

//   /**
//    * Stop watching files
//    */
//   async stopWatching(): Promise<void> {
//     try {
//       if (!this.isWatching || !this.watcher) {
//         return;
//       }

//       await this.watcher.close();
//       this.watcher = null;
//       this.isWatching = false;
      
//       logger.info('File watcher stopped');
//     } catch (error) {
//       logger.error('Failed to stop file watcher:', error);
//     }
//   }

//   /**
//    * Set up event handlers
//    */
//   // private setupEventHandlers(): void {
//   //   if (!this.watcher) return;

//   //   this.watcher
//   //     .on('add', (filePath) => this.handleFileAdd(filePath as string))
//   //     .on('change', (filePath) => this.handleFileChange(filePath as string))
//   //     .on('unlink', (filePath) => this.handleFileDelete(filePath as string))
//   //     .on('error', (error) => this.handleWatcherError(error as Error));
//   // }

//   /**
//    * Handle file addition
//    */
//   private async handleFileAdd(filePath: string): Promise<void> {
//     try {
//       if (this.isPathAllowed(filePath)) {
//         logger.debug(`File added: ${filePath}`);
//         this.recordChangeEvent(filePath, 'add');
//       } else {
//         logger.warn(`Unauthorized file addition detected: ${filePath}`);
//         await this.handleSecurityViolation('unauthorized_file_addition', { filePath });
//       }
//     } catch (error) {
//       logger.error(`Error handling file addition: ${filePath}`, error);
//     }
//   }

//   /**
//    * Handle file change
//    */
//   private async handleFileChange(filePath: string): Promise<void> {
//     try {
//       if (this.isPathAllowed(filePath)) {
//         logger.debug(`File changed: ${filePath}`);
//         this.recordChangeEvent(filePath, 'change');
//       } else {
//         logger.warn(`Unauthorized file change detected: ${filePath}`);
//         await this.handleSecurityViolation('unauthorized_file_change', { filePath });
//       }
//     } catch (error) {
//       logger.error(`Error handling file change: ${filePath}`, error);
//     }
//   }

//   /**
//    * Handle file deletion
//    */
//   private async handleFileDelete(filePath: string): Promise<void> {
//     try {
//       if (this.isCriticalFile(filePath)) {
//         logger.warn(`Critical file deletion detected: ${filePath}`);
//         await this.handleSecurityViolation('critical_file_deletion', { filePath });
//       } else if (this.isPathAllowed(filePath)) {
//         logger.debug(`File deleted: ${filePath}`);
//         this.recordChangeEvent(filePath, 'delete');
//       } else {
//         logger.warn(`Unauthorized file deletion detected: ${filePath}`);
//         await this.handleSecurityViolation('unauthorized_file_deletion', { filePath });
//       }
//     } catch (error) {
//       logger.error(`Error handling file deletion: ${filePath}`, error);
//     }
//   }

//   /**
//    * Handle watcher error
//    */
//   private handleWatcherError(error: Error): void {
//     logger.error('File watcher error:', error);
//   }

//   /**
//    * Handle security violation
//    */
//   private async handleSecurityViolation(violationType: string, details: any): Promise<void> {
//     try {
//       logger.securityAlert(`Security violation detected: ${violationType}`, details);
      
//       // Create security report
//       await this.createSecurityReport(violationType, details);
      
//     } catch (error) {
//       logger.error('Failed to handle security violation:', error);
//     }
//   }

//   /**
//    * Create security report
//    */
//   private async createSecurityReport(violationType: string, details: any): Promise<void> {
//     try {
//       const report = {
//         timestamp: new Date().toISOString(),
//         violationType,
//         details: details as Record<string, any>,
//         agentId: process.env["AGENT_ID"],
//         machineId: await Promise.resolve(this.getMachineId()),
//       };

//       const reportPath = path.join(platform.getConfigDirectory(), 'security-violation.json');
//       await fs.writeJson(reportPath, report, { spaces: 2 });
      
//       logger.info(`Security violation report created: ${reportPath}`);
//     } catch (error) {
//       logger.error('Failed to create security report:', error);
//     }
//   }

//   /**
//    * Get machine ID (placeholder implementation)
//    */
//   private async getMachineId(): Promise<string> {
//     // This would typically get the actual machine ID
//     return await Promise.resolve('placeholder-machine-id');
//   }

//   /**
//    * Check if path is allowed
//    */
//   private isPathAllowed(filePath: string): boolean {
//     // Check if path is explicitly blocked
//     for (const blockedPath of this.blockedPaths) {
//       if (filePath.startsWith(blockedPath)) {
//         return false;
//       }
//     }

//     // Check if path is in allowed paths
//     for (const allowedPath of this.allowedPaths) {
//       if (filePath.startsWith(allowedPath)) {
//         return true;
//       }
//     }

//     // Default to not allowed if not explicitly allowed
//     return false;
//   }

//   /**
//    * Check if file is critical
//    */
//   private isCriticalFile(filePath: string): boolean {
//     const criticalFiles = [
//       'agent.config.json',
//       'package.json',
//       'index.ts',
//       'agent.ts',
//       'ConfigManager.ts',
//     ];

//     const fileName = path.basename(filePath);
//     return criticalFiles.includes(fileName);
//   }

//   /**
//    * Record change event
//    */
//   private recordChangeEvent(filePath: string, eventType: string): void {
//     const events = this.changeEvents.get(filePath) || [];
//     events.push({
//       timestamp: new Date().toISOString(),
//       type: eventType,
//     });

//     // Keep only last 10 events per file
//     if (events.length > 10) {
//       events.shift();
//     }

//     this.changeEvents.set(filePath, events);
//   }

//   /**
//    * Add paths to watch
//    */
//   private async addPathsToWatch(): Promise<void> {
//     try {
//       if (!this.watcher) return;

//       // Add application data directory
//       const appDataDir = platform.getApplicationDataDirectory();
//       this.watcher.add(appDataDir);
//       this.watchedPaths.add(appDataDir);

//       // Add config directory
//       const configDir = platform.getConfigDirectory();
//       this.watcher.add(configDir);
//       this.watchedPaths.add(configDir);

//       // Add downloads directory
//       const downloadsDir = platform.getDownloadsDirectory();
//       this.watcher.add(downloadsDir);
//       this.watchedPaths.add(downloadsDir);

//       // Count monitored files
//       await this.countMonitoredFiles();

//       logger.debug(`Added ${this.watchedPaths.size} paths to file watcher`);
//     } catch (error) {
//       logger.error('Failed to add paths to watch:', error);
//     }
//   }

//   /**
//    * Count monitored files
//    */
//   private async countMonitoredFiles(): Promise<void> {
//     try {
//       let count = 0;
      
//       for (const watchedPath of this.watchedPaths) {
//         if (await fs.pathExists(watchedPath)) {
//           const files = await fs.readdir(watchedPath, { withFileTypes: true });
//           count += files.filter(file => file.isFile()).length;
//         }
//       }
      
//       this.monitoredFileCount = count;
//     } catch (error) {
//       logger.error('Failed to count monitored files:', error);
//     }
//   }

//   /**
//    * Initialize allowed paths
//    */
//   private initializeAllowedPaths(): void {
//     this.allowedPaths.add(platform.getApplicationDataDirectory());
//     this.allowedPaths.add(platform.getConfigDirectory());
//     this.allowedPaths.add(platform.getDownloadsDirectory());
//     this.allowedPaths.add(platform.getLogsDirectory());
//   }

//   /**
//    * Initialize blocked paths
//    */
//   private initializeBlockedPaths(): void {
//     // Block system directories
//     this.blockedPaths.add('/system');
//     this.blockedPaths.add('/etc');
//     this.blockedPaths.add('/usr');
//     this.blockedPaths.add('/bin');
//     this.blockedPaths.add('/sbin');
//     this.blockedPaths.add('C:\\Windows');
//     this.blockedPaths.add('C:\\System32');
//   }

//   /**
//    * Check file integrity
//    */
//   async checkFileIntegrity(): Promise<{ valid: boolean; issues: string[] }> {
//     try {
//       const issues: string[] = [];

//       // Check if critical files exist
//       const criticalFiles = [
//         path.join(platform.getConfigDirectory(), 'agent.config.json'),
//         path.join(process.cwd(), 'package.json'),
//       ];

//       for (const filePath of criticalFiles) {
//         if (!await fs.pathExists(filePath)) {
//           issues.push(`Critical file missing: ${filePath}`);
//         }
//       }

//       return {
//         valid: issues.length === 0,
//         issues,
//       };
//     } catch (error) {
//       logger.error('File integrity check failed:', error);
//       return {
//         valid: false,
//         issues: ['File integrity check failed'],
//       };
//     }
//   }

//   /**
//    * Add path to watch
//    */
//   async addPathToWatch(pathToWatch: string): Promise<void> {
//     try {
//       if (!await fs.pathExists(pathToWatch)) {
//         throw new Error(`Path does not exist: ${pathToWatch}`);
//       }

//       if (this.watcher) {
//         this.watcher.add(pathToWatch);
//       }
      
//       this.watchedPaths.add(pathToWatch);
//       logger.debug(`Added path to watch: ${pathToWatch}`);
//     } catch (error) {
//       logger.error(`Failed to add path to watch: ${pathToWatch}`, error);
//       throw error;
//     }
//   }

//   /**
//    * Remove path from watch
//    */
//   async removePathFromWatch(pathToRemove: string): Promise<void> {
//     try {
//       if (this.watcher) {
//         this.watcher.unwatch(pathToRemove);
//       }
      
//       await Promise.resolve(this.watchedPaths.delete(pathToRemove));
//       logger.debug(`Removed path from watch: ${pathToRemove}`);
//     } catch (error) {
//       logger.error(`Failed to remove path from watch: ${pathToRemove}`, error);
//       throw error;
//     }
//   }

//   /**
//    * Get change events for a file
//    */
//   getChangeEvents(filePath: string): any[] {
//     return this.changeEvents.get(filePath) || [];
//   }

//   /**
//    * Clear change events
//    */
//   clearChangeEvents(): void {
//     this.changeEvents.clear();
//     logger.debug('File change events cleared');
//   }

//   /**
//    * Check if watching
//    */

//   /**
//    * Get monitored file count
//    */
//   getMonitoredFileCount(): number {
//     return this.monitoredFileCount;
//   }

//   /**
//    * Get watched paths
//    */
//   getWatchedPaths(): string[] {
//     return Array.from(this.watchedPaths);
//   }

//   /**
//    * Get file watcher statistics
//    */
//   getStats(): {
//     isWatching: boolean;
//     watchedPaths: number;
//     monitoredFiles: number;
//     totalChangeEvents: number;
//   } {
//     let totalChangeEvents = 0;
//     for (const events of this.changeEvents.values()) {
//       totalChangeEvents += events.length;
//     }

//     return {
//       isWatching: this.isWatching,
//       watchedPaths: this.watchedPaths.size,
//       monitoredFiles: this.monitoredFileCount,
//       totalChangeEvents,
//     };
//   }

//   /**
//    * Update configuration
//    */
//   // async updateConfig(config: { allowedPaths: string[]; blockedPaths: string[] }): Promise<void> {
//   //   try {
//   //     if (config.allowedPaths) {
//   //       this.allowedPaths = new Set(config.allowedPaths as string[]);
//   //     }

//   //     if (config.blockedPaths) {
//   //       this.blockedPaths = new Set(config.blockedPaths as string[]);
//   //     }

//   //     logger.info('File watcher configuration updated');
//   //   } catch (error) {
//   //     logger.error('Failed to update file watcher configuration:', error);
//   //     throw error;
//   //   }
//   // }
// }
