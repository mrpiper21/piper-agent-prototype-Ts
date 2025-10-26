import { app } from 'electron';
import path from 'path';

class Logger {
  private logFile: string;

  constructor() {
    this.logFile = path.join(app.getPath('userData'), 'app.log');
  }

  info(message: string, ...args: any[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
