import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';
import { setupWindows } from './windows/MainWindow';
import { setupIpcHandlers } from './ipc/handlers';
import { logger } from './utils/logger';
import { dbService } from './services/DatabaseService';

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
    // Initialize services after app is ready
    dbService.init();

    mainWindow = setupWindows();
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
  dbService.close();
});