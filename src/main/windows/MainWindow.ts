import { BrowserWindow, app } from 'electron';
import path from 'path';
import { logger } from '../utils/logger';

let mainWindow: BrowserWindow | null = null;

export function setupWindows(): BrowserWindow {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // Don't show until ready
    autoHideMenuBar: false,
  });

  // 🔥 FIX: Use app.isPackaged instead of process.env
  if (app.isPackaged) {
    // Production build - fixed path
    const indexPath = path.join(__dirname, '../renderer/index.html');
    logger.info(`Loading production file from: ${indexPath}`);
    mainWindow.loadFile(indexPath);

    // Temporarily open DevTools to debug (remove after it works)
    mainWindow.webContents.openDevTools();
  } else {
    // Development mode
    logger.info('Loading development server: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    logger.info('Window ready to show');
    mainWindow?.show();
  });

  // Log loading events
  mainWindow.webContents.on('did-finish-load', () => {
    logger.info('Page finished loading successfully');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    logger.error(`Failed to load page: ${errorCode} - ${errorDescription}`);
    logger.error(`Attempted URL: ${validatedURL}`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
