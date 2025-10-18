// // ============================================================================
// // HEARTBEAT MODULE - Agent heartbeat to cloud server
// // ============================================================================

// import { logger } from '../../utils/logger.js';
// import { CloudClient } from '../../utils/cloud/CloundClient.js';
// import { AgentStatus, SystemInfo } from '../../types/index.js';
// import { platform } from '../../utils/platform.js';
// import { errorRecovery } from '../../utils/errors.js';

// export class HeartbeatService {
//   private cloudClient: CloudClient;
//   private heartbeatInterval: number;
//   private isRunning: boolean = false;
//   private heartbeatTimer: NodeJS.Timeout | null = null;
//   private consecutiveFailures: number = 0;
//   private maxConsecutiveFailures: number = 3;
//   private startTime: Date;

//   constructor(cloudClient: CloudClient, heartbeatInterval: number = 30000) {
//     this.cloudClient = cloudClient;
//     this.heartbeatInterval = heartbeatInterval;
//     this.startTime = new Date();
//   }

//   /**
//    * Start heartbeat service
//    */
//   start(): void {
//     if (this.isRunning) {
//       logger.warn('Heartbeat service is already running');
//       return;
//     }

//     this.isRunning = true;
//     logger.info(`Starting heartbeat service with ${this.heartbeatInterval}ms interval`);
    
//     // Send initial heartbeat
//     this.sendHeartbeat().then(() => {
//       this.scheduleNextHeartbeat();
//     }).catch((error) => {
//       logger.error('Initial heartbeat failed:', error);
//       this.scheduleNextHeartbeat();
//     });
//   }

//   /**
//    * Stop heartbeat service
//    */
//   stop(): void {
//     if (!this.isRunning) {
//       return;
//     }

//     this.isRunning = false;
    
//     if (this.heartbeatTimer) {
//       clearTimeout(this.heartbeatTimer);
//       this.heartbeatTimer = null;
//     }

//     // Send final heartbeat
//     this.sendHeartbeat().catch(() => {
//       // Ignore errors on shutdown
//     });

//     logger.info('Heartbeat service stopped');
//   }

//   /**
//    * Schedule next heartbeat
//    */
//   private scheduleNextHeartbeat(): void {
//     if (!this.isRunning) {
//       return;
//     }

//     this.heartbeatTimer = setTimeout(() => {
//       this.sendHeartbeat().finally(() => {
//         if (this.isRunning) {
//           this.scheduleNextHeartbeat();
//         }
//       });
//     }, this.heartbeatInterval);
//   }

//   /**
//    * Send heartbeat to cloud server
//    */
//   private async sendHeartbeat(): Promise<void> {
//     try {
//       const status = this.getAgentStatus();
//       const systemInfo = this.getSystemInfo();

//       await errorRecovery.withRetry(
//         () => this.cloudClient.sendHeartbeat(status),
//         'send-heartbeat',
//         2
//       );

//       this.consecutiveFailures = 0;
//       logger.debug('Heartbeat sent successfully');
//     } catch (error) {
//       this.consecutiveFailures++;
//       logger.error(`Heartbeat failed (attempt ${this.consecutiveFailures}):`, error);

//       if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
//         logger.error(`Max consecutive heartbeat failures (${this.maxConsecutiveFailures}) reached`);
//         this.handleHeartbeatFailure();
//       }
//     }
//   }

//   /**
//    * Handle persistent heartbeat failures
//    */
//   private handleHeartbeatFailure(): void {
//     logger.error('Heartbeat service is experiencing persistent failures');
    
//     // Increase heartbeat interval to reduce load
//     this.heartbeatInterval = Math.min(this.heartbeatInterval * 2, 300000); // Max 5 minutes
//     logger.info(`Increased heartbeat interval to ${this.heartbeatInterval}ms`);
    
//     // Reset failure count after handling
//     this.consecutiveFailures = 0;
//   }

//   /**
//    * Get current agent status
//    */
//   private getAgentStatus(): AgentStatus {
//     const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    
//     return {
//       status: 'online',
//       printerCount: 0, // This should be updated by the agent
//       jobsProcessed: 0, // This should be updated by the agent
//       lastPoll: new Date(), // This should be updated by the polling service
//       uptime,
//     };
//   }

//   /**
//    * Get system information
//    */
//   private getSystemInfo(): SystemInfo {
//     const sysInfo = platform.getSystemInfo();
    
//     return {
//       platform: sysInfo.platform,
//       arch: sysInfo.arch,
//       hostname: sysInfo.hostname,
//       nodeVersion: sysInfo.nodeVersion,
//       agentVersion: '1.0.0', // This should come from package.json
//       uptime: sysInfo.uptime,
//       memory: sysInfo.memory,
//       disk: {
//         total: 0, // Would need additional logic to get disk info
//         free: 0,
//         used: 0,
//       },
//     };
//   }

//   /**
//    * Force immediate heartbeat
//    */
//   async forceHeartbeat(): Promise<void> {
//     logger.info('Forcing immediate heartbeat...');
//     await this.sendHeartbeat();
//   }

//   /**
//    * Update heartbeat interval
//    */
//   setHeartbeatInterval(interval: number): void {
//     if (interval < 10000) {
//       throw new Error('Heartbeat interval must be at least 10000ms');
//     }

//     this.heartbeatInterval = interval;
//     logger.info(`Heartbeat interval updated to ${interval}ms`);
//   }

//   /**
//    * Get heartbeat status
//    */
//   getStatus() {
//     return {
//       isRunning: this.isRunning,
//       heartbeatInterval: this.heartbeatInterval,
//       consecutiveFailures: this.consecutiveFailures,
//       lastHeartbeat: this.lastHeartbeat,
//     };
//   }

//   /**
//    * Reset failure count
//    */
//   resetFailures(): void {
//     this.consecutiveFailures = 0;
//     logger.debug('Heartbeat failure count reset');
//   }

//   private lastHeartbeat: Date | null = null;

//   /**
//    * Update last heartbeat time
//    */
//   private updateLastHeartbeat(): void {
//     this.lastHeartbeat = new Date();
//   }
// }
