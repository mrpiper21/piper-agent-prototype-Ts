import { autoUpdater } from 'electron-updater';
import { app, dialog } from 'electron';
import { logger } from '../utils/logger';

export class UpdateService {
  private updateCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Configure auto-updater
    autoUpdater.autoDownload = false; // Don't auto-download, let user decide
    autoUpdater.autoInstallOnAppQuit = true; // Install when app quits
    autoUpdater.allowPrerelease = false; // Only stable releases
    
    // Set update server - GitHub Releases
    // Format: owner/repo (e.g., "yourusername/piper-agent")
    const repoOwner = process.env.GITHUB_REPO_OWNER
    const repoName = process.env.GITHUB_REPO_NAME
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: repoOwner,
      repo: repoName,
      private: false,
    });

    // Event handlers
    this.setupEventHandlers();
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

