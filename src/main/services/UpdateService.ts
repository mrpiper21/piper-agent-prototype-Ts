import { autoUpdater } from 'electron-updater';
import { app, dialog } from 'electron';
import { logger } from '../utils/logger';
import { shell } from 'electron';
import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config();

export class UpdateService {
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private githubToken: string | null = null;

  constructor() {
    try {
      // Load environment variables from .env file if it exists
      this.loadEnvFile();

      // Get GitHub token from environment
      this.githubToken = process.env.PERSONAL_ACCESS_TOKEN || null;

      // Configure auto-updater with error handling
      try {
        autoUpdater.autoDownload = false; // Don't auto-download, let user decide
        autoUpdater.autoInstallOnAppQuit = true; // Install when app quits
        autoUpdater.allowPrerelease = false; // Only stable releases
        if (process.platform === 'win32') {
          // @ts-expect-error - verifySignatureAndUpdaterIntegrity might not be in types but exists in runtime
          autoUpdater.verifySignatureAndUpdaterIntegrity = false;
          logger.info('Signature verification disabled for Windows (unsigned build)');
        }

        // Set GitHub token if available (required for private repos)
        if (this.githubToken) {
          // Set token for authentication with private repos
          autoUpdater.requestHeaders = {
            Authorization: `token ${this.githubToken}`,
          };
          logger.info('GitHub Personal Access Token configured for private repository updates');
        } else {
          logger.warn(
            'No GITHUB_PERSONAL_ACCESS_TOKEN found. Auto-updates may not work with private repositories.'
          );
        }
        const repoOwner = process.env.REPO_OWNER || 'mrpiper21';
        const repoName = process.env.REPO_NAME || 'Agent-Releases';
        const isPrivate = this.githubToken !== null;

        autoUpdater.setFeedURL({
          provider: 'github',
          owner: repoOwner,
          repo: repoName,
          private: isPrivate,
        });

        logger.info(
          `Configured auto-updater for: ${repoOwner}/${repoName} (${isPrivate ? 'private' : 'public'})`
        );

        this.setupEventHandlers();
      } catch (updaterError) {
        logger.error(
          'Failed to configure auto-updater (non-critical):',
          updaterError instanceof Error ? updaterError.message : String(updaterError)
        );
        // Don't throw - auto-updater is not critical for app functionality
      }
    } catch (error) {
      logger.error(
        'Failed to initialize UpdateService (non-critical):',
        error instanceof Error ? error.message : String(error)
      );
      // Don't throw - UpdateService is not critical for app functionality
    }
  }

  /**
   * Load environment variables from .env file
   */
  private loadEnvFile(): void {
    try {
      // Try to load dotenv if available
      try {
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
              if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
              ) {
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

    autoUpdater.on('error', async (error) => {
      logger.error('Auto-updater error:', error);

      // Show error dialog to user for critical errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorObj = error as any;

      // Check if this is a signature verification error
      const isSignatureError =
        errorMessage.includes('not signed') ||
        errorMessage.includes('digitally signed') ||
        errorMessage.includes('SignerCertificate') ||
        (errorObj?.rawInfo && errorObj.rawInfo.Status === 2);

      // Only show dialog for download/update errors, not for check errors
      if (
        errorMessage.includes('download') ||
        errorMessage.includes('update') ||
        isSignatureError
      ) {
        try {
          const repoOwner = process.env.REPO_OWNER || 'mrpiper21';
          const repoName = process.env.REPO_NAME || 'Agent-Releases';
          const githubUrl = `https://github.com/${repoOwner}/${repoName}/releases`;

          let errorDetail = errorMessage;

          // Provide helpful message for signature errors
          if (isSignatureError) {
            errorDetail =
              `The update installer is not digitally signed.\n\n` +
              `This is normal for unsigned builds. You can:\n` +
              `1. Manually download and install from: ${githubUrl}\n` +
              `2. Or temporarily disable Windows SmartScreen to install unsigned updates.\n\n` +
              `Technical details: ${errorMessage}`;
          }

          await dialog
            .showMessageBox({
              type: 'warning',
              title: 'Update Installation Issue',
              message: isSignatureError ? 'Update requires manual installation' : 'Update Error',
              detail: errorDetail,
              buttons: isSignatureError ? ['Open GitHub Releases', 'OK'] : ['OK'],
              defaultId: 0,
              cancelId: 1,
            })
            .then((result) => {
              if (isSignatureError && result.response === 0) {
                shell.openExternal(githubUrl);
              }
            });
        } catch (dialogError) {
          // Dialog might fail if window is closed, just log it
          logger.error('Failed to show error dialog:', dialogError);
        }
      }
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const percent = Math.round(progressObj.percent || 0);
      const bytesPerSecond = progressObj.bytesPerSecond || 0;
      const transferred = progressObj.transferred || 0;
      const total = progressObj.total || 0;

      const message = `Download progress: ${percent}% (${this.formatBytes(transferred)}/${this.formatBytes(total)}) - ${this.formatBytes(bytesPerSecond)}/s`;
      logger.info(message);

      // Optionally send progress to renderer for UI updates
      // This would require IPC setup if you want progress bars in the UI
    });

    autoUpdater.on('update-downloaded', (info) => {
      logger.info('Update downloaded:', info.version);
      this.showUpdateDownloadedDialog(info);
    });
  }

  private async showUpdateAvailableDialog(info: any): Promise<void> {
    try {
      const response = await dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available!`,
        detail: `Current version: ${app.getVersion()}\nNew version: ${info.version}\n\nWould you like to download it now? The update will be installed when you restart the app.`,
        buttons: ['Download Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      });

      if (response.response === 0) {
        // User chose to download
        logger.info('User chose to download update');
        try {
          // Start the download (happens in background)
          await autoUpdater.downloadUpdate();
          logger.info('Update download initiated successfully');
          // Note: User will be notified via showUpdateDownloadedDialog when download completes
        } catch (downloadError) {
          logger.error('Failed to start update download:', downloadError);

          // Check if this is a signature verification error
          const errorMessage =
            downloadError instanceof Error ? downloadError.message : String(downloadError);
          const errorObj = downloadError as any;

          const isSignatureError =
            errorMessage.includes('not signed') ||
            errorMessage.includes('digitally signed') ||
            errorMessage.includes('SignerCertificate') ||
            errorMessage.includes('execution policy') ||
            (errorObj?.rawInfo && errorObj.rawInfo.Status === 2);

          const repoOwner = process.env.REPO_OWNER || 'mrpiper21';
          const repoName = process.env.REPO_NAME || 'Agent-Releases';
          const githubUrl = `https://github.com/${repoOwner}/${repoName}/releases`;

          if (isSignatureError) {
            // Show helpful dialog for signature errors with option to open GitHub
            await dialog
              .showMessageBox({
                type: 'warning',
                title: 'Download Failed',
                message: 'Update requires manual download',
                detail:
                  `The update installer is not digitally signed.\n\n` +
                  `This is normal for unsigned builds. You can:\n` +
                  `1. Manually download and install from: ${githubUrl}\n` +
                  `2. Or temporarily disable Windows SmartScreen to install unsigned updates.\n\n` +
                  `Technical details: ${errorMessage}`,
                buttons: ['Open GitHub Releases', 'OK'],
                defaultId: 0,
                cancelId: 1,
              })
              .then((result) => {
                if (result.response === 0) {
                  shell.openExternal(githubUrl);
                }
              });
          } else {
            // Generic download error
            await dialog.showErrorBox(
              'Download Failed',
              `Failed to download update: ${errorMessage}\n\nPlease try again later or download manually from GitHub.`
            );
          }
        }
      }
    } catch (error) {
      logger.error('Error showing update dialog:', error);
    }
  }

  private async showUpdateDownloadedDialog(info: any): Promise<void> {
    try {
      const isWindows = process.platform === 'win32';
      const isUnsigned = true; // Since we're not signing the app (sign: null in package.json)

      let detailMessage = `Version ${info.version} has been downloaded.\n\nThe application will restart to install the update.`;

      // Add warning for Windows unsigned builds
      if (isWindows && isUnsigned) {
        detailMessage =
          `Version ${info.version} has been downloaded.\n\n` +
          `⚠️ Note: This is an unsigned build. Windows may show a security warning.\n` +
          `You may need to click "More info" and then "Run anyway" if Windows blocks the installer.\n\n` +
          `The application will restart to install the update.`;
      }

      const response = await dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready to Install',
        message: 'Update downloaded successfully!',
        detail: detailMessage,
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      });

      if (response.response === 0) {
        // User chose to restart
        logger.info('User chose to restart and install update');
        try {
          // For Windows unsigned builds, we might need to handle installation differently
          // isSilent: false (show progress), isForceRunAfter: true (force restart after install)
          autoUpdater.quitAndInstall(false, true);
        } catch (installError) {
          logger.error('Failed to install update:', installError);
          const errorMessage =
            installError instanceof Error ? installError.message : String(installError);

          // Check if it's a signature/execution policy error
          if (
            errorMessage.includes('not signed') ||
            errorMessage.includes('execution policy') ||
            errorMessage.includes('digitally signed')
          ) {
            const repoOwner = process.env.REPO_OWNER as string;
            const repoName = process.env.REPO_NAME as string;
            const githubUrl = `https://github.com/${repoOwner}/${repoName}/releases`;

            await dialog
              .showMessageBox({
                type: 'warning',
                title: 'Update Installation Blocked',
                message: 'Windows blocked the unsigned installer',
                detail:
                  `Windows security is blocking the unsigned installer.\n\n` +
                  `Options:\n` +
                  `1. Manually download from: ${githubUrl}\n` +
                  `2. Right-click the installer and select "Run as administrator"\n` +
                  `3. Or adjust Windows SmartScreen settings\n\n` +
                  `Technical error: ${errorMessage}`,
                buttons: ['Open GitHub Releases', 'OK'],
                defaultId: 0,
                cancelId: 1,
              })
              .then((result) => {
                if (result.response === 0) {
                  shell.openExternal(githubUrl);
                }
              });
          } else {
            await dialog.showErrorBox(
              'Installation Error',
              `Failed to install update: ${errorMessage}\n\nPlease restart the application manually.`
            );
          }
        }
      } else {
        // User chose later - update will install on next app quit (autoInstallOnAppQuit is true)
        logger.info('User chose to install update later');
      }
    } catch (error) {
      logger.error('Error showing update downloaded dialog:', error);
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
    this.updateCheckInterval = setInterval(
      () => {
        this.checkForUpdates();
      },
      intervalMinutes * 60 * 1000
    );

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

  /**
   * Format bytes to human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export const updateService = new UpdateService();

