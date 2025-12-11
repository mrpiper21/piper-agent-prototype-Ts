import { app, BrowserWindow, dialog, session, ipcMain } from 'electron';
import path from 'path';
import { fork, ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import { setupWindows } from './windows/MainWindow';
import { setupIpcHandlers } from './ipc/handlers';
import { logger } from './utils/logger';
import { dbService } from './services/DatabaseService';
import { updateService } from './services/UpdateService';
import { whatsappService } from './services/WhatsAppService';
import { storageService } from './services/StorageService';
import { trayService } from './services/TrayService';
import { notificationService } from './services/NotificationService';
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
          mainWindow.webContents.send('whatsapp-ready');
          break;

        case 'message': {
          logger.info('📨 NEW MESSAGE:', msg.data.from, msg.data.body?.substring(0, 50));
          
          // Send enhanced message data to renderer immediately for real-time updates
          mainWindow.webContents.send('whatsapp-message', {
            id: msg.data.id || msg.data.messageId,
            chatId: msg.data.chatId || msg.data.from,
            body: msg.data.body,
            timestamp: msg.data.timestamp,
            fromMe: msg.data.fromMe || false,
            hasMedia: msg.data.hasMedia,
            contact: msg.data.contact,
            ack: msg.data.ack || 0,
          });
          
          // Also update conversation (for backward compatibility)
          updateConversationWithMessage(msg.data, mainWindow);
          
          // Show native notification
          const contactName = msg.data.contact?.name || msg.data.contactName || msg.data.from;
          const messagePreview = msg.data.body?.substring(0, 100) || 'New message';
          notificationService.showWhatsAppMessage(contactName, messagePreview, () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
            }
          });
          break;
        }

        case 'message-sent':
          logger.info('✅ Message sent', { chatId: msg.chatId, textLength: msg.text?.length });
          // Immediately notify renderer that message was sent
          // The message should already be stored via storeAgentMessage, but trigger UI update
          mainWindow.webContents.send('whatsapp-message-sent', {
            chatId: msg.chatId,
            text: msg.text,
            timestamp: Date.now(),
          });
          break;

        case 'message_ack': {
          logger.info('📬 Message acknowledgment', { messageId: msg.messageId, ack: msg.ack });
          mainWindow.webContents.send('whatsapp-message-ack', {
            messageId: msg.messageId,
            chatId: msg.chatId,
            ack: msg.ack, // 1: sent, 2: delivered, 3: read
          });
          break;
        }

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
      logger: logger.info.bind(logger),
      updateInterval: '1 hour',
    });
    logger.info('update-electron-app initialized');
  } else {
    logger.warn('Skipping update-electron-app: repository not configured in package.json');
  }
} catch (error) {
  logger.warn(
    'Failed to initialize update-electron-app (non-critical):',
    error instanceof Error ? error.message : String(error)
  );
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

ipcMain.handle('whatsapp:getLocalMessages', async () => {
  try {
    // Get messages from WhatsAppMessageHandler (includes both agent and client messages)
    // We strictly use this source now to avoid duplication from the legacy conversations Map
    const messageMap = new Map<string, any>();
    
    let handlerMessageCount = 0;
    try {
      const allLocalMessages = whatsappService.getAllLocalMessages();
      handlerMessageCount = allLocalMessages.size;
      allLocalMessages.forEach((messages, _contact) => {
        messages.forEach((msg) => {
          // Use messageId as key to avoid duplicates
          messageMap.set(msg.messageId, {
            contact: msg.contact,
            contactName: msg.contactName,
            contactNumber: msg.contact.split('@')[0],
            messageId: msg.messageId,
            body: msg.body,
            timestamp: msg.timestamp,
            hasMedia: msg.hasMedia,
            media: msg.media,
            isPrintCommand: msg.isPrintCommand,
            from: msg.from || 'client',
          });
        });
      });
    } catch (handlerError) {
      logger.warn('Error getting messages from WhatsAppMessageHandler:', handlerError);
    }

    // Fallback: If no messages in Handler (e.g. app just started and hasn't fetched yet),
    // check conversations Map - but only if Handler is empty to avoid duplicates
    if (messageMap.size === 0 && conversations.size > 0) {
      conversations.forEach((conv, chatId) => {
        conv.messages.forEach((msg: any) => {
          const messageId = msg.id || `conv-${chatId}-${Date.now()}`;
          messageMap.set(messageId, {
            contact: chatId,
            contactName: conv.contactName,
            contactNumber: conv.contactPhone,
            messageId: messageId,
            body: msg.text,
            timestamp: msg.timestamp || Date.now(),
            hasMedia: msg.hasMedia || false,
            media: msg.mediaData,
            isPrintCommand: false,
            from: msg.from || 'client',
          });
        });
      });
    }
    
    // Convert Map to array and sort by timestamp (ascending - oldest first)
    const finalMessages = Array.from(messageMap.values()).sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeA - timeB;
    });
    
    logger.info('[IPC] getLocalMessages returning', {
      totalMessages: finalMessages.length,
      fromHandler: handlerMessageCount,
      agentMessages: finalMessages.filter(m => m.from === 'agent').length,
      clientMessages: finalMessages.filter(m => m.from === 'client').length,
    });
    return finalMessages;
  } catch (error: any) {
    logger.error('WhatsApp getLocalMessages error', error);
    throw error;
  }
});

ipcMain.handle('whatsapp:sendMessage', async (_event, chatId: string, text: string) => {
  try {
    // Always store the message first (even if sending fails)
    // This ensures messages persist even if WhatsAppService isn't fully initialized
    try {
      const messageHandler = (whatsappService as any).messageHandler;
      if (messageHandler) {
        messageHandler.storeAgentMessage(chatId, text);
      }
    } catch (storeError) {
      logger.warn('Could not store agent message via WhatsAppService, trying direct access:', storeError);
    }
    
    // Try to send via WhatsAppService first
    try {
      const result = await whatsappService.sendMessage(chatId, text);
      if (result.success) {
        logger.info('WhatsApp message sent via WhatsAppService', { chatId, textLength: text.length });
        return result;
      }
    } catch (serviceError) {
      logger.warn('WhatsAppService.sendMessage failed, trying fallback:', serviceError);
    }
    
    // Fallback: send directly via the forked process if WhatsAppService doesn't have a process
    if (!whatsappProcess) {
      throw new Error('WhatsApp service not initialized');
    }
    whatsappProcess.send({ type: 'send-message', chatId, text });
    logger.info('WhatsApp message sent via fallback process', { chatId, textLength: text.length });
    return { success: true };
  } catch (error: any) {
    logger.error('WhatsApp sendMessage error', error);
    throw error;
  }
});

ipcMain.handle(
  'whatsapp:sendFile',
  async (_event, chatId: string, filePath: string, caption?: string) => {
    try {
      // Always store the file message first (even if sending fails)
      try {
        const messageHandler = (whatsappService as any).messageHandler;
        const mediaHandler = (whatsappService as any).mediaHandler;
        if (messageHandler && mediaHandler) {
          const fileName = path.basename(filePath);
          const fileExtension = path.extname(filePath).toLowerCase();
          const mimetype = mediaHandler.getMimeTypeFromExtension(fileExtension);
          messageHandler.storeAgentFileMessage(chatId, fileName, filePath, mimetype, caption);
        }
      } catch (storeError) {
        logger.warn('Could not store agent file message via WhatsAppService:', storeError);
      }
      
      // Try to send via WhatsAppService first
      try {
        const result = await whatsappService.sendFile(chatId, filePath, caption);
        if (result.success) {
          logger.info('WhatsApp file sent via WhatsAppService', { chatId, filePath, hasCaption: !!caption });
          return result;
        }
      } catch (serviceError) {
        logger.warn('WhatsAppService.sendFile failed, trying fallback:', serviceError);
      }
      
      // Fallback: send directly via the forked process if WhatsAppService doesn't have a process
      if (!whatsappProcess) {
        throw new Error('WhatsApp service not initialized');
      }
      whatsappProcess.send({ type: 'send-file', chatId, filePath, caption: caption || '' });
      logger.info('WhatsApp file sent via fallback process', { chatId, filePath, hasCaption: !!caption });
      return { success: true };
    } catch (error: any) {
      logger.error('WhatsApp sendFile error', error);
      throw error;
    }
  }
);

ipcMain.handle('whatsapp:createQuote', async (_event, jobId: string, quoteData: any) => {
  try {
    // This would need to be implemented based on your quote creation logic
    // For now, return a stub response
    logger.info('Quote creation requested via IPC', { jobId, price: quoteData.price });
    return { success: true, paymentLink: undefined };
  } catch (error: any) {
    logger.error('WhatsApp createQuote error', error);
    throw error;
  }
});

ipcMain.handle('whatsapp:downloadMedia', async (_event, _contact: string, messageId: string) => {
  try {
    // This would need to be implemented based on your media download logic
    logger.info('Media download requested via IPC', { contact: _contact, messageId });
    return { success: false, filePath: undefined };
  } catch (error: any) {
    logger.error('WhatsApp downloadMedia error', error);
    throw error;
  }
});

ipcMain.handle('whatsapp:markJobCompleted', async (_event, jobId: string, _options: any) => {
  try {
    // This would need to be implemented based on your job completion logic
    logger.info('Job completion requested via IPC', { jobId });
    return { success: true };
  } catch (error: any) {
    logger.error('WhatsApp markJobCompleted error', error);
    throw error;
  }
});

ipcMain.handle('whatsapp:handlePaymentWebhook', async (_event, paymentData: any) => {
  try {
    // This would need to be implemented based on your payment webhook logic
    logger.info('Payment webhook requested via IPC', { reference: paymentData.reference });
    return { success: true, jobId: undefined };
  } catch (error: any) {
    logger.error('WhatsApp handlePaymentWebhook error', error);
    throw error;
  }
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
        const mainWindow = setupWindows();
        // Initialize system tray after window is created
        if (mainWindow) {
          trayService.initialize(mainWindow);
        }
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
  const settings = storageService.getSettings();
  const minimizeToTray = settings?.minimizeToTray ?? true;

  // On macOS, keep app running even when all windows are closed
  if (process.platform === 'darwin') {
    return;
  }

  // If minimize to tray is enabled, don't quit
  if (minimizeToTray) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.hide();
    }
    return;
  }

  // Otherwise quit
  app.quit();
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

  // Clean up tray
  trayService.destroy();

  dbService.close();
});
