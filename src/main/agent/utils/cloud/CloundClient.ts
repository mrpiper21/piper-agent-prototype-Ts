// ============================================================================
// CLOUD CLIENT - Updated with Jobs Endpoint Integration
// ============================================================================

import { logger } from '../logger.js';
import { PrinterInfo, PrintJob, AgentStatus } from '../../types/index.js';

export class CloudClient {
  private localMode: boolean;
  private printApiUrl: string;

  constructor(cloudUrl: string, apiKey: string, agentId: string) {
    console.log(apiKey, agentId);
    
    // Check if running in local mode
    this.printApiUrl = 'https://piper-server-api-production.up.railway.app/api/print';
    this.localMode = process.env['SKIP_CLOUD_CONNECTION'] === 'true';
    // Use environment variable with production default, fallback to localhost for development
    // if (process.env.PRINT_API_URL) {
    //   this.printApiUrl = process.env.PRINT_API_URL;
    // } else {
    //   let baseUrl: string;
    //   if (process.env.API_BASE_URL) {
    //     // Remove /api suffix if present to get base URL
    //     baseUrl = process.env.API_BASE_URL.endsWith('/api') 
    //       ? process.env.API_BASE_URL.slice(0, -4)
    //       : process.env.API_BASE_URL.replace('/api', '');
    //   } else {
    //     baseUrl = process.env.NODE_ENV === 'development' 
    //       ? 'http://localhost:3000' 
    //       : 'https://piper-server-prototype-ts.onrender.com';
    //   }
    //   this.printApiUrl = `${"https://piper-server-prototype-ts.onrender.com"}/api/print`;
    // }
    
    if (this.localMode) {
      logger.warn('⚠️  Running in LOCAL MODE - No cloud connection');
    } else {
      logger.info(`🌐 Cloud client ready: ${cloudUrl}`);
      logger.info(`🖨️  Print API: ${this.printApiUrl}`);
    }
  }

  /**
   * Get pending print jobs from the API
   */
  async getJobs(): Promise<PrintJob[]> {
    if (this.localMode) {
      logger.debug('📋 [LOCAL] Getting print jobs from local API');
      try {
        const response = await fetch(`${this.printApiUrl}/jobs?status=pending&limit=50`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result: any = await response.json();
        
        if (result.success) {
          logger.info(`📋 Found ${result.data.length} pending print job(s)`);
          return this.mapToPrintJobs(result.data);
        } else {
          logger.error('❌ Failed to get print jobs:', result.message);
          return [];
        }
      } catch (error) {
        logger.error('❌ Error fetching print jobs:', error);
        return [];
      }
    }

    // For non-local mode, you can still use the API or implement cloud logic
    try {
      const response:any = await fetch(`${this.printApiUrl}/jobs?status=pending`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return this.mapToPrintJobs(result.data);
        }
      }
      return [];
    } catch (error) {
      logger.error('Error fetching print jobs from API:', error);
      return [];
    }
  }

  /**
   * Map API response to PrintJob format
   */
  private mapToPrintJobs(apiJobs: any[]): PrintJob[] | any {
    return apiJobs.map(job => ({
      id: job._id || job.id,
      fileName: job.fileName,
      filePath: job.filePath,
      originalName: job.originalName,
      printerName: job.printerName || 'default',
      copies: job.copies || 1,
      duplex: job.duplex || false,
      color: job.color || false,
      pageRange: job.pageRange,
      status: job.status,
      submittedBy: job.submittedBy,
      createdAt: job.createdAt,
      // Add any additional fields your PrintJob type expects
    }));
  }

  /**
   * Download file from local storage (file already exists locally)
   */
  async downloadFile(jobId: string, _: string): Promise<void> {
    if (this.localMode) {
      logger.debug(`📥 [LOCAL] Getting file path for job ${jobId}`);
      
      try {
        // Get job details to find the file path
        const response = await fetch(`${this.printApiUrl}/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result: any = await response.json();
        
        if (result.success && result.data) {
          const job = result.data;
          logger.debug(`📄 File located at: ${job.filePath}`);
          
          // In local mode, the file is already on disk, just return the path
          // The printing service will handle the actual file access
          return;
        } else {
          throw new Error('Job not found');
        }
      } catch (error) {
        logger.error(`❌ Error getting file for job ${jobId}:`, error);
        throw error;
      }
    }

    // For non-local mode, implement actual download logic
    throw new Error('Cloud download not implemented yet');
  }

  /**
   * Update job status and delete if completed
   */
  async updateJobStatus(
    jobId: string,
    status: 'printing' | 'completed' | 'failed',
    error?: string
  ): Promise<void> {
    if (this.localMode) {
      logger.debug(`📝 [LOCAL] Updating job ${jobId} status: ${status}${error ? ` (${error})` : ''}`);
      
      try {
        // First update the status
        const updateResponse = await fetch(`${this.printApiUrl}/jobs/${jobId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: status,
            errorMessage: error
          }),
        });

        if (!updateResponse.ok) {
          throw new Error(`HTTP ${updateResponse.status}: ${updateResponse.statusText}`);
        }

        const updateResult: any = await updateResponse.json();
        
        if (!updateResult.success) {
          throw new Error(updateResult.message);
        }

        logger.debug(`✅ Job ${jobId} status updated to: ${status}`);

        // If job is completed or failed, delete it
        if (status === 'completed' || status === 'failed') {
          await this.deleteJob(jobId);
        }

      } catch (error) {
        logger.error(`❌ Error updating job ${jobId} status:`, error);
        throw error;
      }
      return;
    }

    // For non-local mode
    logger.debug(`Job ${jobId} status updated: ${status}`);
  }

  /**
   * Delete a job after printing completion
   */
  private async deleteJob(jobId: string): Promise<void> {
    try {
      const deleteResponse = await fetch(`${this.printApiUrl}/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        throw new Error(`HTTP ${deleteResponse.status}: ${deleteResponse.statusText}`);
      }

      const deleteResult: any = await deleteResponse.json();
      
      if (deleteResult.success) {
        logger.info(`🗑️  Job ${jobId} deleted successfully`);
      } else {
        logger.warn(`⚠️  Failed to delete job ${jobId}: ${deleteResult.message}`);
      }
    } catch (error) {
      logger.error(`❌ Error deleting job ${jobId}:`, error);
    }
  }

  /**
   * Clean up completed and failed jobs (optional maintenance method)
   */
  async cleanupOldJobs(): Promise<void> {
    if (this.localMode) {
      logger.debug('🧹 [LOCAL] Cleaning up old completed/failed jobs');
      
      try {
        // Get completed and failed jobs
        const response = await fetch(`${this.printApiUrl}/jobs?status=completed,failed&limit=100`);
        if (!response.ok) return;

        const result: any = await response.json();
        
        if (result.success && result.data.length > 0) {
          logger.info(`🧹 Found ${result.data.length} completed/failed jobs to clean up`);
          
          // Delete each job
          for (const job of result.data) {
            await this.deleteJob(job._id || job.id);
          }
        }
      } catch (error) {
        logger.error('Error cleaning up old jobs:', error);
      }
    }
  }

  // ============================================================================
  // EXISTING METHODS (minimal changes)
  // ============================================================================

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