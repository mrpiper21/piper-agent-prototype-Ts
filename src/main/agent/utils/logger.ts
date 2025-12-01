// ============================================================================
// LOGGER - Using electron-log for proper log file management
// ============================================================================
// electron-log automatically handles finding user-writable directories:
// - Windows: %USERPROFILE%\AppData\Roaming\<app name>\logs\
// - macOS: ~/Library/Logs/<app name>/
// - Linux: ~/.config/<app name>/logs/
// This prevents permission errors when app is installed in Program Files

import log from 'electron-log';

// Configure electron-log for agent logging
// Use a separate log file for agent logs
const isDevelopment = process.env.NODE_ENV === 'development';

// Set log level from environment or default to 'info'
const logLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
log.transports.file.level = logLevel as any;
log.transports.console.level = isDevelopment ? 'debug' : 'info';

// Configure log file settings
log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

// Set a custom log file name for agent logs
// electron-log will automatically use the correct user-writable directory
log.transports.file.fileName = 'agent.log';

// In production, reduce console logging
if (!isDevelopment) {
  log.transports.console.level = 'warn'; // Only show warnings and errors in console
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'info');
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private logInternal(level: LogLevel, levelName: string, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    // Format message with data if provided
    const formattedMessage = data ? `${message} ${JSON.stringify(data)}` : message;

    switch (levelName.toLowerCase()) {
      case 'debug':
        log.debug(formattedMessage);
        break;
      case 'info':
        log.info(formattedMessage);
        break;
      case 'warn':
        log.warn(formattedMessage);
        break;
      case 'error':
        log.error(formattedMessage);
        break;
      default:
        log.info(formattedMessage);
    }
  }

  debug(message: string, data?: any): void {
    this.logInternal(LogLevel.DEBUG, 'debug', message, data);
  }

  info(message: string, data?: any): void {
    this.logInternal(LogLevel.INFO, 'info', message, data);
  }

  warn(message: string, data?: any): void {
    this.logInternal(LogLevel.WARN, 'warn', message, data);
  }

  error(message: string, data?: any): void {
    this.logInternal(LogLevel.ERROR, 'error', message, data);
  }

  // Public log method for compatibility with main logger API
  log(message: string, ...args: any[]): void {
    // If args are provided, treat them as data
    if (args.length > 0) {
      this.info(message, args.length === 1 ? args[0] : args);
    } else {
      this.info(message);
    }
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
    const electronLogLevel = level.toLowerCase() as any;
    log.transports.file.level = electronLogLevel;
    log.transports.console.level = electronLogLevel;
  }

  // Get current log level
  getLogLevel(): string {
    return Object.keys(LogLevel)[this.logLevel].toLowerCase();
  }

  // Get log file path (useful for debugging)
  getLogFilePath(): string {
    return log.transports.file.getFile().path;
  }
}

// Export singleton instance
export const logger = new Logger();
// Also export electron-log for advanced usage
export { log };
