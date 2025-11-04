import log from 'electron-log';

// Configure electron-log to use proper user-writable directories
// This automatically handles:
// - Windows: %USERPROFILE%\AppData\Roaming\<app name>\logs\main.log
// - macOS: ~/Library/Logs/<app name>/main.log
// - Linux: ~/.config/<app name>/logs/main.log
log.transports.file.level = process.env.LOG_LEVEL === 'debug' ? 'debug' : 'info';
log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

// Set log file size limit and rotation
log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

// In production, only log to file to avoid console spam
// Check if we're in Electron context and if app is packaged
try {
  const { app } = require('electron');
  if (app && app.isPackaged) {
    log.transports.console.level = false;
  }
} catch {
  // Not in Electron context, that's okay - electron-log will still work
  // In non-Electron context, check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    log.transports.console.level = 'warn';
  }
}

// Create a logger interface that matches the existing API
class Logger {
  info(message: string, ...args: any[]): void {
    log.info(message, ...args);
  }

  error(message: string, ...args: any[]): void {
    log.error(message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    log.warn(message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    log.debug(message, ...args);
  }
}

export const logger = new Logger();
// Also export the electron-log instance for advanced usage
export { log };
