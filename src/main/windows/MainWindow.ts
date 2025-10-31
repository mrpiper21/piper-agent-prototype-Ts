import { BrowserWindow, app } from 'electron';
import path from 'path';
import { logger } from '../utils/logger';

let mainWindow: BrowserWindow | null = null;

export function setupWindows(): BrowserWindow {
  // Create the browser window
  // In production, __dirname is inside the asar archive
  // We need to get the path correctly based on the environment
  let preloadPath: string;
  let indexPath: string;

  if (app.isPackaged) {
    // In production (packaged in asar)
    // __dirname points to: <resourcesPath>/app.asar/out/main
    // So ../preload/index.js resolves to: app.asar/out/preload/index.js
    // and ../renderer/index.html resolves to: app.asar/out/renderer/index.html

    preloadPath = path.join(__dirname, '../preload/index.js');
    indexPath = path.join(__dirname, '../renderer/index.html');

    logger.info(`Production mode - __dirname: ${__dirname}`);
  } else {
    // Development mode
    preloadPath = path.join(__dirname, '../preload/index.js');
    indexPath = ''; // Not used in dev
  }

  logger.info(`Preload path: ${preloadPath}`);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // Don't show until ready
    autoHideMenuBar: false,
  });

  // Load content based on environment
  if (app.isPackaged) {
    // Production build
    logger.info(`Loading production file from: ${indexPath}`);
    logger.info(`Resolved index path: ${path.resolve(indexPath)}`);

    // Use loadFile which properly handles paths in asar archives
    mainWindow.loadFile(indexPath);

    // Open DevTools to see any errors
    mainWindow.webContents.openDevTools();
  } else {
    // Development mode - load from Vite dev server
    // electron-vite runs the dev server on port 5173 by default
    const viteDevServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    logger.info(`Loading development server: ${viteDevServerUrl}`);
    mainWindow.loadURL(viteDevServerUrl);
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

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      logger.error(`Failed to load page: ${errorCode} - ${errorDescription}`);
      logger.error(`Attempted URL: ${validatedURL}`);
    }
  );

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
