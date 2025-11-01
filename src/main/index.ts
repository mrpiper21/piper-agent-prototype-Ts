// src/main/services/UpdateService.ts
import { autoUpdater } from 'electron-updater';
import { dialog, BrowserWindow } from 'electron';
import { logger } from './utils/logger';

class UpdateService {
  private updateCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Configure auto-updater
    autoUpdater.autoDownload = false; // Don't auto-download, ask user first
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.logger = logger;

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    autoUpdater.on('checking-for-update', () => {
      logger.info('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      logger.info('Update available:', info);
      
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `A new version ${info.version} is available. Would you like to download it now?`,
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
          
          // Show downloading notification
          const mainWindow = BrowserWindow.getAllWindows()[0];
          if (mainWindow) {
            mainWindow.webContents.send('update-downloading');
          }
        }
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      logger.info('Update not available:', info);
    });

    autoUpdater.on('error', (err) => {
      logger.error('Error in auto-updater:', err);
      
      // Only show error dialog if it's not a network error
      if (!err.message.includes('net::')) {
        dialog.showErrorBox('Update Error', `Error checking for updates: ${err.message}`);
      }
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const message = `Download speed: ${Math.round(progressObj.bytesPerSecond / 1024)}KB/s - ${Math.round(progressObj.percent)}% (${Math.round(progressObj.transferred / 1024 / 1024)}MB/${Math.round(progressObj.total / 1024 / 1024)}MB)`;
      logger.info(message);
      
      // Send progress to renderer
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('update-progress', {
          percent: progressObj.percent,
          transferred: progressObj.transferred,
          total: progressObj.total
        });
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      logger.info('Update downloaded:', info);
      
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded. The application will restart to apply the update.`,
        buttons: ['Restart Now', 'Restart Later'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          // Small delay to ensure dialog closes properly
          setImmediate(() => {
            autoUpdater.quitAndInstall(false, true);
          });
        }
      });
    });
  }

  public checkForUpdates(): void {
    logger.info('Manually checking for updates...');
    autoUpdater.checkForUpdates().catch((error) => {
      logger.error('Failed to check for updates:', error);
    });
  }

  public startPeriodicUpdateChecks(intervalMinutes: number): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    logger.info(`Starting periodic update checks every ${intervalMinutes} minutes`);
    
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMinutes * 60 * 1000);
  }

  public stopPeriodicUpdateChecks(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
      logger.info('Stopped periodic update checks');
    }
  }
}

export const updateService = new UpdateService();