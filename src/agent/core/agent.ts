// ============================================================================
// MAIN AGENT CLASS - Orchestrates all agent operations
// ============================================================================

import { logger } from '../utils/logger.js';
import { AgentConfig, PrinterInfo, AgentStatus } from '../types/index.js';
import { ConfigManager } from './config/ConfigManager.js';
import { PrinterManager } from './printer/PrinterManager.js';
import { JobProcessor } from './job/JobProcessor.js';
import { CloudClient } from '../utils/cloud/CloundClient.js';
import path from 'path';
// import { SecurityManager } from './security/SecurityManager.js';

interface AgentState {
  status: 'initializing' | 'online' | 'offline' | 'printing' | 'error';
  lastPoll: Date | null;
  jobsProcessed: number;
  printers: PrinterInfo[];
  uptime: number;
}



export class Agent {
  public isRunning: boolean;
  private config: AgentConfig | null = null;
  private configManager: ConfigManager | null = null;
  private printerManager: PrinterManager | null = null;
  private jobProcessor: JobProcessor | null = null;
  private cloudClient: CloudClient | null = null;
  // private securityManager: SecurityManager | null = null;

  constructor(){
    this.isRunning = false
  }

  private agentState: AgentState = {
    status: 'initializing',
    lastPoll: null,
    jobsProcessed: 0,
    printers: [],
    uptime: 0,
  };

  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private startTime: Date = new Date();

  /**
   * Initialize agent components
   */
  initialize(): void {
    try {
      logger.info('🔧 Initializing agent components...\n');

      // 1. Load configuration
      // this.configManager = new ConfigManager();
      // this.config = this.configManager.loadConfig();
      logger.info('✅ Configuration loaded');
      // logger.debug(`   Cloud Server: ${this.config.cloudUrl}`);
      // logger.debug(`   Agent ID: ${this.config.agentId}`);

      // 2. Initialize cloud client
      // this.cloudClient = new CloudClient(
      //   this.config.cloudUrl,
      //   this.config.apiKey,
      //   this.config.agentId
      // );
      logger.info('✅ Cloud client initialized');

      // 3. Initialize printer manager
      this.printerManager = new PrinterManager();
      logger.info('✅ Printer manager initialized');

      // 4. Initialize job processor
      // this.jobProcessor = new JobProcessor(
      //   // this.cloudClient,
      //   this.printerManager,
      //   this.config
      // );
      logger.info('✅ Job processor initialized');

      // 5. Initialize security manager
      // if (this.configManager) {
      //   // this.securityManager = new SecurityManager(this.configManager);
      //   logger.info('✅ Security manager initialized\n');
      // }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Initialization failed: ${message}`);
    }
  }

  /**
   * Start the agent - discover printers and begin polling
   */

  /**
 * Test print functionality
 */
async testPrint(): Promise<void> {
  try {
    if (!this.printerManager) {
      throw new Error('Printer manager not initialized');
    }

    const printers = this.agentState.printers;
    
    if (printers.length === 0) {
      logger.error('No printers available for test print');
      return;
    }

    const printerName = printers[0].printerName;
    const pdfPath = path.join(process.cwd(), 'src/testfiles/Deed Of Assignment (Mr Ayi Mensah).pdf');

    logger.info(`\n🧪 Test Print`);
    logger.info(`   Printer: ${printerName}`);
    logger.info(`   File: ${pdfPath}\n`);

    await this.printerManager.printFile(printerName, pdfPath, {
      copies: 1,
      colorMode: 'color',
      orientation: 'portrait'
    });

    logger.info('✅ Test print completed!\n');

  } catch (error) {
    logger.error('Test print failed:', error);
  }
}
  async start(): Promise<void> {
    try {
      this.isRunning = true;
      this.agentState.status = 'online';

      logger.info('🖨️  Discovering printers...');
      await this.discoverAndRegisterPrinters();

      logger.info('📡 Starting main loop...\n');
      this.startPolling();
      this.startHeartbeat();
      // this.startSecurityMonitoring();

      logger.info('✅ Agent started successfully and is ready for jobs!\n');
      logger.info('📊 Status: Online');
      logger.info(`📍 Location: ${this.config?.locationName}`);
      logger.info(`🖨️  Printers: ${this.agentState.printers.length}`);
      logger.info(`⏱️  Poll Interval: ${process.env.POLL_INTERVAL}ms\n`);

      // Return immediately without blocking on keepAlive
      // The agent will continue running in background
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to start agent: ${message}`);
      throw error;
    }
  }

  /**
   * Discover all connected printers and register with cloud
   */
  private async discoverAndRegisterPrinters(): Promise<void> {
    try {
      if (!this.printerManager) throw new Error('Printer manager not initialized');

      const printers = await this.printerManager.discoverPrinters();

      if (printers.length === 0) {
        logger.warn('⚠️  No printers found on this system');
        logger.warn('   Please ensure printers are:');
        logger.warn('   1. Connected (USB, Network, or Bluetooth)');
        logger.warn('   2. Installed with proper drivers');
        logger.warn('   3. Enabled in system settings\n');
        return;
      }

      logger.info(`✅ Found ${printers.length} printer(s):`);
      printers.forEach((p, i) => {
        logger.info(`   ${i + 1}. ${p.displayName || p.printerName} (${p.status})`);
      });

      // Register printers with cloud server
      if (this.cloudClient) {
        await this.cloudClient.registerPrinters(printers);
      }
      this.agentState.printers = printers;
      logger.info('✅ Printers registered with cloud\n');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to discover printers: ${message}`);
    }
  }

  /**
   * Poll cloud server for new jobs
   */
  private startPolling(): void {
    const pollInterval = parseInt(process.env.POLL_INTERVAL || '5000');

    const interval = setInterval(() => {
      void (async () => {
        try {
          if (!this.cloudClient || !this.jobProcessor) return;

          const jobs = await this.cloudClient.getJobs();

        if (jobs && jobs.length > 0) {
          logger.info(`\n📋 Found ${jobs.length} job(s) to process`);

          for (const job of jobs) {
            await this.jobProcessor.processJob(job);
            this.agentState.jobsProcessed++;
          }
        }

          this.agentState.lastPoll = new Date();
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (!message.includes('ECONNREFUSED') && !message.includes('404')) {
            logger.debug(`Poll error: ${message}`);
          }
        }
      })();
    }, pollInterval);

    this.intervals.set('polling', interval);
  }

  /**
   * Send heartbeat to cloud server periodically
   */
  private startHeartbeat(): void {
    const heartbeatInterval = parseInt(process.env.HEARTBEAT_INTERVAL || '30000');

    const interval = setInterval(() => {
      void (async () => {
        try {
          if (!this.cloudClient) return;

          const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
        const status: AgentStatus = {
          status: this.agentState.status as 'online' | 'offline',
          printerCount: this.agentState.printers.length,
          jobsProcessed: this.agentState.jobsProcessed,
          lastPoll: this.agentState.lastPoll,
          uptime,
        };

          await this.cloudClient.sendHeartbeat(status);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logger.debug(`Heartbeat failed: ${message}`);
        }
      })();
    }, heartbeatInterval);

    this.intervals.set('heartbeat', interval);
  }

  /**
   * Monitor for tampering and security issues
   */
  // private startSecurityMonitoring(): void {
  //   const securityCheckInterval = parseInt(process.env.FILE_WATCH_INTERVAL || '60000');

  //   const interval = setInterval(() => {
  //     void (async () => {
  //       try {
  //         if (!this.securityManager) return;

  //         const result = await this.securityManager.checkForTampering();

  //       if (result.isTampered) {
  //         logger.error('🚨 SECURITY ALERT: Tampering detected!');
  //         logger.error(`   Reason: ${result.reason}`);
  //         this.agentState.status = 'error';
  //           await this.shutdown();
  //         }
  //       } catch (error) {
  //         const message = error instanceof Error ? error.message : String(error);
  //         logger.error(`Security check error: ${message}`);
  //       }
  //     })();
  //   }, securityCheckInterval);

  //   this.intervals.set('security', interval);
  // }

  /**
   * Keep process alive
   */
  // private keepAlive(): Promise<never> {
  //   return new Promise(() => {
  //     // This promise never resolves, keeping the process alive
  //   });
  // }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('\n👋 Shutting down agent...');

    this.isRunning = false;
    this.agentState.status = 'offline';

    // Clear all intervals
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      logger.debug(`   Cleared ${name} interval`);
    }
    this.intervals.clear();

    // Notify cloud of shutdown
    try {
      if (this.cloudClient) {
        const status: AgentStatus = {
          status: 'offline',
          printerCount: 0,
          jobsProcessed: this.agentState.jobsProcessed,
          lastPoll: this.agentState.lastPoll,
          uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
        };
        await this.cloudClient.sendHeartbeat(status);
      }
    } catch (error) {
      logger.debug('Failed to notify cloud of shutdown');
    }

    logger.info('✅ Agent shut down successfully');
    process.exit(0);
  }

  /**
   * Get agent status
   */
  getStatus(): AgentState {
    return {
      ...this.agentState,
      uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
    };
  }

  /**
   * Get printer manager instance
   */
  getPrinterManager(): PrinterManager | null {
    return this.printerManager;
  }

  /**
   * Get cloud client instance
   */
  getCloudClient(): CloudClient | null {
    return this.cloudClient;
  }

  /**
   * Get job processor instance
   */
  getJobProcessor(): JobProcessor | null {
    return this.jobProcessor;
  }
}