import { app, BrowserWindow, dialog, session, ipcMain } from 'electron';
import path from 'path';
import { fork, ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import { setupWindows } from './windows/MainWindow';
import { setupIpcHandlers } from './ipc/handlers';
import { logger } from './utils/logger';
import { dbService } from './services/DatabaseService';
import { updateService } from './services/UpdateService';
import fs from 'fs';

// WhatsApp service state
let whatsappProcess: ChildProcess | null = null;
let currentWhatsAppStatus: {
  isAuthenticated: boolean;
  isInitialized: boolean;
  qrCode?: string;
  clientInfo?: any;
  error?: string;
} = {
  isAuthenticated: false,
  isInitialized: false,
};

const conversations = new Map();

function getWhatsAppServicePath(): string {
  const isDev = !app.isPackaged;

  if (isDev) {
    const devPath = path.join(__dirname, '../../src/main/whatsapp-service.js');
    logger.info('Dev WhatsApp service path:', devPath);
    return devPath;
  }

  // Production: Check unpacked location
  const unpackedPath = path.join(
    process.resourcesPath || '',
    'app.asar.unpacked',
    'out',
    'main',
    'whatsapp-service.js'
  );

  if (existsSync(unpackedPath)) {
    return unpackedPath;
  }

  throw new Error(`WhatsApp service file not found at: ${unpackedPath}`);
}

function initializeWhatsAppService() {
  try {
    const whatsappServicePath = getWhatsAppServicePath();
    const userDataPath = app.getPath('userData');

    const isDev = !app.isPackaged;
    const baseDir = isDev
      ? path.join(__dirname, '../..')
      : path.join(process.resourcesPath || '', 'app.asar.unpacked');

    const nodeModulesPath = path.join(baseDir, 'node_modules');

    logger.info('=== WhatsApp Service Initialization ===');
    logger.info('Service path:', whatsappServicePath);
    logger.info('Base directory:', baseDir);
    logger.info('Node modules path:', nodeModulesPath);
    logger.info('Node modules exists:', existsSync(nodeModulesPath));

    whatsappProcess = fork(whatsappServicePath, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      cwd: baseDir,
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'production',
        USER_DATA_PATH: userDataPath,
        NODE_PATH: nodeModulesPath,
      },
      execPath: process.execPath,
    });

    // Log ALL output
    whatsappProcess.stdout?.on('data', (data) => {
      const message = data.toString();
      logger.info('[WhatsApp Service]:', message);
    });

    whatsappProcess.stderr?.on('data', (data) => {
      const message = data.toString();
      logger.error('[WhatsApp Service ERROR]:', message);
    });

    // Handle ALL IPC messages
    whatsappProcess.on('message', (msg: any) => {
      logger.info('[WhatsApp IPC]:', msg.type);

      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        logger.warn('Main window not available for WhatsApp message:', msg.type);
        return;
      }

      switch (msg.type) {
        case 'process-started':
          logger.info('✅ WhatsApp service process started');
          break;

        case 'process-ready':
          logger.info('✅ WhatsApp service modules loaded');
          break;

        case 'qr':
          logger.info('📱 QR code received');
          currentWhatsAppStatus.qrCode = msg.qr;
          currentWhatsAppStatus.isInitialized = true;
          mainWindow.webContents.send('whatsapp-qr', msg.qr);
          mainWindow.webContents.send('whatsapp-status', currentWhatsAppStatus);
          break;

        case 'authenticated':
          logger.info('✅ WhatsApp authenticated');
          currentWhatsAppStatus.isAuthenticated = true;
          currentWhatsAppStatus.qrCode = undefined;
          mainWindow.webContents.send('whatsapp-status', currentWhatsAppStatus);
          break;

        case 'ready':
          logger.info('✅ WhatsApp client READY');
          logger.info('   Client Info:', JSON.stringify(msg.clientInfo));
          currentWhatsAppStatus.isAuthenticated = true;
          currentWhatsAppStatus.isInitialized = true;
          currentWhatsAppStatus.qrCode = undefined;
          if (msg.clientInfo) {
            currentWhatsAppStatus.clientInfo = msg.clientInfo;
          }
          mainWindow.webContents.send('whatsapp-status', currentWhatsAppStatus);
          break;

        case 'message':
          logger.info('📨 NEW MESSAGE:', msg.data.from, msg.data.body?.substring(0, 50));
          mainWindow.webContents.send('whatsapp-message', msg.data);
          updateConversationWithMessage(msg.data, mainWindow);
          break;

        case 'message-sent':
          logger.info('✅ Message sent');
          break;

        case 'disconnected':
          logger.warn('❌ WhatsApp disconnected:', msg.reason);
          currentWhatsAppStatus.isAuthenticated = false;
          currentWhatsAppStatus.isInitialized = false;
          mainWindow.webContents.send('whatsapp-status', currentWhatsAppStatus);
          break;

        case 'error':
          logger.error('❌ WhatsApp error:', msg.error);
          currentWhatsAppStatus.error = msg.error;
          mainWindow.webContents.send('whatsapp-error', msg.error);
          mainWindow.webContents.send('whatsapp-status', currentWhatsAppStatus);
          break;

        case 'message-history-fetched':
          logger.info(`📚 Fetched ${msg.count} historical messages`);
          break;

        default:
          logger.warn('Unknown WhatsApp message type:', msg.type);
      }
    });

    whatsappProcess.on('error', (error) => {
      logger.error('💥 WhatsApp process error:', error);
    });

    whatsappProcess.on('exit', (code, signal) => {
      logger.warn(`❌ WhatsApp process exited: code=${code}, signal=${signal}`);
      whatsappProcess = null;
      currentWhatsAppStatus.isAuthenticated = false;
      currentWhatsAppStatus.isInitialized = false;
    });

    logger.info('✅ WhatsApp service forked successfully');
  } catch (error: any) {
    logger.error('💥 Failed to initialize WhatsApp service:', error);
    currentWhatsAppStatus.error = error.message;
  }
}

function updateConversationWithMessage(messageData: any, mainWindow: BrowserWindow) {
  const chatId = messageData.from;

  if (!conversations.has(chatId)) {
    conversations.set(chatId, {
      id: chatId,
      contactName: messageData.contactName,
      contactPhone: messageData.contactNumber,
      messages: [],
      lastMessage: '',
      timestamp: Date.now(),
      unread: 0,
      status: 'needs_quote',
    });
  }

  const conv = conversations.get(chatId);
  conv.messages.push({
    id: Date.now(),
    from: 'client',
    text: messageData.body,
    timestamp: messageData.timestamp * 1000,
    hasMedia: messageData.hasMedia,
    mediaData: messageData.media,
  });

  conv.lastMessage = messageData.body;
  conv.timestamp = messageData.timestamp * 1000;
  conv.unread += 1;

  const conversationsArray = Array.from(conversations.values());
  mainWindow.webContents.send('whatsapp-conversations-update', conversationsArray);
}

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
      logger: logger?.log || logger?.info, // Use log method if available, fallback to info
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

// Add IPC handlers for WhatsApp
ipcMain.handle('whatsapp:getStatus', async () => {
  return currentWhatsAppStatus;
});

ipcMain.handle('whatsapp:initialize', async () => {
  try {
    logger.info('📱 Initializing WhatsApp client...');

    if (!whatsappProcess) {
      initializeWhatsAppService();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (whatsappProcess) {
      whatsappProcess.send({ type: 'init' });
      currentWhatsAppStatus.isInitialized = true;
    } else {
      throw new Error('Failed to start WhatsApp service');
    }

    return currentWhatsAppStatus;
  } catch (error: any) {
    logger.error('WhatsApp initialize error:', error);
    currentWhatsAppStatus.error = error.message;
    return currentWhatsAppStatus;
  }
});

ipcMain.handle('whatsapp:disconnect', async () => {
  if (whatsappProcess) {
    whatsappProcess.send({ type: 'disconnect' });
    whatsappProcess.kill();
    whatsappProcess = null;
  }
  currentWhatsAppStatus = {
    isAuthenticated: false,
    isInitialized: false,
  };
  return { success: true };
});

ipcMain.handle('whatsapp:logout', async () => {
  if (whatsappProcess) {
    whatsappProcess.send({ type: 'logout' });
  }
  return { success: true };
});

// Create application window

app
  .whenReady()
  .then(() => {
    logger.info('Application starting...');
    logger.info(`Running in ${app.isPackaged ? 'production' : 'development'} mode`);
    logger.info(`__dirname: ${__dirname}`);

    try {
      // Set up session-level permissions for all windows (before creating windows)
      try {
        const defaultSession = session.defaultSession;

        // Allow geolocation for all origins at session level
        defaultSession.setPermissionCheckHandler(
          (_webContents, permission: string, requestingOrigin: string) => {
            if (permission === 'geolocation') {
              logger.info(`Session permission check: ${permission} for ${requestingOrigin}`);
              return true;
            }
            return false;
          }
        );

        defaultSession.setPermissionRequestHandler(
          (
            _webContents,
            permission: string,
            callback: (granted: boolean) => void,
            details: { requestingUrl?: string }
          ) => {
            logger.info(`Session permission request: ${permission} from ${details.requestingUrl}`);
            if (permission === 'geolocation') {
              logger.info('Session: Granting geolocation permission');
              callback(true);
            } else {
              callback(false);
            }
          }
        );

        logger.info('Session-level permissions configured');
      } catch (sessionError) {
        logger.error(
          'Failed to configure session permissions (non-critical):',
          sessionError instanceof Error ? sessionError.message : String(sessionError)
        );
        // Continue - session permissions are not critical
      }

      // Initialize services after app is ready
      try {
        dbService.init();
      } catch (dbError) {
        logger.error(
          'Failed to initialize database (non-critical):',
          dbError instanceof Error ? dbError.message : String(dbError)
        );
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
          setTimeout(
            () => {
              try {
                updateService.checkForUpdates();
              } catch (updateError) {
                logger.error(
                  'Failed to check for updates (non-critical):',
                  updateError instanceof Error ? updateError.message : String(updateError)
                );
              }
            },
            5 * 60 * 1000
          );

          // Then check periodically (every 6 hours)
          try {
            updateService.startPeriodicUpdateChecks(360);
          } catch (periodicError) {
            logger.error(
              'Failed to start periodic update checks (non-critical):',
              periodicError instanceof Error ? periodicError.message : String(periodicError)
            );
          }
        } catch (updateInitError) {
          logger.error(
            'Failed to initialize update checks (non-critical):',
            updateInitError instanceof Error ? updateInitError.message : String(updateInitError)
          );
          // Continue - updates are not critical
        }
      }

      // Initialize WhatsApp service (non-critical - can be started manually via UI)
      // Don't auto-start to avoid blocking app startup
      // Users can start it manually from the UI
      logger.info('WhatsApp service available (initialize via UI)');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      // Show error dialog
      dialog.showErrorBox(
        'Application Error',
        `Failed to start application: ${error instanceof Error ? error.message : String(error)}\n\nCheck logs for more details.`
      );
      app.quit();
    }
  })
  .catch((error) => {
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

  // Disconnect WhatsApp service gracefully
  if (whatsappProcess) {
    whatsappProcess.send({ type: 'disconnect' });
    whatsappProcess.kill();
    whatsappProcess = null;
  }

  dbService.close();
});
