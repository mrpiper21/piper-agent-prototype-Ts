import { Agent } from '../agent/core/agent.js';
import { logger } from '../utils/logger.js';
import type {
  AgentStatus as IpcAgentStatus,
  PrinterInfo as IpcPrinterInfo,
} from '../../shared/types/ipc.types.js';
import fs from 'fs-extra';

class AgentService {
  private agentInstance: Agent | null = null;
  private isRunning: boolean = false;

  /**
   * Start the agent
   */
  async start(): Promise<void> {
    try {
      if (this.isRunning) {
        logger.warn('Agent is already running');
        return;
      }

      logger.info('Starting agent...');
      this.agentInstance = new Agent();
      this.agentInstance.initialize();
      await this.agentInstance.start();
      this.isRunning = true;
      logger.info('Agent started successfully');
    } catch (error) {
      logger.error('Failed to start agent:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    try {
      if (!this.isRunning || !this.agentInstance) {
        logger.warn('Agent is not running');
        return;
      }

      logger.info('Stopping agent...');
      await this.agentInstance.shutdown();
      this.isRunning = false;
      this.agentInstance = null;
      logger.info('Agent stopped successfully');
    } catch (error) {
      logger.error('Failed to stop agent:', error);
      throw error;
    }
  }

  /**
   * Get agent status
   */
  getStatus(): IpcAgentStatus {
    if (!this.agentInstance) {
      return {
        status: 'offline',
        printerCount: 0,
        jobsProcessed: 0,
        lastPoll: null,
        uptime: 0,
        isRunning: false,
      };
    }

    const state = this.agentInstance.getStatus();
    return {
      status: state.status,
      printerCount: state.printers.length,
      jobsProcessed: state.jobsProcessed,
      lastPoll: state.lastPoll,
      uptime: state.uptime,
      isRunning: this.isRunning,
    };
  }

  /**
   * Get discovered printers
   */
  getPrinters(): IpcPrinterInfo[] {
    if (!this.agentInstance || !this.agentInstance.isRunning) {
      return [];
    }

    const printerManager = this.agentInstance.getPrinterManager();
    if (!printerManager) {
      return [];
    }

    return printerManager.getPrinters();
  }

  /**
   * Test print a file
   */
  async testPrint(printerName: string, filePath: string): Promise<void> {
    if (!this.agentInstance) {
      throw new Error('Agent is not initialized');
    }

    // Initialize if not running
    if (!this.isRunning) {
      await this.start();
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const printerManager = this.agentInstance.getPrinterManager();
    if (!printerManager) {
      throw new Error('Printer manager not available');
    }

    // Check if printer exists
    const printers = printerManager.getPrinters();
    const printer = printers.find((p) => p.printerName === printerName);
    if (!printer && printers.length > 0) {
      // If no specific printer, use first available
      await printerManager.printFile(printers[0].printerName, filePath, {
        copies: 1,
        colorMode: 'color',
        orientation: 'portrait',
      });
    } else if (printer) {
      await printerManager.printFile(printerName, filePath, {
        copies: 1,
        colorMode: 'color',
        orientation: 'portrait',
      });
    } else {
      throw new Error('No printers available');
    }
  }

  /**
   * Print a file
   */
  async printFile(
    printerName: string,
    filePath: string,
    options: {
      copies?: number;
      colorMode?: 'color' | 'grayscale' | 'black-white';
      orientation?: 'portrait' | 'landscape';
      paperSize?: string;
      duplex?: boolean;
    }
  ): Promise<void> {
    if (!this.agentInstance || !this.agentInstance.isRunning) {
      throw new Error('Agent is not running');
    }

    const printerManager = this.agentInstance.getPrinterManager();
    if (!printerManager) {
      throw new Error('Printer manager not available');
    }

    logger.info(`Printing ${filePath} to ${printerName}`);
    await printerManager.printFile(printerName, filePath, options);
  }

  /**
   * Discover printers
   */
  async discoverPrinters(): Promise<IpcPrinterInfo[]> {
    if (!this.agentInstance) {
      throw new Error('Agent is not initialized');
    }

    const printerManager = this.agentInstance.getPrinterManager();
    if (!printerManager) {
      throw new Error('Printer manager not available');
    }

    return await printerManager.discoverPrinters();
  }

  /**
   * Check if agent is running
   */
  isAgentRunning(): boolean {
    return this.isRunning && this.agentInstance !== null;
  }
}

export const agentService = new AgentService();
