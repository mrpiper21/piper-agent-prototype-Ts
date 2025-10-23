// ============================================================================
// POLLING MODULE - Cloud server polling logic
// ============================================================================

import { logger } from '../../utils/logger.js';
import { CloudClient } from '../../utils/cloud/CloundClient.js';
import { JobProcessor } from '../job/JobProcessor.js';
import { errorRecovery } from '../../utils/errors.js';

export class PollingService {
  private cloudClient: CloudClient;
  private jobProcessor: JobProcessor;
  private pollInterval: number;
  private isPolling: boolean = false;
  private pollingTimer: NodeJS.Timeout | null = null;
  private lastPollTime: Date | null = null;
  private consecutiveFailures: number = 0;
  private maxConsecutiveFailures: number = 5;

  constructor(cloudClient: CloudClient, jobProcessor: JobProcessor, pollInterval: number = 5000) {
    this.cloudClient = cloudClient;
    this.jobProcessor = jobProcessor;
    this.pollInterval = pollInterval;
  }

  /**
   * Start polling for jobs
   */
  start(): void {
    if (this.isPolling) {
      logger.warn('Polling service is already running');
      return;
    }

    this.isPolling = true;
    logger.info(`Starting polling service with ${this.pollInterval}ms interval`);
    
    this.scheduleNextPoll();
  }

  /**
   * Stop polling
   */
  stop(): void {
    if (!this.isPolling) {
      return;
    }

    this.isPolling = false;
    
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }

    logger.info('Polling service stopped');
  }

  /**
   * Schedule the next poll
   */
  private scheduleNextPoll(): void {
    if (!this.isPolling) {
      return;
    }

    this.pollingTimer = setTimeout(() => {
      this.pollForJobs().finally(() => {
        if (this.isPolling) {
          this.scheduleNextPoll();
        }
      });
    }, this.pollInterval);
  }

  /**
   * Poll cloud server for new jobs
   */
  private async pollForJobs(): Promise<void> {
    try {
      const jobs = await errorRecovery.withRetry(
        () => this.cloudClient.getJobs(),
        'poll-for-jobs',
        3
      );

      this.lastPollTime = new Date();
      this.consecutiveFailures = 0;

      if (jobs && jobs.length > 0) {
        logger.info(`Found ${jobs.length} job(s) to process`);
        
        for (const job of jobs) {
          try {
            await this.jobProcessor.processJob(job);
          } catch (error) {
            logger.error(`Failed to process job ${job.printJobId}:`, error);
          }
        }
      }
    } catch (error) {
      this.consecutiveFailures++;
      logger.error(`Polling failed (attempt ${this.consecutiveFailures}):`, error);

      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        logger.error(`Max consecutive polling failures (${this.maxConsecutiveFailures}) reached`);
        this.handlePollingFailure();
      }
    }
  }

  /**
   * Handle persistent polling failures
   */
  private handlePollingFailure(): void {
    logger.error('Polling service is experiencing persistent failures');
    
    // Increase poll interval to reduce load
    this.pollInterval = Math.min(this.pollInterval * 2, 60000); // Max 1 minute
    logger.info(`Increased poll interval to ${this.pollInterval}ms`);
    
    // Reset failure count after handling
    this.consecutiveFailures = 0;
  }

  /**
   * Get polling status
   */
  getStatus() {
    return {
      isPolling: this.isPolling,
      pollInterval: this.pollInterval,
      lastPollTime: this.lastPollTime,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  /**
   * Update poll interval
   */
  setPollInterval(interval: number): void {
    if (interval < 1000) {
      throw new Error('Poll interval must be at least 1000ms');
    }

    this.pollInterval = interval;
    logger.info(`Poll interval updated to ${interval}ms`);
  }

  /**
   * Force immediate poll
   */
  async forcePoll(): Promise<void> {
    logger.info('Forcing immediate poll...');
    await this.pollForJobs();
  }

  /**
   * Reset failure count
   */
  resetFailures(): void {
    this.consecutiveFailures = 0;
    logger.debug('Polling failure count reset');
  }
}
