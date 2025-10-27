// ============================================================================
// JOB QUEUE - Manage print job queue
// ============================================================================

import fs from 'fs-extra';
import path from 'path';
import { logger } from '../../utils/logger.js';
import { PrintJob, JobStatus, JobQueueItem } from '../../types/index.js';
import { platform } from '../../utils/platform.js';

export class JobQueue {
  private queueDir: string;
  private queueFile: string;
  private jobs: Map<string, JobQueueItem> = new Map();
  private processingJobs: Set<string> = new Set();
  private completedJobs: Map<string, JobStatus> = new Map();
  private failedJobs: Map<string, JobStatus> = new Map();

  constructor() {
    this.queueDir = platform.joinPath(platform.getApplicationDataDirectory(), 'queue');
    this.queueFile = path.join(this.queueDir, 'jobs.json');
    
    this.ensureQueueDir();
    this.loadQueue();
  }

  /**
   * Ensure queue directory exists
   */
  private async ensureQueueDir(): Promise<void> {
    try {
      await fs.ensureDir(this.queueDir);
      logger.debug(`Queue directory ensured: ${this.queueDir}`);
    } catch (error) {
      logger.error('Failed to create queue directory:', error);
      throw error;
    }
  }

  /**
   * Load queue from disk
   */
  private async loadQueue(): Promise<void> {
    try {
      if (await fs.pathExists(this.queueFile)) {
        const data = await fs.readJson(this.queueFile);
        
        if (data.jobs) {
          for (const [jobId, jobData] of Object.entries(data.jobs)) {
            this.jobs.set(jobId, jobData as JobQueueItem);
          }
        }
        
        if (data.processingJobs) {
          this.processingJobs = new Set(data.processingJobs);
        }
        
        if (data.completedJobs) {
          for (const [jobId, status] of Object.entries(data.completedJobs)) {
            this.completedJobs.set(jobId, status as JobStatus);
          }
        }
        
        if (data.failedJobs) {
          for (const [jobId, status] of Object.entries(data.failedJobs)) {
            this.failedJobs.set(jobId, status as JobStatus);
          }
        }
        
        logger.debug(`Loaded ${this.jobs.size} jobs from queue`);
      }
    } catch (error) {
      logger.error('Failed to load queue:', error);
    }
  }

  /**
   * Save queue to disk
   */
  private async saveQueue(): Promise<void> {
    try {
      const data = {
        jobs: Object.fromEntries(this.jobs),
        processingJobs: Array.from(this.processingJobs),
        completedJobs: Object.fromEntries(this.completedJobs),
        failedJobs: Object.fromEntries(this.failedJobs),
        lastUpdated: new Date().toISOString(),
      };
      
      await fs.writeJson(this.queueFile, data, { spaces: 2 });
    } catch (error) {
      logger.error('Failed to save queue:', error);
    }
  }

  /**
   * Add job to queue
   */
  async addJob(job: PrintJob, priority: number = 1): Promise<void> {
    try {
      const queueItem: JobQueueItem = {
        job,
        priority,
        addedAt: new Date(),
        retries: 0,
        maxRetries: 3,
      };

      this.jobs.set(job.printJobId, queueItem);
      await this.saveQueue();
      
      logger.debug(`Job ${job.printJobId} added to queue with priority ${priority}`);
    } catch (error) {
      logger.error(`Failed to add job ${job.printJobId} to queue:`, error);
      throw error;
    }
  }

  /**
   * Get pending jobs sorted by priority
   */
  async getPendingJobs(): Promise<JobQueueItem[]> {
    const pendingJobs = Array.from(this.jobs.values())
      .filter(item => !this.processingJobs.has(item.job.printJobId))
      .sort((a, b) => b.priority - a.priority || a.addedAt.getTime() - b.addedAt.getTime());
    
    return pendingJobs;
  }

  /**
   * Get job from queue
   */
  async getJob(jobId: string): Promise<PrintJob | null> {
    const queueItem = this.jobs.get(jobId);
    return queueItem ? queueItem.job : null;
  }

  /**
   * Remove job from queue
   */
  async removeJob(jobId: string): Promise<boolean> {
    try {
      const removed = this.jobs.delete(jobId);
      this.processingJobs.delete(jobId);
      
      if (removed) {
        await this.saveQueue();
        logger.debug(`Job ${jobId} removed from queue`);
      }
      
      return removed;
    } catch (error) {
      logger.error(`Failed to remove job ${jobId} from queue:`, error);
      return false;
    }
  }

  /**
   * Mark job as processing
   */
  async markJobAsProcessing(jobId: string): Promise<void> {
    try {
      this.processingJobs.add(jobId);
      await this.saveQueue();
      
      logger.debug(`Job ${jobId} marked as processing`);
    } catch (error) {
      logger.error(`Failed to mark job ${jobId} as processing:`, error);
    }
  }

  /**
   * Mark job as completed
   */
  async markJobAsCompleted(jobId: string, status: JobStatus): Promise<void> {
    try {
      this.jobs.delete(jobId);
      this.processingJobs.delete(jobId);
      this.completedJobs.set(jobId, status);
      await this.saveQueue();
      
      logger.debug(`Job ${jobId} marked as completed`);
    } catch (error) {
      logger.error(`Failed to mark job ${jobId} as completed:`, error);
    }
  }

  /**
   * Mark job as failed
   */
  async markJobAsFailed(jobId: string, status: JobStatus): Promise<void> {
    try {
      this.processingJobs.delete(jobId);
      this.failedJobs.set(jobId, status);
      await this.saveQueue();
      
      logger.debug(`Job ${jobId} marked as failed`);
    } catch (error) {
      logger.error(`Failed to mark job ${jobId} as failed:`, error);
    }
  }

  /**
   * Increment retry count for job
   */
  async incrementRetryCount(jobId: string): Promise<void> {
    try {
      const queueItem = this.jobs.get(jobId);
      if (queueItem) {
        queueItem.retries++;
        
        // Remove job if max retries exceeded
        if (queueItem.retries >= queueItem.maxRetries) {
          await this.markJobAsFailed(jobId, {
            jobId,
            status: 'failed',
            error: 'Max retries exceeded',
            startedAt: queueItem.addedAt.toISOString(),
            completedAt: new Date().toISOString(),
          });
        } else {
          await this.saveQueue();
        }
      }
    } catch (error) {
      logger.error(`Failed to increment retry count for job ${jobId}:`, error);
    }
  }

  /**
   * Reset retry count for job
   */
  async resetRetryCount(jobId: string): Promise<void> {
    try {
      const queueItem = this.jobs.get(jobId);
      if (queueItem) {
        queueItem.retries = 0;
        await this.saveQueue();
      }
    } catch (error) {
      logger.error(`Failed to reset retry count for job ${jobId}:`, error);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    // Check if job is in queue
    const queueItem = this.jobs.get(jobId);
    if (queueItem) {
      return {
        jobId,
        status: this.processingJobs.has(jobId) ? 'printing' : 'pending',
        startedAt: queueItem.addedAt.toISOString(),
      };
    }

    // Check completed jobs
    if (this.completedJobs.has(jobId)) {
      return this.completedJobs.get(jobId)!;
    }

    // Check failed jobs
    if (this.failedJobs.has(jobId)) {
      return this.failedJobs.get(jobId)!;
    }

    return null;
  }

  /**
   * Get all job statuses
   */
  async getAllJobStatuses(): Promise<JobStatus[]> {
    const statuses: JobStatus[] = [];

    // Add pending jobs
    for (const [jobId, queueItem] of this.jobs) {
      statuses.push({
        jobId,
        status: this.processingJobs.has(jobId) ? 'printing' : 'pending',
        startedAt: queueItem.addedAt.toISOString(),
      });
    }

    // Add completed jobs
    statuses.push(...Array.from(this.completedJobs.values()));

    // Add failed jobs
    statuses.push(...Array.from(this.failedJobs.values()));

    return statuses;
  }

  /**
   * Clear completed jobs
   */
  async clearCompletedJobs(): Promise<number> {
    try {
      const count = this.completedJobs.size;
      this.completedJobs.clear();
      await this.saveQueue();
      
      logger.info(`Cleared ${count} completed jobs`);
      return count;
    } catch (error) {
      logger.error('Failed to clear completed jobs:', error);
      return 0;
    }
  }

  /**
   * Clear failed jobs
   */
  async clearFailedJobs(): Promise<number> {
    try {
      const count = this.failedJobs.size;
      this.failedJobs.clear();
      await this.saveQueue();
      
      logger.info(`Cleared ${count} failed jobs`);
      return count;
    } catch (error) {
      logger.error('Failed to clear failed jobs:', error);
      return 0;
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    totalJobs: number;
    pendingJobs: number;
    processingJobs: number;
    completedJobs: number;
    failedJobs: number;
  } {
    return {
      totalJobs: this.jobs.size + this.completedJobs.size + this.failedJobs.size,
      pendingJobs: this.jobs.size - this.processingJobs.size,
      processingJobs: this.processingJobs.size,
      completedJobs: this.completedJobs.size,
      failedJobs: this.failedJobs.size,
    };
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    totalProcessed: number;
    successfulJobs: number;
    failedJobs: number;
    averageProcessingTime: number;
  } {
    const successfulJobs = this.completedJobs.size;
    const failedJobs = this.failedJobs.size;
    const totalProcessed = successfulJobs + failedJobs;

    // Calculate average processing time (simplified)
    let totalProcessingTime = 0;
    let processedJobs = 0;

    for (const status of this.completedJobs.values()) {
      if (status.startedAt && status.completedAt) {
        const start = new Date(status.startedAt);
        const end = new Date(status.completedAt);
        totalProcessingTime += end.getTime() - start.getTime();
        processedJobs++;
      }
    }

    const averageProcessingTime = processedJobs > 0 ? totalProcessingTime / processedJobs : 0;

    return {
      totalProcessed,
      successfulJobs,
      failedJobs,
      averageProcessingTime,
    };
  }

  /**
   * Clean up old jobs
   */
  async cleanupOldJobs(maxAgeHours: number = 24): Promise<number> {
    try {
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
      let cleanedCount = 0;

      // Clean up old completed jobs
      for (const [jobId, status] of this.completedJobs) {
        if (status.completedAt) {
          const completedAt = new Date(status.completedAt);
          if (Date.now() - completedAt.getTime() > maxAge) {
            this.completedJobs.delete(jobId);
            cleanedCount++;
          }
        }
      }

      // Clean up old failed jobs
      for (const [jobId, status] of this.failedJobs) {
        if (status.completedAt) {
          const completedAt = new Date(status.completedAt);
          if (Date.now() - completedAt.getTime() > maxAge) {
            this.failedJobs.delete(jobId);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        await this.saveQueue();
        logger.info(`Cleaned up ${cleanedCount} old jobs`);
      }

      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup old jobs:', error);
      return 0;
    }
  }
}
