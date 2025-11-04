// ============================================================================
// PLATFORM UTILITIES - Cross-platform compatibility
// ============================================================================

import os from 'os';
import path from 'path';
import { PlatformInfo, SUPPORTED_PLATFORMS } from '../types/index.js';
import {exec} from 'child_process';

// Try to import Electron app module if available (only works in main process)
// Using Function constructor to dynamically require electron while avoiding linting errors
let electronAppModule: typeof import('electron') | null = null;
try {
  // Check if we're in an Electron environment before attempting import
  if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
    // Use Function constructor to dynamically require electron
    // This avoids the "require statement not part of import" linting error
    // while still allowing conditional import of optional dependency
    const requireFunc = new Function('module', 'return require(module)');
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    electronAppModule = requireFunc('electron');
  }
} catch {
  // Electron not available, that's okay
}

// This function safely gets the Electron app instance
function getElectronApp(): typeof import('electron').app | null {
  if (electronAppModule && electronAppModule.app) {
    return electronAppModule.app;
  }
  return null;
}

export class PlatformUtils {
  private static instance: PlatformUtils;
  private platformInfo: PlatformInfo;

  private constructor() {
    this.platformInfo = this.detectPlatform();
  }

  static getInstance(): PlatformUtils {
    if (!PlatformUtils.instance) {
      PlatformUtils.instance = new PlatformUtils();
    }
    return PlatformUtils.instance;
  }

  private detectPlatform(): PlatformInfo {
    const platform = os.platform();
    const version = os.release();
    const arch = os.arch();

    return {
      name: platform,
      version,
      arch,
      isSupported: SUPPORTED_PLATFORMS.includes(platform as any),
    };
  }

  getPlatformInfo(): PlatformInfo {
    return { ...this.platformInfo };
  }

  isWindows(): boolean {
    return this.platformInfo.name === 'win32';
  }

  isMacOS(): boolean {
    return this.platformInfo.name === 'darwin';
  }

  isLinux(): boolean {
    return this.platformInfo.name === 'linux';
  }

  isSupported(): boolean {
    return this.platformInfo.isSupported;
  }

  getExecutableExtension(): string {
    return this.isWindows() ? '.exe' : '';
  }

  getScriptExtension(): string {
    return this.isWindows() ? '.bat' : '.sh';
  }

  getPathSeparator(): string {
    return path.sep;
  }

  getHomeDirectory(): string {
    return os.homedir();
  }

  getTempDirectory(): string {
    return os.tmpdir();
  }

  getApplicationDataDirectory(): string {
    // If running in Electron, use app.getPath('userData') which is the recommended way
    // This ensures we use proper writable directories that don't require admin permissions
    const electronApp = getElectronApp();
    if (electronApp && typeof electronApp.getPath === 'function') {
      try {
        // Electron's userData path is already platform-specific and writable
        // e.g., Windows: C:\Users\<user>\AppData\Roaming\<appName>
        //       macOS: ~/Library/Application Support/<appName>
        //       Linux: ~/.config/<appName>
        const userDataPath = electronApp.getPath('userData');
        if (userDataPath && userDataPath.length > 0) {
          return userDataPath;
        }
      } catch (error) {
        // If app.getPath fails, fall through to manual construction
        console.warn('Failed to get Electron userData path, using fallback:', error);
      }
    }
    
    // Fallback to manual path construction when not in Electron or if app.getPath fails
    if (this.isWindows()) {
      return path.join(os.homedir(), 'AppData', 'Local', 'PrintMyFile');
    } else if (this.isMacOS()) {
      return path.join(os.homedir(), 'Library', 'Application Support', 'PrintMyFile');
    } else {
      return path.join(os.homedir(), '.config', 'printmyfile');
    }
  }

  getLogsDirectory(): string {
    return path.join(this.getApplicationDataDirectory(), 'logs');
  }

  getConfigDirectory(): string {
    return path.join(this.getApplicationDataDirectory(), 'config');
  }

  getDownloadsDirectory(): string {
    return path.join(this.getApplicationDataDirectory(), 'downloads');
  }

  getSystemInfo() {
    return {
      platform: this.platformInfo.name,
      arch: this.platformInfo.arch,
      version: this.platformInfo.version,
      hostname: os.hostname(),
      nodeVersion: process.version,
      uptime: os.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      cpus: os.cpus().length,
      networkInterfaces: this.getNetworkInterfaces(),
    };
  }

  private getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const result: any = {};

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (addrs) {
        result[name] = addrs.map(addr => ({
          address: addr.address,
          family: addr.family,
          internal: addr.internal,
          mac: addr.mac,
        }));
      }
    }

    return result;
  }

  // File path utilities
  normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }

  joinPath(...paths: string[]): string {
    return path.join(...paths);
  }

  resolvePath(...paths: string[]): string {
    return path.resolve(...paths);
  }

  getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
  }

  getFileName(filePath: string): string {
    return path.basename(filePath);
  }

  getDirectoryName(filePath: string): string {
    return path.dirname(filePath);
  }

  // Environment-specific commands
  getPrintCommand(): string {
    if (this.isWindows()) {
      return 'notepad /p';
    } else if (this.isMacOS()) {
      return 'lp';
    } else {
      return 'lpr';
    }
  }

  getListPrintersCommand(): string {
    if (this.isWindows()) {
      return 'wmic printer get name,status';
    } else if (this.isMacOS()) {
      return 'lpstat -p';
    } else {
      return 'lpstat -p';
    }
  }

  getDefaultPrinterCommand(): string {
    if (this.isWindows()) {
      return 'wmic printer where "Default=True" get name';
    } else if (this.isMacOS()) {
      return 'lpstat -d';
    } else {
      return 'lpstat -d';
    }
  }

  // Service management commands
  getServiceInstallCommand(serviceName: string, executablePath: string): string {
    if (this.isWindows()) {
      return `sc create "${serviceName}" binPath= "${executablePath}" start= auto`;
    } else if (this.isMacOS()) {
      return `sudo launchctl load -w /Library/LaunchDaemons/${serviceName}.plist`;
    } else {
      return `sudo systemctl enable ${serviceName}`;
    }
  }

  getServiceStartCommand(serviceName: string): string {
    if (this.isWindows()) {
      return `sc start "${serviceName}"`;
    } else if (this.isMacOS()) {
      return `sudo launchctl start ${serviceName}`;
    } else {
      return `sudo systemctl start ${serviceName}`;
    }
  }

  getServiceStopCommand(serviceName: string): string {
    if (this.isWindows()) {
      return `sc stop "${serviceName}"`;
    } else if (this.isMacOS()) {
      return `sudo launchctl stop ${serviceName}`;
    } else {
      return `sudo systemctl stop ${serviceName}`;
    }
  }

  getServiceRemoveCommand(serviceName: string): string {
    if (this.isWindows()) {
      return `sc delete "${serviceName}"`;
    } else if (this.isMacOS()) {
      return `sudo launchctl unload -w /Library/LaunchDaemons/${serviceName}.plist`;
    } else {
      return `sudo systemctl disable ${serviceName}`;
    }
  }

  // Permission utilities
  hasAdminRights(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isWindows()) {
        // Check if running as administrator on Windows
        exec('net session', (error: any) => {
          resolve(!error);
        });
      } else {
        // Check if running as root on Unix-like systems
        resolve(process.getuid ? process.getuid() === 0 : false);
      }
    });
  }

  // Shell utilities
  getShellCommand(): string {
    if (this.isWindows()) {
      return process.env.COMSPEC || 'cmd.exe';
    } else {
      return process.env.SHELL || '/bin/bash';
    }
  }

  getShellArgs(): string[] {
    if (this.isWindows()) {
      return ['/c'];
    } else {
      return ['-c'];
    }
  }

  // Network utilities
  getLocalIPAddresses(): string[] {
    const interfaces = os.networkInterfaces();
    const addresses: string[] = [];

    for (const [, addrs] of Object.entries(interfaces)) {
      if (addrs) {
        for (const addr of addrs) {
          if (!addr.internal && addr.family === 'IPv4') {
            addresses.push(addr.address);
          }
        }
      }
    }

    return addresses;
  }

  getPrimaryIPAddress(): string | null {
    const addresses = this.getLocalIPAddresses();
    return addresses.length > 0 ? addresses[0] : null;
  }
}

// Export singleton instance
export const platform = PlatformUtils.getInstance();
