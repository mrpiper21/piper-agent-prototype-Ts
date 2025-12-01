import { app, BrowserWindow, dialog, session } from 'electron';
import path from 'path';
import { setupWindows } from './windows/MainWindow';
import { setupIpcHandlers } from './ipc/handlers';
import { logger } from './utils/logger';
import { dbService } from './services/DatabaseService';
import { updateService } from './services/UpdateService';
import fs from 'fs';

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const packageJson = require('../../package.json');
  if (
    packageJson.repository ||
    (packageJson.build?.publish?.owner && packageJson.build?.publish?.repo)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const updateElectronApp = require('update-electron-app');
    updateElectronApp.updateElectronApp({
      logger: logger.log || logger.info, // Use log method if available, fallback to info
      updateInterval: '1 hour',
    });
    logger.info('update-electron-app initialized');
  } else {
    logger.warn('Skipping update-electron-app: repository not configured in package.json');
  }
} catch (error) {
  // Don't crash if update-electron-app fails - it's not critical  logger.warn('Failed to initialize update-electron-app (non-critical):', error instanceof Error ? error.message : String(error));
}
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

app.whenReady().then(() => {
  logger.info('Application starting...');
  logger.info(`Running in ${app.isPackaged ? 'production' : 'development'} mode`);
  logger.info(`__dirname: ${__dirname}`);

  try {
    // Set up session-level permissions for all windows (before creating windows)
    try {
      const defaultSession = session.defaultSession;
      
      // Allow geolocation for all origins at session level
      defaultSession.setPermissionCheckHandler((_webContents, permission: string, requestingOrigin: string) => {
        if (permission === 'geolocation') {
          logger.info(`Session permission check: ${permission} for ${requestingOrigin}`);
          return true;
        }
        return false;
      });

      defaultSession.setPermissionRequestHandler((_webContents, permission: string, callback: (granted: boolean) => void, details: { requestingUrl?: string }) => {
        logger.info(`Session permission request: ${permission} from ${details.requestingUrl}`);
        if (permission === 'geolocation') {
          logger.info('Session: Granting geolocation permission');
          callback(true);
        } else {
          callback(false);
        }
      });
      
      logger.info('Session-level permissions configured');
    } catch (sessionError) {
      logger.error('Failed to configure session permissions (non-critical):', sessionError instanceof Error ? sessionError.message : String(sessionError));
      // Continue - session permissions are not critical
    }

    // Initialize services after app is ready
    try {
      dbService.init();
    } catch (dbError) {
      logger.error('Failed to initialize database (non-critical):', dbError instanceof Error ? dbError.message : String(dbError));
      // Continue - database might work with defaults
    }

    // Create main window - this is critical
    try {
      setupWindows();
    } catch (windowError) {
      logger.error('Failed to create main window:', windowError);
      dialog.showErrorBox(
        'Window Creation Error',
        `Failed to create application window: ${windowError instanceof Error ? windowError.message : String(windowError)}\n\nPlease restart the application.`
      );
      app.quit();
      return;
    }

    // Start auto-update checks (only in production) - non-critical
    if (app.isPackaged) {
      try {
        // Check for updates 5 minutes after app starts (give time for app to load)
        setTimeout(() => {
          try {
            updateService.checkForUpdates();
          } catch (updateError) {
            logger.error('Failed to check for updates (non-critical):', updateError instanceof Error ? updateError.message : String(updateError));
          }
        }, 5 * 60 * 1000);
        
        // Then check periodically (every 6 hours)
        try {
          updateService.startPeriodicUpdateChecks(360);
        } catch (periodicError) {
          logger.error('Failed to start periodic update checks (non-critical):', periodicError instanceof Error ? periodicError.message : String(periodicError));
        }
      } catch (updateInitError) {
        logger.error('Failed to initialize update checks (non-critical):', updateInitError instanceof Error ? updateInitError.message : String(updateInitError));
        // Continue - updates are not critical
      }
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
  dialog.showErrorBox(
    'Startup Error',
    `Application failed to start: ${error instanceof Error ? error.message : String(error)}\n\nPlease check the logs for more information.`
  );
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
