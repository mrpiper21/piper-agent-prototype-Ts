// ============================================================================
// JOB PROCESSOR - Process print jobs from cloud server
// ============================================================================

import { logger } from '../../utils/logger.js';
import { PrintJob, JobStatus, PrinterError, ValidationError } from '../../types/index.js';
import { CloudClient } from '../../utils/cloud/CloundClient.js';
import { PrinterManager } from '../printer/PrinterManager.js';
import { FileDownloader } from './FileDownloader.js';
import { JobQueue } from './JobQueue.js';
import { StatusReporter } from './StatusReporter.js';
import { validateJobObject, validateFileType } from '../../utils/validator.js';
import { platform } from '../../utils/platform.js';
import fs from 'fs-extra'

export class JobProcessor {
  public cloudClient: CloudClient;
  private printerManager: PrinterManager;
  private fileDownloader: FileDownloader;
  private jobQueue: JobQueue;
  private statusReporter: StatusReporter;
  public config: unknown;

  constructor(
    cloudClient: CloudClient,
    printerManager: PrinterManager,
    config: unknown
  ) {
    this.cloudClient = cloudClient;
    this.printerManager = printerManager;
    this.config = config;
    
    this.fileDownloader = new FileDownloader();
    this.jobQueue = new JobQueue();
    this.statusReporter = new StatusReporter(cloudClient);
  }

  /**
   * Process a print job
   */
  async processJob(job: PrintJob): Promise<void> {
    const startTime = Date.now();

    console.log("Processing job:", job);
    
    try {
      logger.info(`Processing job ${job?.id}: ${job.fileName}`);
      
      // Validate job
      const validation = validateJobObject(job);

      console.log("Validation errors:", validation.errors);
      console.log("Is valid:", validation.valid);
      
      if (!validation.valid) {
        throw new ValidationError(`Invalid job data: ${validation.errors.join(', ')}`);
      }

      // Map printer name to available printer
      const printerName = this.mapPrinterName(job.printerName);
      console.log(`Mapped printer: ${job.printerName} -> ${printerName}`);

      // Check if printer exists
      if (!this.printerManager.hasPrinter(printerName)) {
        const availablePrinters = this.printerManager.getPrinters();
        throw new PrinterError(
          `Printer "${printerName}" not found. Available printers: ${availablePrinters.map(p => p?.displayName).join(', ')}`
        );
      }

      // Check if file type is supported
      if (!validateFileType(job.fileName)) {
        throw new ValidationError(`Unsupported file type: ${job.fileName}`);
      }

      // Update job status to printing (skip downloading since file is local)
      await this.statusReporter.updateJobStatus(job.id as string, 'printing');

      // Print the file directly (no download needed in local mode)
      await this.printJobFile(job, job.filePath as string);
      logger.info(`Print job completed: ${job.id}`);

      // Update job status to completed
      await this.statusReporter.updateJobStatus(job.id as string, 'completed');

      const duration = Date.now() - startTime;
      logger.performance(`Job ${job.id} processed`, duration);

    } catch (error) {
      logger.error(`Job ${job.id} failed:`, error);
      
      // Update job status to failed
      await this.statusReporter.updateJobStatus(
        job.id as string,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  }

  private mapPrinterName(requestedPrinter: string): string {
    const availablePrinters = this.printerManager.getPrinters();
    
    // If "default" is requested, use the first available printer
    if (requestedPrinter === 'default' && availablePrinters.length > 0) {
      return availablePrinters[0].displayName as string;
    }
    
    // Check if the requested printer exists
    const printerExists = availablePrinters.some(printer => 
      printer.displayName === requestedPrinter
    );
    
    if (printerExists) {
      return requestedPrinter;
    }
    
    // If printer doesn't exist but we have available printers, use the first one
    if (availablePrinters.length > 0) {
      console.log(`Printer "${requestedPrinter}" not found, using "${availablePrinters[0].displayName}" instead`);
      return availablePrinters[0]?.displayName as string;
    }
    
    throw new PrinterError('No printers available');
  }

  /**
   * Download job file from cloud
   */
  private async downloadJobFile(job: PrintJob): Promise<string> {
    try {
      const downloadDir = platform.getDownloadsDirectory();
      const fileName = `${job.printJobId}_${job.fileName}`;
      const downloadPath = platform.joinPath(downloadDir, fileName);

      await this.fileDownloader.downloadFile(job?.filePath as string, downloadPath);
      
      return downloadPath;
    } catch (error) {
      logger.error(`Failed to download file for job ${job.printJobId}:`, error);
      throw error;
    }
  }

  /**
   * Print the job file
   */
  private async printJobFile(job: PrintJob, filePath: string): Promise<void> {
    try {
      const printOptions = {
        copies: job.copies || 1,
        colorMode: job.colorMode || 'black-white',
        orientation: job.orientation || 'portrait',
        paperSize: job.paperSize || 'letter',
        duplex: job.duplex || false,
      };

      console.log("printing job --------- ", printOptions)

      await this.printerManager.printFile(job.printerName, filePath, printOptions);
      
    } catch (error) {
      logger.error(`Failed to print file for job ${job.printJobId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up job file
   */
  private async cleanupJobFile(filePath: string): Promise<void> {
    try {
      
      
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        logger.debug(`Cleaned up file: ${filePath}`);
      }
    } catch (error) {
      logger.warn(`Failed to clean up file ${filePath}:`, error);
    }
  }

  /**
   * Add job to queue
   */
  async queueJob(job: PrintJob): Promise<void> {
    try {
      await this.jobQueue.addJob(job);
      logger.info(`Job ${job.printJobId} added to queue`);
    } catch (error) {
      logger.error(`Failed to queue job ${job.printJobId}:`, error);
      throw error;
    }
  }

  /**
   * Process all queued jobs
   */
  async processQueuedJobs(): Promise<void> {
    try {
      const jobs = await this.jobQueue.getPendingJobs();
      
      if (jobs.length === 0) {
        logger.debug('No queued jobs to process');
        return;
      }

      logger.info(`Processing ${jobs.length} queued jobs`);

      for (const queuedJob of jobs) {
        try {
          await this.processJob(queuedJob.job);
          await this.jobQueue.removeJob(queuedJob.job.printJobId);
        } catch (error) {
          logger.error(`Failed to process queued job ${queuedJob.job.printJobId}:`, error);
          
          // Increment retry count
          await this.jobQueue.incrementRetryCount(queuedJob.job.printJobId);
        }
      }
    } catch (error) {
      logger.error('Failed to process queued jobs:', error);
      throw error;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      // Remove from queue if pending
      const removed = await this.jobQueue.removeJob(jobId);
      
      if (removed) {
        await this.statusReporter.updateJobStatus(jobId, 'cancelled');
        logger.info(`Job ${jobId} cancelled`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    try {
      return await this.jobQueue.getJobStatus(jobId);
    } catch (error) {
      logger.error(`Failed to get status for job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Get all job statuses
   */
  async getAllJobStatuses(): Promise<JobStatus[]> {
    try {
      return await this.jobQueue.getAllJobStatuses();
    } catch (error) {
      logger.error('Failed to get all job statuses:', error);
      return [];
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    totalJobs: number;
    pendingJobs: number;
    processingJobs: number;
    completedJobs: number;
    failedJobs: number;
  } {
    return this.jobQueue.getStats();
  }

  /**
   * Clear completed jobs
   */
  async clearCompletedJobs(): Promise<number> {
    try {
      return await this.jobQueue.clearCompletedJobs();
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
      return await this.jobQueue.clearFailedJobs();
    } catch (error) {
      logger.error('Failed to clear failed jobs:', error);
      return 0;
    }
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.jobQueue.getJob(jobId);
      if (!job) {
        logger.warn(`Job ${jobId} not found in queue`);
        return false;
      }

      // Reset retry count and reprocess
      await this.jobQueue.resetRetryCount(jobId);
      await this.processJob(job);
      
      logger.info(`Job ${jobId} retried successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to retry job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Validate job before processing
   */
  validateJob(job: PrintJob): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    const validation = validateJobObject(job);
    if (!validation.valid) {
      errors.push(...validation.errors);
    }

    // Check printer availability
    if (!this.printerManager.hasPrinter(job.printerName)) {
      errors.push(`Printer not found: ${job.printerName}`);
    }

    // Check file type support
    if (!validateFileType(job.fileName)) {
      errors.push(`Unsupported file type: ${job.fileName}`);
    }

    // Check copies range
    if (job.copies < 1 || job.copies > 100) {
      errors.push('Invalid copies count (must be 1-100)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get job processing statistics
   */
  getProcessingStats(): {
    totalProcessed: number;
    successfulJobs: number;
    failedJobs: number;
    averageProcessingTime: number;
  } {
    return this.jobQueue.getProcessingStats();
  }
}
