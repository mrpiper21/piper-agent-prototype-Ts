// ============================================================================
// FILE DOWNLOADER - Download files from cloud server
// ============================================================================

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../../utils/logger.js';
import { FileDownloadOptions, ValidationError } from '../../types/index.js';
import { platform } from '../../utils/platform.js';
import { validateUrl } from '../../utils/validator.js';
import { errorRecovery } from '../../utils/errors.js';

export class FileDownloader {
  private downloadDir: string;
  private maxRetries: number;
  private timeout: number;

  constructor() {
    this.downloadDir = platform.getDownloadsDirectory();
    this.maxRetries = 3;
    this.timeout = 30000; // 30 seconds
    
    this.ensureDownloadDir();
  }

  /**
   * Ensure download directory exists
   */
  private async ensureDownloadDir(): Promise<void> {
    try {
      await fs.ensureDir(this.downloadDir);
      logger.debug(`Download directory ensured: ${this.downloadDir}`);
    } catch (error) {
      logger.error('Failed to create download directory:', error);
      throw error;
    }
  }

  /**
   * Download file from URL
   */
  async downloadFile(url: string, outputPath: string, options: Partial<FileDownloadOptions> = {}): Promise<void> {
    try {
      // Validate URL
      if (!validateUrl(url)) {
        throw new ValidationError(`Invalid URL: ${url}`);
      }

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.ensureDir(outputDir);

      logger.info(`Downloading file from: ${url}`);
      logger.debug(`Output path: ${outputPath}`);

      const downloadOptions: FileDownloadOptions = {
        url,
        outputPath,
        timeout: this.timeout,
        retries: this.maxRetries,
        validateChecksum: false,
        ...options,
      };

      await errorRecovery.withRetry(
        () => this.performDownload(downloadOptions),
        `download-${path.basename(outputPath)}`,
        downloadOptions.retries || this.maxRetries
      );

      logger.info(`File downloaded successfully: ${outputPath}`);
    } catch (error) {
      logger.error(`Failed to download file from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Perform the actual download
   */
  private async performDownload(options: FileDownloadOptions): Promise<void> {
    try {
      const response = await axios({
        method: 'GET',
        url: options.url,
        responseType: 'stream',
        timeout: options.timeout || this.timeout,
        headers: {
          'User-Agent': 'PrintMyFile-Agent/1.0.0',
        },
      });

      // Get file size from Content-Length header
      const contentLength = response.headers['content-length'];
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;

      // Create write stream
      const writer = fs.createWriteStream(options.outputPath);
      
      // Track download progress
      let downloadedSize = 0;
      
      response.data.on('data', (chunk: Buffer) => {
        downloadedSize += chunk.length;
        
        if (totalSize > 0) {
          const progress = (downloadedSize / totalSize) * 100;
          logger.debug(`Download progress: ${progress.toFixed(1)}%`);
        }
      });

      // Pipe response to file
      response.data.pipe(writer);

      // Wait for download to complete
      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', reject);
        response.data.on('error', reject);
      });

      // Validate checksum if provided
      if (options.validateChecksum && options.checksum) {
        await this.validateChecksum(options.outputPath, options.checksum);
      }

      // Verify file exists and has content
      const stats = await fs.stat(options.outputPath);
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty');
      }

    } catch (error) {
      // Clean up partial file
      if (await fs.pathExists(options.outputPath)) {
        await fs.remove(options.outputPath);
      }
      throw error;
    }
  }

  /**
   * Validate file checksum
   */
  private async validateChecksum(filePath: string, expectedChecksum: string): Promise<void> {
    try {
      const crypto = require('crypto');
      const fileBuffer = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(fileBuffer);
      const actualChecksum = hash.digest('hex');

      if (actualChecksum !== expectedChecksum) {
        throw new Error(`Checksum validation failed. Expected: ${expectedChecksum}, Actual: ${actualChecksum}`);
      }

      logger.debug('Checksum validation passed');
    } catch (error) {
      logger.error('Checksum validation failed:', error);
      throw error;
    }
  }

  /**
   * Download file with progress callback
   */
  async downloadFileWithProgress(
    url: string,
    outputPath: string,
    onProgress?: (progress: { bytesDownloaded: number; totalBytes: number; percentage: number }) => void
  ): Promise<void> {
    try {
      if (!validateUrl(url)) {
        throw new ValidationError(`Invalid URL: ${url}`);
      }

      const outputDir = path.dirname(outputPath);
      await fs.ensureDir(outputDir);

      const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
        timeout: this.timeout,
      });

      const contentLength = response.headers['content-length'];
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      const writer = fs.createWriteStream(outputPath);
      let downloadedBytes = 0;

      response.data.on('data', (chunk: Buffer) => {
        downloadedBytes += chunk.length;
        
        if (onProgress && totalBytes > 0) {
          const percentage = (downloadedBytes / totalBytes) * 100;
          onProgress({
            bytesDownloaded: downloadedBytes,
            totalBytes,
            percentage,
          });
        }
      });

      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', reject);
        response.data.on('error', reject);
      });

    } catch (error) {
      logger.error(`Failed to download file with progress:`, error);
      throw error;
    }
  }

  /**
   * Get file size from URL without downloading
   */
  async getFileSize(url: string): Promise<number> {
    try {
      if (!validateUrl(url)) {
        throw new ValidationError(`Invalid URL: ${url}`);
      }

      const response = await axios.head(url, {
        timeout: this.timeout,
      });

      const contentLength = response.headers['content-length'];
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch (error) {
      logger.error(`Failed to get file size for ${url}:`, error);
      return 0;
    }
  }

  /**
   * Check if file exists at URL
   */
  async fileExists(url: string): Promise<boolean> {
    try {
      if (!validateUrl(url)) {
        return false;
      }

      const response = await axios.head(url, {
        timeout: this.timeout,
      });

      return response.status === 200;
    } catch (error) {
      logger.debug(`File does not exist at ${url}:`, error);
      return false;
    }
  }

  /**
   * Clean up old downloaded files
   */
  async cleanupOldFiles(maxAgeHours: number = 24): Promise<number> {
    try {
      const files = await fs.readdir(this.downloadDir);
      let cleanedCount = 0;
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds

      for (const file of files) {
        const filePath = path.join(this.downloadDir, file);
        const stats = await fs.stat(filePath);

        if (stats.isFile() && Date.now() - stats.mtime.getTime() > maxAge) {
          await fs.remove(filePath);
          cleanedCount++;
          logger.debug(`Cleaned up old file: ${file}`);
        }
      }

      logger.info(`Cleaned up ${cleanedCount} old files`);
      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup old files:', error);
      return 0;
    }
  }

  /**
   * Get download directory size
   */
  async getDownloadDirSize(): Promise<number> {
    try {
      const files = await fs.readdir(this.downloadDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(this.downloadDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      logger.error('Failed to get download directory size:', error);
      return 0;
    }
  }

  /**
   * Set download options
   */
  setDownloadOptions(options: {
    maxRetries?: number;
    timeout?: number;
    downloadDir?: string;
  }): void {
    if (options.maxRetries !== undefined) {
      this.maxRetries = options.maxRetries;
    }
    
    if (options.timeout !== undefined) {
      this.timeout = options.timeout;
    }
    
    if (options.downloadDir !== undefined) {
      this.downloadDir = options.downloadDir;
      this.ensureDownloadDir();
    }
  }

  /**
   * Get download statistics
   */
  async getDownloadStats(): Promise<{
    downloadDir: string;
    totalFiles: number;
    totalSize: number;
    oldestFile: Date | null;
    newestFile: Date | null;
  }> {
    try {
      const files = await fs.readdir(this.downloadDir);
      let totalSize = 0;
      let oldestFile: Date | null = null;
      let newestFile: Date | null = null;

      for (const file of files) {
        const filePath = path.join(this.downloadDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          totalSize += stats.size;
          
          if (!oldestFile || stats.mtime < oldestFile) {
            oldestFile = stats.mtime;
          }
          
          if (!newestFile || stats.mtime > newestFile) {
            newestFile = stats.mtime;
          }
        }
      }

      return {
        downloadDir: this.downloadDir,
        totalFiles: files.length,
        totalSize,
        oldestFile,
        newestFile,
      };
    } catch (error) {
      logger.error('Failed to get download statistics:', error);
      return {
        downloadDir: this.downloadDir,
        totalFiles: 0,
        totalSize: 0,
        oldestFile: null,
        newestFile: null,
      };
    }
  }
}
