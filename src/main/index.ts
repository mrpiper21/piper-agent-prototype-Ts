import { app, BrowserWindow } from 'electron';
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

  // Initialize services after app is ready
  dbService.init();

  mainWindow = setupWindows();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
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