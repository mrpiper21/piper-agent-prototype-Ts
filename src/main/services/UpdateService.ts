import { autoUpdater } from 'electron-updater';
import { app, dialog } from 'electron';
import { logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';

export class UpdateService {
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private githubToken: string | null = null;

  constructor() {
    // Load environment variables from .env file if it exists
    this.loadEnvFile();
    
    // Get GitHub token from environment
    this.githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || null;
    
    // Configure auto-updater
    autoUpdater.autoDownload = false; // Don't auto-download, let user decide
    autoUpdater.autoInstallOnAppQuit = true; // Install when app quits
    autoUpdater.allowPrerelease = false; // Only stable releases
    
    // Set GitHub token if available (required for private repos)
    if (this.githubToken) {
      // Set token for authentication with private repos
      autoUpdater.requestHeaders = {
        Authorization: `token ${this.githubToken}`,
      };
      logger.info('GitHub Personal Access Token configured for private repository updates');
    } else {
      logger.warn('No GITHUB_PERSONAL_ACCESS_TOKEN found. Auto-updates may not work with private repositories.');
    }
    
    // Set update server - GitHub Releases
    // Get repo info from package.json build.publish config or environment variables
    const repoOwner = process.env.GITHUB_REPO_OWNER || 'mrpiper21';
    const repoName = process.env.GITHUB_REPO_NAME || 'piper-agent-prototype-Ts';
    const isPrivate = this.githubToken !== null; // Private if token is provided
    
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: repoOwner,
      repo: repoName,
      private: isPrivate,
    });
    
    logger.info(`Configured auto-updater for: ${repoOwner}/${repoName} (${isPrivate ? 'private' : 'public'})`);

    // Event handlers
    this.setupEventHandlers();
  }

  /**
   * Load environment variables from .env file
   */
  private loadEnvFile(): void {
    try {
      // Try to load dotenv if available
      try {
        const dotenv = require('dotenv');
        const envPath = path.join(app.getAppPath(), '.env');
        const envPathRoot = path.join(process.cwd(), '.env');
        
        // Try app path first (for packaged apps), then cwd
        if (fs.existsSync(envPath)) {
          dotenv.config({ path: envPath });
          logger.info(`Loaded .env from: ${envPath}`);
        } else if (fs.existsSync(envPathRoot)) {
          dotenv.config({ path: envPathRoot });
          logger.info(`Loaded .env from: ${envPathRoot}`);
        } else {
          // Try default .env location
          dotenv.config();
          logger.debug('Attempted to load .env from default location');
        }
      } catch (error) {
        // dotenv might not be available, try reading .env manually
        this.loadEnvManually();
      }
    } catch (error) {
      logger.warn('Could not load .env file:', error);
    }
  }

  /**
   * Manually parse .env file if dotenv is not available
   */
  private loadEnvManually(): void {
    try {
      const envPaths = [
        path.join(app.getAppPath(), '.env'),
        path.join(process.cwd(), '.env'),
        path.resolve('.env'),
      ];

      for (const envPath of envPaths) {
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf-8');
          const lines = envContent.split('\n');
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            // Skip comments and empty lines
            if (!trimmedLine || trimmedLine.startsWith('#')) continue;
            
            const match = trimmedLine.match(/^([^=]+)=(.*)$/);
            if (match) {
              const key = match[1].trim();
              let value = match[2].trim();
              // Remove quotes if present
              if ((value.startsWith('"') && value.endsWith('"')) || 
                  (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
              }
              
              if (!process.env[key]) {
                process.env[key] = value;
              }
            }
          }
          
          logger.info(`Manually loaded .env from: ${envPath}`);
          break;
        }
      }
    } catch (error) {
      logger.warn('Failed to manually load .env:', error);
    }
  }

  private setupEventHandlers(): void {
    autoUpdater.on('checking-for-update', () => {
      logger.info('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      logger.info('Update available:', info.version);
      this.showUpdateAvailableDialog(info);
    });

    autoUpdater.on('update-not-available', () => {
      logger.info('Update not available. Current version is latest.');
    });

    autoUpdater.on('error', (error) => {
      logger.error('Auto-updater error:', error);
      // Don't show error to user unless it's a critical check
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
      logger.info(message);
    });

    autoUpdater.on('update-downloaded', (info) => {
      logger.info('Update downloaded:', info.version);
      this.showUpdateDownloadedDialog(info);
    });
  }

  private async showUpdateAvailableDialog(info: any): Promise<void> {
    const response = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available!`,
      detail: `Current version: ${app.getVersion()}\nNew version: ${info.version}\n\nWould you like to download and install it now?`,
      buttons: ['Download Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    });

    if (response.response === 0) {
      // User chose to download
      logger.info('User chose to download update');
      autoUpdater.downloadUpdate();
    }
  }

  private async showUpdateDownloadedDialog(info: any): Promise<void> {
    const response = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded successfully!',
      detail: `Version ${info.version} has been downloaded. The application will restart to install the update.`,
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    });

    if (response.response === 0) {
      // User chose to restart
      logger.info('User chose to restart and install update');
      autoUpdater.quitAndInstall(false, true); // isSilent, isForceRunAfter
    }
  }

  /**
   * Check for updates manually
   */
  async checkForUpdates(): Promise<void> {
    if (!app.isPackaged) {
      logger.info('Skipping update check in development mode');
      return;
    }

    try {
      logger.info('Checking for updates...');
      await autoUpdater.checkForUpdates();
    } catch (error) {
      logger.error('Failed to check for updates:', error);
    }
  }

  /**
   * Start periodic update checks
   * @param intervalMinutes - How often to check (default: 6 hours = 360 minutes)
   */
  startPeriodicUpdateChecks(intervalMinutes: number = 360): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    // Check immediately on start
    this.checkForUpdates();

    // Then check periodically
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMinutes * 60 * 1000);

    logger.info(`Started periodic update checks (every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop periodic update checks
   */
  stopPeriodicUpdateChecks(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
      logger.info('Stopped periodic update checks');
    }
  }

  /**
   * Get current app version
   */
  getCurrentVersion(): string {
    return app.getVersion();
  }
}

export const updateService = new UpdateService();

