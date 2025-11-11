import { app, BrowserWindow, dialog, session } from 'electron';
import path from 'path';
import { setupWindows } from './windows/MainWindow';
import { setupIpcHandlers } from './ipc/handlers';
import { logger } from './utils/logger';
import { dbService } from './services/DatabaseService';
import { updateService } from './services/UpdateService';
import fs from 'fs';
import updateElectronApp from 'update-electron-app';
updateElectronApp.updateElectronApp();
// Load environment variables from .env file if available
try {
  import('dotenv').then((dotenv) => {
    const envPath = path.join(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      logger.info('Loaded .env file');
    } else {
      dotenv.config(); // Try default location
    }
  });
} catch (error) {
  // dotenv might not be available, that's okay
  logger.debug('dotenv not available, skipping .env load');
}

// Enable live reload for dev
if (process.env.NODE_ENV === 'development') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '../../node_modules/.bin/electron'),
      hardResetMethod: 'exit',
    });
  } catch (error) {
    // electron-reload may not be installed
    console.log('electron-reload not found, skipping live reload');
  }
}

// Handle IPC events
setupIpcHandlers();

// Create application window
let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  logger.info('Application starting...');
  logger.info(`Running in ${app.isPackaged ? 'production' : 'development'} mode`);
  logger.info(`__dirname: ${__dirname}`);

  try {
    // Set up session-level permissions for all windows (before creating windows)
    const defaultSession = session.defaultSession;
    
    // Allow geolocation for all origins at session level
    defaultSession.setPermissionCheckHandler((_webContents, permission: string, requestingOrigin: string) => {
      if (permission === 'geolocation') {
        logger.info(`Session permission check: ${permission} for ${requestingOrigin}`);
        return true;
      }
      return false;
    });

    defaultSession.setPermissionRequestHandler((_webContents, permission: string, callback: (granted: boolean) => void, details: any) => {
      logger.info(`Session permission request: ${permission} from ${details.requestingUrl}`);
      if (permission === 'geolocation') {
        logger.info('Session: Granting geolocation permission');
        callback(true);
      } else {
        callback(false);
      }
    });
    
    logger.info('Session-level permissions configured');

    // Initialize services after app is ready
    dbService.init();

    mainWindow = setupWindows();

    // Start auto-update checks (only in production)
    if (app.isPackaged) {
      // Check for updates 5 minutes after app starts (give time for app to load)
      setTimeout(() => {
        updateService.checkForUpdates();
      }, 5 * 60 * 1000);
      
      // Then check periodically (every 6 hours)
      updateService.startPeriodicUpdateChecks(360);
    }
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    // Show error dialog
    dialog.showErrorBox(
      'Application Error',
      `Failed to start application: ${error instanceof Error ? error.message : String(error)}\n\nCheck logs for more details.`
    );
    app.quit();
  }
}).catch((error) => {
  logger.error('Failed to start application:', error);
  app.quit();
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  dialog.showErrorBox('Uncaught Exception', error.message || String(error));
  // Don't quit immediately, let the error be logged
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    setupWindows();
  }
});

app.on('before-quit', () => {
  logger.info('Application shutting down...');
  updateService.stopPeriodicUpdateChecks();
  dbService.close();
});
