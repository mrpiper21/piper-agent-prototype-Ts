import { BrowserWindow, app } from 'electron';
import path from 'path';
import fs from 'fs';
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
    logger.info(`Resolved preload path: ${preloadPath}`);
    logger.info(`Resolved index path: ${indexPath}`);

    // Verify files exist (Note: in asar, files might not be directly accessible)
    try {
      if (!fs.existsSync(preloadPath)) {
        logger.error(`Preload file not found at: ${preloadPath}`);
      } else {
        logger.info(`Preload file exists`);
      }
      if (!fs.existsSync(indexPath)) {
        logger.error(`Index file not found at: ${indexPath}`);
      } else {
        logger.info(`Index file exists`);
      }
    } catch (err) {
      logger.error(`Error checking file paths: ${err}`);
    }
  } else {
    // Development mode
    preloadPath = path.join(__dirname, '../preload/index.js');
    indexPath = ''; // Not used in dev
  }

  logger.info(`Preload path: ${preloadPath}`);

  // Get icon path
  let iconPath: string | undefined;
  if (app.isPackaged) {
    // In production, icon is in resources
    iconPath = path.join(process.resourcesPath, 'build', 'icon.png');
    // Fallback to app path if not found
    if (!fs.existsSync(iconPath)) {
      iconPath = path.join(app.getAppPath(), '..', 'build', 'icon.png');
    }
  } else {
    // In development, use source asset
    iconPath = path.join(__dirname, '../../assets/printAgentLogo.png');
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath, // Set window icon
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // Don't show until ready
    autoHideMenuBar: false,
  });

  // Handle geolocation permission requests - MUST be set before loading content
  const session = mainWindow.webContents.session;

  // Set permission check handler - checks if permission is already granted
  session.setPermissionCheckHandler(
    (_webContents, permission: string, requestingOrigin: string) => {
      logger.info(`Permission check: ${permission} for ${requestingOrigin}`);
      // Always allow geolocation checks
      if (permission === 'geolocation') {
        return true;
      }
      return false;
    }
  );

  // Set permission request handler - handles new permission requests
  session.setPermissionRequestHandler(
    (
      _webContents,
      permission: string,
      callback: (granted: boolean) => void,
      _details: { requestingUrl?: string }
    ) => {
      logger.info(`Permission request: ${permission}`);
      // Always allow geolocation permission requests
      if (permission === 'geolocation') {
        logger.info('Granting geolocation permission');
        callback(true);
      } else {
        logger.info(`Denying permission: ${permission}`);
        callback(false);
      }
    }
  );

  // Load content based on environment
  if (app.isPackaged) {
    // Production build
    logger.info(`Loading production file from: ${indexPath}`);
    logger.info(`Resolved index path: ${path.resolve(indexPath)}`);

    // Use loadFile which properly handles paths in asar archives
    mainWindow.loadFile(indexPath).catch((error) => {
      logger.error(`Failed to load file: ${error}`);
      mainWindow?.webContents.send('error', {
        message: `Failed to load application: ${error.message}`,
      });
      // Show window anyway so user can see error
      mainWindow?.show();
    });

    // Only open DevTools in development or if debugging is needed
    // Uncomment the line below if you need to debug production builds
    // mainWindow.webContents.openDevTools();
  } else {
    // Development mode - load from Vite dev server
    // electron-vite runs the dev server on port 5173 by default
    const viteDevServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    logger.info(`Loading development server: ${viteDevServerUrl}`);
    mainWindow.loadURL(viteDevServerUrl).catch((error) => {
      logger.error(`Failed to load URL: ${error}`);
      mainWindow?.show();
    });
    mainWindow.webContents.openDevTools();
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    logger.info('Window ready to show');
    mainWindow?.show();
  });

  // Note: Update handlers are managed by UpdateService
  // Do not register duplicate handlers here to avoid conflicts

  // Handle console errors
  mainWindow.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2) {
      // error or warning (0=log, 1=warn, 2=error)
      logger.error(`Renderer console [${level}]: ${message}`);
    }
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
