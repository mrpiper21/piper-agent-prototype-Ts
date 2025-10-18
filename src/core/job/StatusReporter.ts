// ============================================================================
// STATUS REPORTER - Report job status to cloud server
// ============================================================================

import { logger } from '../../utils/logger.js';
import { JobStatus } from '../../types/index.js';
import { CloudClient } from '../../utils/cloud/CloundClient.js';
import { errorRecovery } from '../../utils/errors.js';

export class StatusReporter {
  private cloudClient: CloudClient;
  private statusCache: Map<string, JobStatus> = new Map();
  private lastReportTime: Map<string, Date> = new Map();

  constructor(cloudClient: CloudClient) {
    this.cloudClient = cloudClient;
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: 'pending' | 'downloading' | 'printing' | 'completed' | 'failed' | 'cancelled',
    error?: string
  ): Promise<void> {
    try {
      const jobStatus: JobStatus = {
        jobId,
        status,
        error,
        startedAt: this.getJobStartTime(jobId),
        completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined,
        printedAt: status === 'completed' ? new Date().toISOString() : undefined,
      };

      // Cache the status
      this.statusCache.set(jobId, jobStatus);

      // Report to cloud server
      await this.reportToCloud(jobId, status, error);

      // Update last report time
      this.lastReportTime.set(jobId, new Date());

      logger.debug(`Job ${jobId} status updated to ${status}`);
    } catch (error) {
      logger.error(`Failed to update job status for ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Report status to cloud server
   */
  private async reportToCloud(
    jobId: string,
    status: string,
    error?: string
  ): Promise<void> {
    try {
      await errorRecovery.withRetry(
        () => this.cloudClient.updateJobStatus(jobId, status as 'printing' | 'completed' | 'failed', error),
        `report-status-${jobId}`,
        2
      );
    } catch (error) {
      logger.error(`Failed to report job status to cloud for ${jobId}:`, error);
      // Don't throw - status reporting failures shouldn't stop job processing
    }
  }

  /**
   * Get job start time
   */
  private getJobStartTime(jobId: string): string | undefined {
    const cachedStatus = this.statusCache.get(jobId);
    return cachedStatus?.startedAt || new Date().toISOString();
  }

  /**
   * Update job progress
   */
  async updateJobProgress(jobId: string, progress: number): Promise<void> {
    try {
      const jobStatus = this.statusCache.get(jobId);
      if (jobStatus) {
        jobStatus.progress = Math.min(100, Math.max(0, progress));
        
        // Only report progress updates every 10%
        const lastReport = this.lastReportTime.get(jobId);
        const shouldReport = !lastReport || 
          (progress % 10 === 0 && Date.now() - lastReport.getTime() > 5000);

        if (shouldReport) {
          await this.reportToCloud(jobId, jobStatus.status, jobStatus.error);
          this.lastReportTime.set(jobId, new Date());
        }
      }
    } catch (error) {
      logger.error(`Failed to update job progress for ${jobId}:`, error);
    }
  }

  /**
   * Get job status from cache
   */
  getJobStatus(jobId: string): JobStatus | null {
    return this.statusCache.get(jobId) || null;
  }

  /**
   * Get all cached job statuses
   */
  getAllJobStatuses(): JobStatus[] {
    return Array.from(this.statusCache.values());
  }

  /**
   * Clear old status cache entries
   */
  async clearOldStatuses(maxAgeHours: number = 24): Promise<number> {
    try {
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
      let clearedCount = 0;

      for (const [jobId, status] of this.statusCache) {
        console.log(status)
        const lastReport = this.lastReportTime.get(jobId);
        if (lastReport && Date.now() - lastReport.getTime() > maxAge) {
          this.statusCache.delete(jobId);
          this.lastReportTime.delete(jobId);
          clearedCount++;
        }
      }

      if (clearedCount > 0) {
        logger.info(`Cleared ${clearedCount} old job statuses from cache`);
      }

      return clearedCount;
    } catch (error) {
      logger.error('Failed to clear old job statuses:', error);
      return 0;
    }
  }

  /**
   * Batch report multiple job statuses
   */
  async batchReportStatuses(statuses: JobStatus[]): Promise<void> {
    try {
      const promises = statuses.map(status => 
        this.reportToCloud(status.jobId, status.status, status.error)
      );

      await Promise.allSettled(promises);
      logger.debug(`Batch reported ${statuses.length} job statuses`);
    } catch (error) {
      logger.error('Failed to batch report job statuses:', error);
    }
  }

  /**
   * Get status reporting statistics
   */
  getStatusStats(): {
    totalCachedStatuses: number;
    lastReportTimes: Record<string, string>;
    oldestCachedStatus: string | null;
    newestCachedStatus: string | null;
  } {
    const lastReportTimes: Record<string, string> = {};
    let oldestCachedStatus: string | null = null;
    let newestCachedStatus: string | null = null;

    for (const [jobId, reportTime] of this.lastReportTime) {
      lastReportTimes[jobId] = reportTime.toISOString();

      if (!oldestCachedStatus || reportTime < new Date(oldestCachedStatus)) {
        oldestCachedStatus = reportTime.toISOString();
      }

      if (!newestCachedStatus || reportTime > new Date(newestCachedStatus)) {
        newestCachedStatus = reportTime.toISOString();
      }
    }

    return {
      totalCachedStatuses: this.statusCache.size,
      lastReportTimes,
      oldestCachedStatus,
      newestCachedStatus,
    };
  }

  /**
   * Force report all cached statuses
   */
  async forceReportAllStatuses(): Promise<void> {
    try {
      const statuses = Array.from(this.statusCache.values());
      await this.batchReportStatuses(statuses);
      
      logger.info(`Force reported ${statuses.length} cached job statuses`);
    } catch (error) {
      logger.error('Failed to force report all statuses:', error);
    }
  }

  /**
   * Report job completion with details
   */
  async reportJobCompletion(
    jobId: string,
    success: boolean,
    details?: {
      pagesPrinted?: number;
      printTime?: number;
      error?: string;
    }
  ): Promise<void> {
    try {
      const status = success ? 'completed' : 'failed';
      const error = details?.error;

      await this.updateJobStatus(jobId, status, error);

      if (details) {
        // Log additional details
        if (success) {
          logger.info(`Job ${jobId} completed successfully`, {
            pagesPrinted: details.pagesPrinted,
            printTime: details.printTime,
          });
        } else {
          logger.error(`Job ${jobId} failed`, {
            error: details.error,
            printTime: details.printTime,
          });
        }
      }
    } catch (error) {
      logger.error(`Failed to report job completion for ${jobId}:`, error);
    }
  }

  /**
   * Clear status cache
   */
  clearStatusCache(): void {
    this.statusCache.clear();
    this.lastReportTime.clear();
    logger.info('Status cache cleared');
  }

  /**
   * Get status cache size
   */
  getCacheSize(): number {
    return this.statusCache.size;
  }

  /**
   * Check if job status needs reporting
   */
  needsReporting(jobId: string): boolean {
    const lastReport = this.lastReportTime.get(jobId);
    if (!lastReport) return true;

    // Report if last report was more than 30 seconds ago
    return Date.now() - lastReport.getTime() > 30000;
  }
}
