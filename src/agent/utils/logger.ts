// ============================================================================
// LOGGER - Centralized logging utility
// ============================================================================

import fs from 'fs-extra';
import path from 'path';
import { DEFAULT_CONFIG } from '../types/index.js';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

class Logger {
  private logLevel: LogLevel;
  private logToFile: boolean;
  private logToConsole: boolean;
  private logDir: string;
  private maxLogSize: number;
  private maxLogFiles: number;

  constructor() {
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'info');
    this.logToFile = process.env.LOG_FILE !== 'false';
    this.logToConsole = process.env.LOG_CONSOLE !== 'false';
    this.logDir = process.env.LOG_DIR || './logs';
    this.maxLogSize = DEFAULT_CONFIG.MAX_LOG_SIZE;
    this.maxLogFiles = DEFAULT_CONFIG.MAX_LOG_FILES;

    this.ensureLogDir();
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  private ensureLogDir(): void {
    if (this.logToFile) {
      fs.ensureDirSync(this.logDir);
    }
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      data: data ? JSON.stringify(data) : undefined,
    };

    const formatted = `${timestamp} [${level.toUpperCase()}] ${message}`;
    return this.logToFile ? JSON.stringify(logEntry) : formatted;
  }

  private async writeToFile(message: string): Promise<void> {
    if (!this.logToFile) return;

    const logFile = path.join(this.logDir, 'agent.log');
    
    try {
      await fs.appendFile(logFile, message + '\n');
      await this.rotateLogIfNeeded(logFile);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private async rotateLogIfNeeded(logFile: string): Promise<void> {
    try {
      const stats = await fs.stat(logFile);
      
      if (stats.size > this.maxLogSize) {
        // Rotate logs
        for (let i = this.maxLogFiles - 1; i >= 1; i--) {
          const oldFile = `${logFile}.${i}`;
          const newFile = `${logFile}.${i + 1}`;
          
          if (await fs.pathExists(oldFile)) {
            await fs.move(oldFile, newFile);
          }
        }
        
        // Move current log to .1
        await fs.move(logFile, `${logFile}.1`);
      }
    } catch (error) {
      console.error('Failed to rotate log:', error);
    }
  }

  private log(level: LogLevel, levelName: string, message: string, data?: any): void {
    if (level < this.logLevel) return;

    const formattedMessage = this.formatMessage(levelName, message, data);

    if (this.logToConsole) {
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
        reset: '\x1b[0m'
      };

      const color = colors[levelName as keyof typeof colors] || colors.reset;
      console.log(`${color}${formattedMessage}${colors.reset}`);
    }

    if (this.logToFile) {
      this.writeToFile(formattedMessage).catch(() => {
        // Ignore file write errors to prevent infinite loops
      });
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, 'debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, 'info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, 'warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, 'error', message, data);
  }

  // Convenience methods for structured logging
  jobStarted(jobId: string, printerName: string): void {
    this.info(`Job started: ${jobId} on printer: ${printerName}`);
  }

  jobCompleted(jobId: string, success: boolean): void {
    const status = success ? 'completed successfully' : 'failed';
    this.info(`Job ${status}: ${jobId}`);
  }

  printerDiscovered(printerName: string, status: string): void {
    this.info(`Printer discovered: ${printerName} (${status})`);
  }

  cloudConnected(cloudUrl: string): void {
    this.info(`Connected to cloud: ${cloudUrl}`);
  }

  cloudDisconnected(reason: string): void {
    this.warn(`Disconnected from cloud: ${reason}`);
  }

  securityAlert(reason: string, details?: any): void {
    this.error(`SECURITY ALERT: ${reason}`, details);
  }

  // Performance logging
  performance(operation: string, duration: number, details?: any): void {
    this.debug(`Performance: ${operation} took ${duration}ms`, details);
  }

  // Set log level dynamically
  setLogLevel(level: string): void {
    this.logLevel = this.parseLogLevel(level);
  }

  // Get current log level
  getLogLevel(): string {
    return Object.keys(LogLevel)[this.logLevel].toLowerCase();
  }
}

// Export singleton instance
export const logger = new Logger();
