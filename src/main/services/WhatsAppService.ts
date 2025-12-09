import path from 'path';
import { app } from 'electron';
import { fork, ChildProcess } from 'child_process';
import fs from 'fs-extra';
import { logger } from '../utils/logger';
import { apiService } from './api';
import type { PrintJob } from '../types';
import { getMainWindow } from '../windows/MainWindow';
import { WhatsAppMessageHandler } from './whatsapp/WhatsAppMessageHandler';
import { WhatsAppMediaHandler } from './whatsapp/WhatsAppMediaHandler';
import { WhatsAppQuoteHandler, type QuoteData } from './whatsapp/WhatsAppQuoteHandler';
import { WhatsAppMessageParser } from './whatsapp/WhatsAppMessageParser';

export interface WhatsAppStatus {
  isConnected: boolean;
  isAuthenticated: boolean;
  qrCode?: string;
  error?: string;
  phoneNumber?: string;
}

export class WhatsAppService {
  private whatsappProcess: ChildProcess | null = null;
  private status: WhatsAppStatus = {
    isConnected: false,
    isAuthenticated: false,
  };
  private statusListeners: Array<(status: WhatsAppStatus) => void> = [];
  private isInitializing: boolean = false;

  // Modular handlers
  private messageHandler: WhatsAppMessageHandler;
  private mediaHandler: WhatsAppMediaHandler;
  private quoteHandler: WhatsAppQuoteHandler;

  constructor() {
    // Initialize downloads directory
    let downloadsDir: string;
    try {
      downloadsDir = app.getPath('downloads');
      downloadsDir = path.join(downloadsDir, 'WhatsApp Downloads');
    } catch (error) {
      logger.warn('Could not get Downloads folder, using userData as fallback', error);
      const userDataPath = app.getPath('userData');
      downloadsDir = path.join(userDataPath, 'whatsapp-downloads');
    }

    // Initialize handlers
    this.mediaHandler = new WhatsAppMediaHandler(downloadsDir);
    this.messageHandler = new WhatsAppMessageHandler();
    this.quoteHandler = new WhatsAppQuoteHandler();
  }

  /**
   * Initialize WhatsApp service process
   */
  async initialize(): Promise<void> {
    if (this.whatsappProcess) {
      logger.warn('WhatsApp service already initialized');
      return;
    }

    if (this.isInitializing) {
      logger.warn('WhatsApp service is already initializing');
      return;
    }

    this.isInitializing = true;

    try {
      const isDev = !app.isPackaged;
      let whatsappServicePath: string;

      if (isDev) {
        const projectRoot = path.resolve(__dirname, '../../');
        whatsappServicePath = path.join(projectRoot, 'src/main/whatsapp-service.js');
      } else {
        // In production, the file is unpacked from asar to app.asar.unpacked
        // __dirname is: <resourcesPath>/app.asar/out/main
        // Unpacked files are at: <resourcesPath>/app.asar.unpacked/out/main
        
        // Get resources path - this is where app.asar and app.asar.unpacked are located
        let resourcesPath: string;
        if (process.resourcesPath) {
          resourcesPath = process.resourcesPath;
        } else {
          // Fallback: extract from __dirname
          // __dirname = <resourcesPath>/app.asar/out/main
          // So go up 3 levels to get resourcesPath
          resourcesPath = path.resolve(__dirname, '../../../');
        }
        
        const unpackedPath = path.join(resourcesPath, 'app.asar.unpacked', 'out', 'main', 'whatsapp-service.js');
        
        // Try unpacked path first (where electron-builder puts it)
        if (fs.existsSync(unpackedPath)) {
          whatsappServicePath = unpackedPath;
          logger.info('Using unpacked WhatsApp service file', { path: unpackedPath });
        } else {
          // Fallback: try relative to __dirname (shouldn't happen if unpack worked)
          const asarPath = path.join(__dirname, './whatsapp-service.js');
          if (fs.existsSync(asarPath)) {
            whatsappServicePath = asarPath;
            logger.warn('Using asar path for WhatsApp service (unpack may have failed)', { path: asarPath });
          } else {
            whatsappServicePath = unpackedPath; // Will throw error below with better message
          }
        }
      }

      if (!fs.existsSync(whatsappServicePath)) {
        const unpackedPathAttempt = isDev ? '' : path.join(process.resourcesPath || '', 'app.asar.unpacked', 'out', 'main', 'whatsapp-service.js');
        const asarPathAttempt = isDev ? '' : path.join(__dirname, './whatsapp-service.js');
        const triedPaths = isDev 
          ? `dev: ${whatsappServicePath}`
          : `unpacked: ${unpackedPathAttempt}, asar: ${asarPathAttempt}`;
        throw new Error(`WhatsApp service file not found at: ${whatsappServicePath}. Tried paths: ${triedPaths}`);
      }

      // Verify file is readable
      try {
        const stats = fs.statSync(whatsappServicePath);
        logger.info('WhatsApp service file verified:', {
          path: whatsappServicePath,
          size: stats.size,
          isFile: stats.isFile(),
        });
      } catch (error) {
        logger.error('Failed to stat WhatsApp service file:', error);
        throw new Error(`WhatsApp service file exists but is not accessible: ${whatsappServicePath}`);
      }

      logger.info('Starting WhatsApp service from:', whatsappServicePath);

      // In production, we need to use the Electron executable for fork()
      // process.execPath points to the Electron executable in packaged apps
      const execPath = process.execPath;
      logger.info('Using executable path:', execPath);

      // CRITICAL: Set up node_modules paths for production
      let nodeModulesPath: string;
      let baseDir: string;
      
      if (isDev) {
        // In development, node_modules is in the project root
        const projectRoot = path.resolve(__dirname, '../../');
        nodeModulesPath = path.join(projectRoot, 'node_modules');
        baseDir = projectRoot;
      } else {
        // In production, node_modules should be in app.asar.unpacked
        const resourcesPath = process.resourcesPath || path.resolve(__dirname, '../../../');
        baseDir = path.join(resourcesPath, 'app.asar.unpacked');
        nodeModulesPath = path.join(baseDir, 'node_modules');
        
        logger.info('Production paths:', {
          resourcesPath,
          baseDir,
          nodeModulesPath,
          nodeModulesExists: fs.existsSync(nodeModulesPath),
        });
        
        // Verify critical modules exist
        const whatsappWebPath = path.join(nodeModulesPath, 'whatsapp-web.js');
        const puppeteerPath = path.join(nodeModulesPath, 'puppeteer');
        const puppeteerCorePath = path.join(nodeModulesPath, 'puppeteer-core');
        
        logger.info('Module verification:', {
          whatsappWebExists: fs.existsSync(whatsappWebPath),
          puppeteerExists: fs.existsSync(puppeteerPath),
          puppeteerCoreExists: fs.existsSync(puppeteerCorePath),
        });
        
        if (!fs.existsSync(nodeModulesPath)) {
          logger.error('node_modules not found in unpacked directory!', {
            expectedPath: nodeModulesPath,
            resourcesPath,
          });
        }
      }

      const forkOptions: {
        stdio: Array<'pipe' | 'ipc'>;
        env: NodeJS.ProcessEnv;
        execPath?: string;
        cwd?: string;
      } = {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || 'production',
          USER_DATA_PATH: app.getPath('userData'),
          // CRITICAL: Tell Node where to find modules
          NODE_PATH: nodeModulesPath,
        },
        // Set the working directory to where node_modules is
        cwd: baseDir,
      };

      // Use Electron executable in production
      if (!isDev) {
        forkOptions.execPath = execPath;
        logger.info('Production mode: Using Electron executable');
      }

      logger.info('Fork options:', {
        execPath: forkOptions.execPath || 'default',
        cwd: forkOptions.cwd || 'default',
        nodePath: forkOptions.env.NODE_PATH,
        userDataPath: forkOptions.env.USER_DATA_PATH,
      });

      this.whatsappProcess = fork(whatsappServicePath, [], forkOptions);

      this.whatsappProcess.stdout?.on('data', (data) => {
        logger.info('[WhatsApp Service]:', data.toString().trim());
      });

      this.whatsappProcess.stderr?.on('data', (data) => {
        logger.error('[WhatsApp Service Error]:', data.toString().trim());
      });

      // Wait for process to be ready before sending init
      let processReady = false;
      const processReadyPromise = new Promise<void>((resolve) => {
        const checkReady = () => {
          if (processReady) {
            resolve();
            return;
          }
          if (this.whatsappProcess?.killed) {
            resolve(); // Resolve to continue with error check below
            return;
          }
          setTimeout(checkReady, 100);
        };
        checkReady();
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (!processReady && !this.whatsappProcess?.killed) {
            logger.warn('WhatsApp service process did not send ready message within timeout, proceeding anyway');
            resolve();
          }
        }, 5000);
      });

      // Set up message handler
      this.whatsappProcess.on('message', (msg: unknown) => {
        const message = msg as Record<string, unknown>;
        if (message.type === 'process-ready' && !processReady) {
          processReady = true;
          logger.info('WhatsApp service process confirmed ready');
          // Send init message now that process is ready
          if (this.whatsappProcess && !this.whatsappProcess.killed) {
            this.whatsappProcess.send({
              type: 'init',
              userDataPath: app.getPath('userData'),
            });
            logger.info('WhatsApp service initialization requested');
          }
        }
        this.handleProcessMessage(msg);
      });

      this.whatsappProcess.on('error', (error) => {
        logger.error('WhatsApp process error:', error);
        logger.error('Error details:', {
          message: error.message,
          code: (error as NodeJS.ErrnoException).code,
          errno: (error as NodeJS.ErrnoException).errno,
          syscall: (error as NodeJS.ErrnoException).syscall,
          path: (error as NodeJS.ErrnoException).path,
          stack: error.stack,
        });
        this.updateStatus({
          isConnected: false,
          isAuthenticated: false,
          error: `Failed to start WhatsApp service: ${error.message}`,
        });
        this.whatsappProcess = null;
        this.isInitializing = false;
      });

      this.whatsappProcess.on('exit', (code, signal) => {
        logger.warn(`WhatsApp process exited with code ${code} and signal ${signal}`);
        if (code !== 0 && code !== null) {
          logger.error('WhatsApp process exited with non-zero code. This usually indicates an error.');
          this.updateStatus({
            isConnected: false,
            isAuthenticated: false,
            error: `WhatsApp service process exited with code ${code}. Check logs for details.`,
          });
        } else {
          this.updateStatus({
            isConnected: false,
            isAuthenticated: false,
          });
        }
        this.whatsappProcess = null;
        this.isInitializing = false;
      });

      // Wait for process to be ready
      await processReadyPromise;

      // Verify process is still alive and send init if not already sent
      if (!this.whatsappProcess || this.whatsappProcess.killed) {
        throw new Error('WhatsApp service process died before initialization');
      }

      // If process didn't send ready message, try sending init anyway
      if (!processReady) {
        logger.warn('Sending init message without ready confirmation');
        this.whatsappProcess.send({
          type: 'init',
          userDataPath: app.getPath('userData'),
        });
        logger.info('WhatsApp service initialization requested (fallback)');
      }
    } catch (error) {
      logger.error('Failed to initialize WhatsApp service:', error);
      this.updateStatus({
        isConnected: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : String(error),
      });
      this.isInitializing = false;
      throw error;
    }
  }

  /**
   * Handle messages from the forked WhatsApp process
   */
  private handleProcessMessage(msg: unknown): void {
    const message = msg as Record<string, unknown>;
    logger.info('[WhatsApp Message]:', message.type);

    switch (message.type) {
      case 'qr':
        this.updateStatus({
          isConnected: false,
          isAuthenticated: false,
          qrCode: message.qr as string,
        });
        break;

      case 'authenticated':
        this.updateStatus({
          isConnected: true,
          isAuthenticated: true,
          qrCode: undefined,
        });
        break;

      case 'ready':
        const clientInfo = message.clientInfo as Record<string, unknown> | undefined;
        const phoneNumber = clientInfo
          ? ((clientInfo.phoneNumber as string) || (clientInfo.number as string))
          : undefined;
        
        logger.info('WhatsApp ready event received', {
          hasClientInfo: !!clientInfo,
          phoneNumber,
          clientInfoKeys: clientInfo ? Object.keys(clientInfo) : [],
        });
        
        this.updateStatus({
          isConnected: true,
          isAuthenticated: true,
          qrCode: undefined,
          phoneNumber,
        });
        this.isInitializing = false;
        break;

      case 'initializing':
        this.updateStatus({
          isConnected: false,
          isAuthenticated: false,
        });
        break;

      case 'message':
        this.handleIncomingMessage(message.data as Record<string, unknown>);
        logger.info('[WhatsAppService] Finished handling incoming message');
        break;

      case 'disconnected':
        this.updateStatus({
          isConnected: false,
          isAuthenticated: false,
          error: message.reason ? `Disconnected: ${message.reason}` : undefined,
        });
        this.isInitializing = false;
        break;

      case 'error':
        this.updateStatus({
          isConnected: false,
          isAuthenticated: false,
          error: message.error as string,
        });
        this.isInitializing = false;
        break;

      case 'already-initialized':
        logger.info('WhatsApp service already initialized');
        this.isInitializing = false;
        break;

      case 'process-ready':
        logger.info('WhatsApp service process is ready and waiting for initialization');
        break;

      case 'message-history-fetched': {
        logger.info('Finished fetching message history', {
          messageCount: (message.count as number) || 0,
        });
        const mainWindow = getMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send('whatsapp-message-history-loaded', {
            count: (message.count as number) || 0,
          });
        }
        break;
      }
    }
  }

  /**
   * Handle incoming WhatsApp messages from the forked process
   */
  private async handleIncomingMessage(messageData: unknown): Promise<void> {
    try {
      const validation = WhatsAppMessageParser.validateMessageData(messageData);
      if (!validation.isValid || !validation.data) {
        logger.error(validation.error || 'Invalid message data');
        return;
      }

      const { from, messageId, body, hasMedia, isPrintCommand } = validation.data;
      const messageDataRecord = messageData as Record<string, unknown>;

      logger.info('Received WhatsApp message', {
        from,
        hasMedia,
        body: body.substring(0, 100),
        isPrintCommand,
        messageId,
      });

      // Handle print command
      if (isPrintCommand) {
        logger.info('Received /print command', { contact: from, messageId, hasMedia });
        const description = WhatsAppMessageParser.extractDescriptionFromPrintCommand(body);
        this.mediaHandler.createOrUpdateQuoteRequest(from, description, messageId);
      }

      // Store and display message
      this.messageHandler.storeAndDisplayMessage({
        from,
        contactName: (messageDataRecord.contactName as string) || undefined,
        messageId,
        body,
        timestamp: (messageDataRecord.timestamp as number) || undefined,
        hasMedia,
        media: messageDataRecord.media as
          | {
              mimetype: string;
              filename?: string;
              filePath?: string;
              data?: string;
            }
          | undefined,
        isPrintCommand,
        isHistorical: (messageDataRecord.isHistorical as boolean) || false,
      });

      // Handle print command completion
      if (isPrintCommand) {
        logger.info('Received /print command - displaying message only (no API call)', {
          contact: from,
        });
        return;
      }

      // Handle text-only messages
      if (!hasMedia) {
        await this.handleTextMessage(messageDataRecord);
      }
    } catch (error) {
      logger.error('Error handling incoming WhatsApp message:', error);
    }
  }

  /**
   * Handle text-only messages
   */
  private async handleTextMessage(messageData: Record<string, unknown>): Promise<void> {
    try {
      const contact = messageData.from as string;
      const messageBody = (messageData.body as string) || '';
      const pendingRequest = this.mediaHandler.getPendingQuoteRequest(contact);

      if (pendingRequest && messageBody.trim()) {
        if (pendingRequest.description === 'Print request' || !pendingRequest.description) {
          pendingRequest.description = messageBody.trim();
        } else {
          pendingRequest.description += '\n\n' + messageBody.trim();
        }
        pendingRequest.messageIds.push(messageData.messageId as string);

        setTimeout(() => {
          this.finalizeQuoteRequest(contact);
        }, this.mediaHandler.getQuoteRequestTimeout());

        logger.info('Updated pending quote request description', {
          contact,
          descriptionLength: pendingRequest.description.length,
        });
        return;
      }

      const isPrintCommand = WhatsAppMessageParser.isPrintCommand(
        messageBody,
        messageData.isPrintCommand as boolean | undefined
      );

      if (isPrintCommand) {
        const description = WhatsAppMessageParser.extractDescriptionFromPrintCommand(messageBody);
        this.mediaHandler.createOrUpdateQuoteRequest(
          contact,
          description,
          messageData.messageId as string
        );

        setTimeout(() => {
          this.finalizeQuoteRequest(contact);
        }, this.mediaHandler.getQuoteRequestTimeout());
        return;
      }

      logger.info('Received text message (no media)', {
        from: messageData.from,
        body: messageData.body,
        isPrintCommand,
        hasPendingRequest: !!pendingRequest,
      });
    } catch (error) {
      logger.error('Error handling text message:', error);
    }
  }

  /**
   * Finalize a quote request (currently disabled - local storage only)
   */
  private async finalizeQuoteRequest(contact: string): Promise<void> {
    logger.info('Quote request finalized (local storage only, no API call)', { contact });
    this.mediaHandler.deletePendingQuoteRequest(contact);
  }

  /**
   * Get local messages for a contact
   */
  getLocalMessages(contact: string) {
    return this.messageHandler.getLocalMessages(contact);
  }

  /**
   * Get all local messages grouped by contact
   */
  getAllLocalMessages() {
    return this.messageHandler.getAllLocalMessages();
  }

  /**
   * Get current WhatsApp status
   */
  getStatus(): WhatsAppStatus {
    return { ...this.status };
  }

  /**
   * Subscribe to status updates
   */
  onStatusChange(callback: (status: WhatsAppStatus) => void): () => void {
    this.statusListeners.push(callback);
    return () => {
      const index = this.statusListeners.indexOf(callback);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(status: Partial<WhatsAppStatus>): void {
    // Update status first
    this.status = { ...this.status, ...status };
    
    // Then send the updated status to renderer
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('whatsapp-status', this.status);
    }
    
    // Notify listeners with updated status
    this.statusListeners.forEach((listener) => listener(this.status));
  }

  /**
   * Disconnect WhatsApp service
   */
  async disconnect(): Promise<void> {
    if (this.whatsappProcess) {
      try {
        this.whatsappProcess.send({ type: 'disconnect' });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (this.whatsappProcess && !this.whatsappProcess.killed) {
          this.whatsappProcess.kill();
        }
        this.whatsappProcess = null;
        this.updateStatus({
          isConnected: false,
          isAuthenticated: false,
        });
        logger.info('WhatsApp service disconnected');
      } catch (error) {
        logger.error('Error disconnecting WhatsApp service:', error);
        if (this.whatsappProcess) {
          this.whatsappProcess.kill();
          this.whatsappProcess = null;
        }
      }
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    if (this.whatsappProcess) {
      try {
        this.whatsappProcess.send({ type: 'logout' });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (this.whatsappProcess && !this.whatsappProcess.killed) {
          this.whatsappProcess.kill();
        }
        this.whatsappProcess = null;
        this.updateStatus({
          isConnected: false,
          isAuthenticated: false,
        });
        logger.info('WhatsApp service logged out');
      } catch (error) {
        logger.error('Error logging out WhatsApp service:', error);
        if (this.whatsappProcess) {
          this.whatsappProcess.kill();
          this.whatsappProcess = null;
        }
      }
    }
  }

  /**
   * Send a WhatsApp message
   */
  async sendMessage(chatId: string, text: string): Promise<{ success: boolean }> {
    // Store agent message locally before sending
    this.messageHandler.storeAgentMessage(chatId, text);

    if (!this.whatsappProcess || this.whatsappProcess.killed) {
      logger.warn('WhatsApp service not ready to send message.');
      return { success: false };
    }

    if (!this.status.isAuthenticated) {
      logger.warn('WhatsApp is not authenticated');
      return { success: false };
    }

    try {
      this.whatsappProcess.send({
        type: 'send-message',
        chatId,
        text,
      });
      logger.info('WhatsApp message sent', { chatId, textLength: text.length });
      return { success: true };
    } catch (error) {
      logger.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Send a file to a WhatsApp contact
   */
  async sendFile(
    chatId: string,
    filePath: string,
    caption?: string
  ): Promise<{ success: boolean }> {
    if (!this.whatsappProcess || this.whatsappProcess.killed) {
      logger.warn('WhatsApp service not ready to send file.');
      return { success: false };
    }

    if (!this.status.isAuthenticated) {
      logger.warn('WhatsApp is not authenticated');
      return { success: false };
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();
      const mimetype = this.mediaHandler.getMimeTypeFromExtension(fileExtension);

      // Store agent file message locally
      this.messageHandler.storeAgentFileMessage(chatId, fileName, filePath, mimetype, caption);

      this.whatsappProcess.send({
        type: 'send-file',
        chatId,
        filePath,
        caption: caption || '',
      });
      logger.info('WhatsApp file sent', { chatId, filePath, fileName, hasCaption: !!caption });
      return { success: true };
    } catch (error) {
      logger.error('Error sending WhatsApp file:', error);
      throw error;
    }
  }

  /**
   * Create a quote and send payment link to client
   */
  async createQuote(
    jobId: string,
    quoteData: QuoteData
  ): Promise<{ success: boolean; paymentLink?: string }> {
    return this.quoteHandler.createQuote(jobId, quoteData, (contact, message) =>
      this.sendMessage(contact, message)
    );
  }

  /**
   * Mark job as completed and notify client
   */
  async markJobCompleted(
    jobId: string,
    options: {
      contact: string;
      customMessage?: string;
    }
  ): Promise<{ success: boolean }> {
    try {
      const job = await apiService.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      await apiService.updateJob(jobId, {
        status: 'completed',
        metadata: {
          ...job.metadata,
          conversationStatus: 'completed',
        } as PrintJob['metadata'],
      });

      const completionMessage =
        options.customMessage ||
        `✅ *Your order is ready!*\n\n` +
          `Job ID: ${job.printJobId}\n` +
          (job.fileName ? `File: ${job.fileName}\n` : '') +
          (job.description ? `Description: ${job.description}\n` : '') +
          `\nYour print job has been completed. Please contact us to arrange pickup or delivery! 📦`;

      await this.sendMessage(options.contact, completionMessage);

      logger.info('Job marked as completed and client notified', {
        jobId: job.printJobId,
        contact: options.contact,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error marking job as completed:', error);
      throw error;
    }
  }

  /**
   * Handle payment webhook from Paystack
   */
  async handlePaymentWebhook(paymentData: {
    reference: string;
    status: string;
    amount: number;
    customer: { email: string };
  }): Promise<{ success: boolean; jobId?: string }> {
    try {
      const referenceMatch = paymentData.reference.match(/^WHATSAPP-(.+?)-(\d+)$/);
      if (!referenceMatch) {
        logger.warn('Invalid payment reference format', { reference: paymentData.reference });
        return { success: false };
      }

      const printJobId = referenceMatch[1];
      const jobs = await apiService.getJobs(1000);
      const job = jobs.find((j: unknown) => {
        const jRecord = j as Record<string, unknown>;
        return jRecord.printJobId === printJobId;
      });

      if (!job) {
        logger.warn('Job not found for payment reference', {
          printJobId,
          reference: paymentData.reference,
        });
        return { success: false };
      }

      const { paystackService } = await import('./PaystackService');
      const verification = await paystackService.verifyPayment(paymentData.reference);

      if (!verification.status || paymentData.status !== 'success') {
        logger.warn('Payment verification failed or payment not successful', {
          reference: paymentData.reference,
          status: paymentData.status,
        });
        return { success: false };
      }

      const jobRecord = job as any
      await apiService.updateJob(jobRecord.id || (jobRecord._id as string), {
        status: 'payment_received',
        metadata: {
          ...(jobRecord.metadata as Record<string, unknown>),
          conversationStatus: 'payment_received',
          paymentVerified: true,
          paymentReference: paymentData.reference,
          paymentAmount: paymentData.amount,
        } as PrintJob['metadata'],
      });

      const contact = (jobRecord.metadata as Record<string, unknown>)?.whatsappContact as string | undefined;
      if (contact) {
        await this.sendMessage(
          contact,
          `✅ *Payment received!*\n\nWe've confirmed your payment of GHC ${paymentData.amount.toFixed(2)}. We'll start processing your order now! 🚀\n\nJob ID: ${printJobId}`
        );
      }

      logger.info('Payment webhook processed successfully', {
        jobId: jobRecord.printJobId as string,
        reference: paymentData.reference,
        amount: paymentData.amount,
      });

      return { success: true, jobId: jobRecord.id || (jobRecord._id as string) };
    } catch (error) {
      logger.error('Error handling payment webhook:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();

// Re-export types for backward compatibility
export type { WhatsAppJobDetails } from './whatsapp/WhatsAppMessageParser';
export type { QuoteData } from './whatsapp/WhatsAppQuoteHandler';
