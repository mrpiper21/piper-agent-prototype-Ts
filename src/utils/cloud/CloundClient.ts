// ============================================================================
// CLOUD CLIENT - Minimal Local Version (No API Required)
// ============================================================================

import { logger } from '../logger.js';
import { PrinterInfo, PrintJob, AgentStatus } from '../../types/index.js';

export class CloudClient {
  // private cloudUrl: string;
  // private agentId: string;
  // private apiKey: string;
  private localMode: boolean;

  constructor(cloudUrl: string, apiKey: string, agentId: string) {
    // this.cloudUrl = cloudUrl;
    // this.apiKey = apiKey;
    console.log(apiKey, agentId)
    // this.agentId = agentId;
    
    // Check if running in local mode
    this.localMode = process.env['SKIP_CLOUD_CONNECTION'] === 'true';
    
    if (this.localMode) {
      logger.warn('⚠️  Running in LOCAL MODE - No cloud connection');
    } else {
      logger.info(`🌐 Cloud client ready: ${cloudUrl}`);
    }
  }

  /**
   * Register printers with cloud server
   */
  async registerPrinters(printers: PrinterInfo[]): Promise<void> {
    if (this.localMode) {
      logger.info(`📋 [LOCAL] Would register ${printers.length} printer(s) with cloud`);
      printers.forEach((p, i) => {
        logger.debug(`   ${i + 1}. ${p.displayName} → Cloud`);
      });
      return;
    }

    // TODO: Implement actual API call when backend is ready
    logger.warn('⚠️  Cloud API not implemented yet');
  }

  /**
   * Poll cloud server for new jobs
   */
  async getJobs(): Promise<PrintJob[]> {
    if (this.localMode) {
      // Return empty array - no jobs in local mode
      return [];
    }

    // TODO: Implement actual API call when backend is ready
    return [];
  }

  /**
   * Download file from cloud
   */
  async downloadFile(jobId: string, outputPath: string): Promise<void> {
    if (this.localMode) {
      logger.debug(`📥 [LOCAL] Would download job ${jobId} to ${outputPath}`);
      return;
    }

    // TODO: Implement actual download when backend is ready
    throw new Error('Download not implemented yet');
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: 'printing' | 'completed' | 'failed',
    error?: string
  ): Promise<void> {
    if (this.localMode) {
      logger.debug(`📝 [LOCAL] Job ${jobId} status: ${status}${error ? ` (${error})` : ''}`);
      return;
    }

    // TODO: Implement actual API call when backend is ready
    logger.debug(`Job ${jobId} status updated: ${status}`);
  }

  /**
   * Send heartbeat to cloud
   */
  async sendHeartbeat(status: AgentStatus): Promise<void> {
    if (this.localMode) {
      logger.debug(`💓 [LOCAL] Heartbeat: ${status.status}, ${status.printerCount} printer(s), ${status.jobsProcessed} jobs`);
      return;
    }

    // TODO: Implement actual API call when backend is ready
    // Silent fail - heartbeat not critical for local testing
  }

  /**
   * Get printer details
   */
  async getPrinterDetails(_: string): Promise<PrinterInfo[]> {
    if (this.localMode) {
      return [];
    }

    // TODO: Implement actual API call when backend is ready
    return [];
  }

  /**
   * Check for agent updates
   */
  async checkForUpdates(): Promise<{
    hasUpdate: boolean;
    version?: string;
    downloadUrl?: string;
    changelog?: string;
  }> {
    return { hasUpdate: false };
  }

  /**
   * Report system information
   */
  async reportSystemInfo(info: Record<string, unknown>): Promise<void> {
    if (this.localMode) {
      logger.debug('[LOCAL] System info:', info);
    }
  }

  /**
   * Verify agent license
   */
  async verifyLicense(_: string): Promise<boolean> {
    if (this.localMode) {
      logger.debug('[LOCAL] License check skipped');
      return true;
    }
    return true;
  }
}