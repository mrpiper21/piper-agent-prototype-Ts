import path from 'path';
import fs from 'fs-extra';
import { app, Notification } from 'electron';
import { fork, ChildProcess } from 'child_process';
import { logger } from '../utils/logger';
import { apiService, PAYMENT_LINK_BASE_URL } from './api';
import type { PrintJob } from '../types';
// import { v4 as uuidv4 } from 'uuid';
import { getMainWindow } from '../windows/MainWindow';

export interface WhatsAppJobDetails {
  fileName?: string;
  printerName?: string;
  copies?: number;
  colorMode?: 'color' | 'grayscale' | 'black-white';
  orientation?: 'portrait' | 'landscape';
  paperSize?: string;
  duplex?: boolean;
  notes?: string;
}

export interface WhatsAppStatus {
  isConnected: boolean;
  isAuthenticated: boolean;
  qrCode?: string;
  error?: string;
  phoneNumber?: string;
}

interface PendingQuoteRequest {
  contact: string;
  description: string;
  files: Array<{
    filePath: string;
    fileName: string;
    fileType: string;
    messageId: string;
  }>;
  timestamp: number;
  messageIds: string[];
}

interface LocalMessage {
  contact: string;
  contactName: string;
  messageId: string;
  body: string;
  timestamp: number;
  hasMedia: boolean;
  media?: {
    mimetype: string;
    filename: string;
    filePath?: string;
    mediaData?: string; // Base64 data for downloading on demand
  };
  isPrintCommand: boolean;
  from?: 'client' | 'agent'; // Track message sender
}

export class WhatsAppService {
  private whatsappProcess: ChildProcess | null = null;
  private status: WhatsAppStatus = {
    isConnected: false,
    isAuthenticated: false,
  };
  private statusListeners: Array<(status: WhatsAppStatus) => void> = [];
  private downloadsDir: string;
  private isInitializing: boolean = false;
  private pendingQuoteRequests: Map<string, PendingQuoteRequest> = new Map();
  private readonly QUOTE_REQUEST_TIMEOUT = 5 * 60 * 1000;
  // Store messages locally without API calls
  private localMessages: Map<string, LocalMessage[]> = new Map();

  constructor() {
    // Use user's Downloads folder instead of app data directory
    try {
      this.downloadsDir = app.getPath('downloads');
      // Create a subfolder for WhatsApp downloads to keep them organized
      this.downloadsDir = path.join(this.downloadsDir, 'WhatsApp Downloads');
      this.ensureDownloadsDir();
    } catch (error) {
      // Fallback to userData if downloads path is not available
      logger.warn('Could not get Downloads folder, using userData as fallback', error);
    const userDataPath = app.getPath('userData');
    this.downloadsDir = path.join(userDataPath, 'whatsapp-downloads');
    this.ensureDownloadsDir();
    }
  }

  private ensureDownloadsDir(): void {
    try {
      if (!fs.existsSync(this.downloadsDir)) {
        fs.mkdirSync(this.downloadsDir, { recursive: true });
        logger.info(`Created WhatsApp downloads directory: ${this.downloadsDir}`);
      }
    } catch (error) {
      logger.error('Failed to create WhatsApp downloads directory:', error);
    }
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
      // Determine the path to whatsapp-service.js
      // Use absolute paths to avoid issues with __dirname in compiled output
      const isDev = !app.isPackaged;
      let whatsappServicePath: string;
      
      if (isDev) {
        // In development, use the source file directly
        // __dirname in dev is out/main, so go up to project root then to src/main
        const projectRoot = path.resolve(__dirname, '../../');
        whatsappServicePath = path.join(projectRoot, 'src/main/whatsapp-service.js');
      } else {
        // In production, use the copied file in out/main
        whatsappServicePath = path.join(__dirname, './whatsapp-service.js');
      }
      
      // Verify the file exists
      if (!fs.existsSync(whatsappServicePath)) {
        throw new Error(`WhatsApp service file not found at: ${whatsappServicePath}`);
      }

      logger.info('Starting WhatsApp service from:', whatsappServicePath);

      // Fork the WhatsApp service process
      this.whatsappProcess = fork(whatsappServicePath, [], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        env: { 
          ...process.env, 
          NODE_ENV: process.env.NODE_ENV,
          USER_DATA_PATH: app.getPath('userData'),
        },
      });

      // Handle stdout
      this.whatsappProcess.stdout?.on('data', (data) => {
        logger.info('[WhatsApp Service]:', data.toString().trim());
      });

      this.whatsappProcess.stderr?.on('data', (data) => {
        logger.error('[WhatsApp Service Error]:', data.toString().trim());
      });

      this.whatsappProcess.on('message', (msg: any) => {
        this.handleProcessMessage(msg);
      });

      // Handle process errors
      this.whatsappProcess.on('error', (error) => {
        logger.error('WhatsApp process error:', error);
        this.updateStatus({
          isConnected: false,
          isAuthenticated: false,
          error: error.message,
        });
        this.whatsappProcess = null;
        this.isInitializing = false;
      });

      // Handle process exit
      this.whatsappProcess.on('exit', (code, signal) => {
        logger.info(`WhatsApp process exited with code ${code} and signal ${signal}`);
        this.whatsappProcess = null;
        this.isInitializing = false;
        this.updateStatus({
          isConnected: false,
          isAuthenticated: false,
        });
      });

      // Give the process a moment to start
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send initialization message
      if (this.whatsappProcess && !this.whatsappProcess.killed) {
        this.whatsappProcess.send({
          type: 'init',
          userDataPath: app.getPath('userData'),
        });
        logger.info('WhatsApp service initialization requested');
      } else {
        throw new Error('Failed to start WhatsApp service process');
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

  private handleProcessMessage(msg: any): void {
    logger.info('[WhatsApp Message]:', msg.type);

    switch (msg.type) {
      case 'qr':
        this.updateStatus({
          isConnected: false,
          isAuthenticated: false,
          qrCode: msg.qr,
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
        this.updateStatus({
          isConnected: true,
          isAuthenticated: true,
          qrCode: undefined,
          phoneNumber: msg.clientInfo?.phoneNumber || msg.clientInfo?.number,
        });
        this.isInitializing = false;
        logger.info('WhatsApp client is ready and authenticated');
        break;

      case 'initializing':
        this.updateStatus({
          isConnected: false,
          isAuthenticated: false,
        });
        break;

      case 'message':
        logger.info('[WhatsAppService] Received message from WhatsApp process', {
          from: msg.data?.from,
          hasBody: !!msg.data?.body,
          bodyPreview: msg.data?.body?.substring(0, 50),
          isPrintCommand: msg.data?.isPrintCommand,
          messageId: msg.data?.messageId,
          isHistorical: msg.data?.isHistorical,
        });
        this.handleIncomingMessage(msg.data);
        logger.info('[WhatsAppService] Finished handling incoming message');
        break;

      case 'disconnected':
        this.updateStatus({
          isConnected: false,
          isAuthenticated: false,
          error: msg.reason ? `Disconnected: ${msg.reason}` : undefined,
        });
        this.isInitializing = false;
        break;

      case 'error':
        this.updateStatus({
          isConnected: false,
          isAuthenticated: false,
          error: msg.error,
        });
        this.isInitializing = false;
        break;

      case 'already-initialized':
        logger.info('WhatsApp service already initialized');
        this.isInitializing = false;
        break;

      case 'message-history-fetched': {
        logger.info('Finished fetching message history', {
          messageCount: msg.count || 0,
        });
        // Notify renderer to refresh local messages
        const mainWindow = getMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send('whatsapp-message-history-loaded', {
            count: msg.count || 0,
          });
        }
        break;
      }
    }
  }


  /**
   * Store message locally and send to renderer for display
   */
  private storeAndDisplayMessage(messageData: any): void {
    try {
      const contact = messageData.from;
      const contactName = messageData.contactName || contact.split('@')[0];
      const isHistorical = messageData.isHistorical || false;

      if (this.localMessages.has(contact)) {
        const existingMessages = this.localMessages.get(contact)!;
        const alreadyExists = existingMessages.some(
          msg => msg.messageId === messageData.messageId
        );
        if (alreadyExists) {
          logger.info('Message already stored, skipping duplicate', {
            contact,
            messageId: messageData.messageId,
          });
          return;
        }
      }
      
      // Ensure timestamp is in milliseconds
      let timestamp = messageData.timestamp || Date.now();
      if (timestamp && timestamp < 1000000000000) {
        // If timestamp is in seconds (less than year 2001 in ms), convert to milliseconds
        timestamp = timestamp * 1000;
      }
      
      const localMessage: LocalMessage = {
        contact,
        contactName,
        messageId: messageData.messageId,
        body: messageData.body || '',
        timestamp: timestamp,
        hasMedia: messageData.hasMedia || false,
        isPrintCommand: messageData.isPrintCommand || false,
        from: 'client', // All incoming messages are from client
      };

      if (messageData.media) {
        localMessage.media = {
          mimetype: messageData.media.mimetype,
          filename: messageData.media.filename || 'file',
          filePath: messageData.media.filePath, // Will be undefined until user downloads
          mediaData: messageData.media.data, // Store base64 data for later download
        };
      }

      // Store message in local map
      if (!this.localMessages.has(contact)) {
        this.localMessages.set(contact, []);
      }
      this.localMessages.get(contact)!.push(localMessage);

      // Send notification to renderer
      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('whatsapp-message', {
          contact,
          contactName,
          message: localMessage,
        });
        // Only log for non-historical messages to reduce noise
        if (!isHistorical) {
          logger.info('[WhatsAppService] Sent new message to renderer', {
            contact,
            messageId: localMessage.messageId,
          });
        }
      } else {
        logger.warn('[WhatsAppService] Main window not available, cannot send message to renderer');
      }

      // Only send desktop notification for new messages (not historical ones)
      if (!isHistorical) {
        new Notification({
          title: `New WhatsApp Message 📱`,
          body: `${contactName}: ${localMessage.body.substring(0, 50)}${localMessage.body.length > 50 ? '...' : ''}`,
          silent: false,
        }).show();
      }

      // Only log for non-historical messages to reduce noise
      if (!isHistorical) {
        logger.info('Stored and displayed message locally', {
          contact,
          contactName,
          messageId: localMessage.messageId,
        });
      }
    } catch (error) {
      logger.error('Error storing/displaying message:', error);
    }
  }

  /**
   * Handle incoming WhatsApp messages from the forked process
   */
  private async handleIncomingMessage(messageData: any): Promise<void> {
    try {
      if (!messageData) {
        logger.error('Received null or undefined message data');
        return;
      }

      if (!messageData.from) {
        logger.error('Received message without from field', { messageData });
        return;
      }

      logger.info('Received WhatsApp message', {
        from: messageData.from,
        hasMedia: messageData.hasMedia,
        body: messageData.body?.substring(0, 100),
        isPrintCommand: messageData.isPrintCommand,
        messageId: messageData.messageId,
      });

      const contact = messageData.from;
      const messageBody = messageData.body || '';
      // Check if message starts with /print (case insensitive, allows text after)
      const isPrintCommand = messageData.isPrintCommand || messageBody.trim().toLowerCase().startsWith('/print');

      // If this is a /print command, create/update pending request FIRST
      // This ensures handleMediaMessage can add files to the request
      if (isPrintCommand) {
        logger.info('Received /print command', { contact, messageId: messageData.messageId, hasMedia: messageData.hasMedia });
        
        const existingRequest = this.pendingQuoteRequests.get(contact);
        const description = messageBody.replace(/\/print/gi, '').trim() || 'Print request';
        
        if (existingRequest) {
          // Update existing request with new description if provided
          if (description && description !== 'Print request') {
            existingRequest.description = description;
          }
          existingRequest.messageIds.push(messageData.messageId);
        } else {
          // Create new quote request
        this.pendingQuoteRequests.set(contact, {
          contact,
            description: description,
          files: [],
          timestamp: Date.now(),
          messageIds: [messageData.messageId],
        });
        }
      }

      // Store message locally and send to renderer
      // Media files will NOT be downloaded automatically - user must click to download
      // The media data (base64) is stored but filePath will be undefined until user downloads
      this.storeAndDisplayMessage(messageData);

      // Handle /print command completion
      if (isPrintCommand) {
        // Don't create API job - just display the message
        logger.info('Received /print command - displaying message only (no API call)', { contact });
        return;
      }

      // For non-/print messages with media, file is already downloaded above
      if (!messageData.hasMedia) {
        // Text-only message - could be a job request or inquiry
        await this.handleTextMessage(messageData);
      }
    } catch (error) {
      logger.error('Error handling incoming WhatsApp message:', error);
    }
  }

  /**
   * Handle media messages (files)
   */
  private async handleMediaMessage(messageData: any): Promise<void> {
    try {
      if (!messageData.media) {
        logger.warn('Media message received but no media data available');
        return;
      }

      const contact = messageData.from;
      const pendingRequest = this.pendingQuoteRequests.get(contact);

      const fileExtension = this.getFileExtensionFromMimeType(messageData.media.mimetype);
      const timestamp = Date.now();
      const fileName = messageData.media.filename || `whatsapp-file-${timestamp}${fileExtension}`;
      const filePath = path.join(this.downloadsDir, `${timestamp}-${fileName}`);

      // Save file
      const buffer = Buffer.from(messageData.media.data, 'base64');
      await fs.writeFile(filePath, buffer);
      logger.info(`Downloaded WhatsApp file: ${fileName}`, { filePath });
      
      // Add filePath to messageData.media so it's available when storing the message
      messageData.media.filePath = filePath;

      if (pendingRequest) {
        pendingRequest.files.push({
          filePath,
          fileName,
          fileType: fileExtension,
          messageId: messageData.messageId,
        });
        pendingRequest.messageIds.push(messageData.messageId);

        if (messageData.body && messageData.body.trim()) {
          if (pendingRequest.description === 'Print request' || !pendingRequest.description) {
            pendingRequest.description = messageData.body.trim();
          } else {
            pendingRequest.description += '\n\n' + messageData.body.trim();
          }
        }

        logger.info('Added file to pending quote request', {
          contact,
          fileName,
          totalFiles: pendingRequest.files.length,
        });

        // Reset timeout - wait for more files
        setTimeout(() => {
          this.finalizeQuoteRequest(contact);
        }, this.QUOTE_REQUEST_TIMEOUT);
      } else {
        // No pending request - media message is already stored via storeAndDisplayMessage
        // No API calls needed
        logger.info('Media message received without pending request (local storage only)', {
          contact,
          fileName,
        });
      }
    } catch (error) {
      logger.error('Error handling media message:', error);
    }
  }

  /**
   * Update a stored message with filePath after file is downloaded
   */
  private updateStoredMessageWithFilePath(contact: string, messageId: string, filePath: string): void {
    try {
      const messages = this.localMessages.get(contact);
      if (messages) {
        const message = messages.find(msg => msg.messageId === messageId);
        if (message && message.media) {
          message.media.filePath = filePath;
          logger.info('Updated stored message with filePath', { contact, messageId, filePath });
          
          // Notify renderer of the update
          const mainWindow = getMainWindow();
          if (mainWindow) {
            mainWindow.webContents.send('whatsapp-message', {
              contact,
              contactName: message.contactName,
              message: message,
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error updating stored message with filePath:', error);
    }
  }

  /**
   * Get local messages for a contact
   */
  getLocalMessages(contact: string): LocalMessage[] {
    return this.localMessages.get(contact) || [];
  }

  /**
   * Get all local messages grouped by contact
   */
  getAllLocalMessages(): Map<string, LocalMessage[]> {
    return new Map(this.localMessages);
  }

  /**
   * Finalize a quote request by creating a job with all collected files
   * NOTE: Currently disabled - messages are stored locally only
   */
  private async finalizeQuoteRequest(contact: string): Promise<void> {
    // Skip API calls - messages are already stored and displayed locally
    logger.info('Quote request finalized (local storage only, no API call)', { contact });
    return;
    
    /* DISABLED - API calls removed
    const pendingRequest = this.pendingQuoteRequests.get(contact);
    if (!pendingRequest) {
      return;
    }

    // Remove from pending requests
    this.pendingQuoteRequests.delete(contact);

    try {
      // Check if we already have a job for this contact
      const existingJobs = await apiService.getJobs(1000);
      const existingJob = existingJobs.find(
        (job: any) =>
          job.metadata?.whatsappContact === contact &&
          (job.status === 'needs_quote' || job.status === 'quote_sent' || job.status === 'awaiting_payment')
      );

      if (existingJob) {
        logger.info('Quote request job already exists, updating with new files', {
          jobId: existingJob.printJobId,
          contact,
          newFilesCount: pendingRequest.files.length,
        });

        // Update existing job with new files
        const existingFiles = (existingJob.metadata as PrintJob['metadata'])?.attachedFiles || [];
        const updatedFiles = [
          ...existingFiles,
          ...pendingRequest.files.map((f) => ({
            filePath: f.filePath,
            fileName: f.fileName,
            fileType: f.fileType,
            messageId: f.messageId,
          })),
        ];

        await apiService.updateJob((existingJob.id || existingJob._id) as string, {
          description: pendingRequest.description || existingJob.description,
          metadata: {
            ...(existingJob.metadata as PrintJob['metadata']),
            attachedFiles: updatedFiles,
            notes: pendingRequest.description,
            conversationStatus: 'needs_quote',
          },
        });

        return;
      }

      // Create new job with multiple files
      const contactName = pendingRequest.contact.split('@')[0];
      const metadata: Record<string, unknown> = {
        whatsappContact: contact,
        whatsappMessageId: pendingRequest.messageIds[0],
        notes: pendingRequest.description,
        conversationStatus: 'needs_quote',
        attachedFiles: pendingRequest.files.map((f) => ({
          filePath: f.filePath,
          fileName: f.fileName,
          fileType: f.fileType,
          messageId: f.messageId,
        })),
      };

      // Use first file as primary file for job (for compatibility)
      const primaryFile = pendingRequest.files[0];
      const job: Omit<PrintJob, 'id' | '_id' | 'submittedAt'> = {
        printJobId: uuidv4(),
        fileName: pendingRequest.files.length > 1
          ? `${pendingRequest.files.length} files - ${contactName}`
          : primaryFile?.fileName || `WhatsApp Order - ${contactName}`,
        filePath: primaryFile?.filePath || '',
        fileType: primaryFile?.fileType || 'text',
        printerName: 'default',
        status: 'needs_quote',
        description: pendingRequest.description,
        metadata: metadata as PrintJob['metadata'],
      };

      const createdJob = await apiService.createJob(job);
      logger.info('Created quote request job with multiple files', {
        jobId: createdJob.printJobId,
        contact,
        fileCount: pendingRequest.files.length,
        description: pendingRequest.description.substring(0, 100),
      });

      // Send desktop notification to agent
      const fileCount = pendingRequest.files.length;
      new Notification({
        title: 'New Quote Request 📋',
        body: `${contactName} sent ${fileCount} file${fileCount > 1 ? 's' : ''}${pendingRequest.description ? ': ' + pendingRequest.description.substring(0, 50) + (pendingRequest.description.length > 50 ? '...' : '') : ''}`,
        silent: false,
      }).show();

      // Notify renderer about the new job
      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('whatsapp:newJob', {
          job: createdJob,
          type: 'quote_request',
        });
      }
    } catch (error) {
      logger.error('Error finalizing quote request:', error);
    }
    */
  }

  /**
   * Handle text-only messages
   */
  private async handleTextMessage(messageData: any): Promise<void> {
    try {
      const contact = messageData.from;
      const messageBody = messageData.body || '';
      const pendingRequest = this.pendingQuoteRequests.get(contact);

      // If there's a pending quote request, update description
      if (pendingRequest && messageBody.trim()) {
        if (pendingRequest.description === 'Print request' || !pendingRequest.description) {
          pendingRequest.description = messageBody.trim();
        } else {
          pendingRequest.description += '\n\n' + messageBody.trim();
        }
        pendingRequest.messageIds.push(messageData.messageId);
        
        // Reset timeout - wait for more files or finalize
        setTimeout(() => {
          this.finalizeQuoteRequest(contact);
        }, this.QUOTE_REQUEST_TIMEOUT);

        logger.info('Updated pending quote request description', {
          contact,
          descriptionLength: pendingRequest.description.length,
        });
        return;
      }

      // Check if this is a /print command (shouldn't happen here, but handle it)
      const isPrintCommand = messageData.isPrintCommand || messageBody.trim().toLowerCase().startsWith('/print');
      if (isPrintCommand) {
        // This should have been handled in handleIncomingMessage, but handle it here too
        this.pendingQuoteRequests.set(contact, {
          contact,
          description: messageBody.replace(/\/print/gi, '').trim() || 'Print request',
          files: [],
          timestamp: Date.now(),
          messageIds: [messageData.messageId],
        });
        
        setTimeout(() => {
          this.finalizeQuoteRequest(contact);
        }, this.QUOTE_REQUEST_TIMEOUT);
        return;
      }
      
      // Messages are already stored and displayed via storeAndDisplayMessage
      // No API calls needed - just log the message
      
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
   * Create a job with "needs_quote" status for quote requests
   * NOTE: Currently disabled - messages are stored locally only
   */
  private async createQuoteRequestJob(messageData: any): Promise<void> {
    // Skip API calls - messages are already stored and displayed locally
    logger.info('Quote request received (local storage only, no API call)', {
      contact: messageData.from,
      messageId: messageData.messageId,
    });
    // Messages are already stored and displayed via storeAndDisplayMessage
  }

  /**
   * Parse job details from message text
   * Supports formats like:
   * - "Print: filename.pdf, Printer: HP LaserJet, Copies: 2"
   * - "Printer: Canon, Copies: 1, Color: grayscale"
   */
  private parseJobDetails(messageText: string): WhatsAppJobDetails {
    const details: WhatsAppJobDetails = {};

    // Extract printer name
    const printerMatch = messageText.match(/printer[:\s]+([^,\n]+)/i);
    if (printerMatch) {
      details.printerName = printerMatch[1].trim();
    }

    // Extract copies
    const copiesMatch = messageText.match(/copies[:\s]+(\d+)/i);
    if (copiesMatch) {
      details.copies = parseInt(copiesMatch[1], 10);
    }

    // Extract color mode
    const colorMatch = messageText.match(/color[:\s]+(color|grayscale|black-white|bw|black and white)/i);
    if (colorMatch) {
      const colorMode = colorMatch[1].toLowerCase();
      if (colorMode === 'bw' || colorMode === 'black and white') {
        details.colorMode = 'black-white';
      } else if (colorMode === 'grayscale') {
        details.colorMode = 'grayscale';
      } else {
        details.colorMode = 'color';
      }
    }

    // Extract orientation
    const orientationMatch = messageText.match(/orientation[:\s]+(portrait|landscape)/i);
    if (orientationMatch) {
      details.orientation = orientationMatch[1].toLowerCase() as 'portrait' | 'landscape';
    }

    // Extract paper size
    const paperSizeMatch = messageText.match(/paper[:\s]+(A4|A3|Letter|Legal)/i);
    if (paperSizeMatch) {
      details.paperSize = paperSizeMatch[1];
    }

    // Extract duplex
    const duplexMatch = messageText.match(/duplex[:\s]+(yes|no|true|false)/i);
    if (duplexMatch) {
      details.duplex = ['yes', 'true'].includes(duplexMatch[1].toLowerCase());
    }

    // Extract filename (if mentioned)
    const fileNameMatch = messageText.match(/filename[:\s]+([^,\n]+)/i);
    if (fileNameMatch) {
      details.fileName = fileNameMatch[1].trim();
    }

    // Extract notes (everything else)
    details.notes = messageText;

    return details;
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'text/plain': '.txt',
    };

    return mimeMap[mimeType] || '.bin';
  }

  /**
   * Create a print job from WhatsApp message
   */
  private async createJobFromWhatsApp(data: {
    filePath: string;
    fileName: string;
    fileType: string;
    jobDetails: WhatsAppJobDetails;
    contact: string;
    messageId: string;
  }): Promise<void> {
    try {
      // Skip API call - messages are stored locally only
      logger.info('Media message received (local storage only, no API call)', {
        fileName: data.fileName,
        contact: data.contact,
      });

      // Messages are already stored and displayed via storeAndDisplayMessage
        } catch (error) {
      logger.error('Failed to handle media message:', error);
    }
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
    // Return unsubscribe function
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
    // Send status update to renderer
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('whatsapp-status', this.status);
    }
    this.status = { ...this.status, ...status };
    this.statusListeners.forEach((listener) => listener(this.status));
  }

  /**
   * Disconnect WhatsApp service
   */
  async disconnect(): Promise<void> {
    if (this.whatsappProcess) {
      try {
        this.whatsappProcess.send({ type: 'disconnect' });
        // Give it a moment to disconnect gracefully
        await new Promise(resolve => setTimeout(resolve, 1000));
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
        // Give it a moment to logout gracefully
        await new Promise(resolve => setTimeout(resolve, 1000));
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
  /**
   * Store agent message locally (before sending to WhatsApp)
   */
  private storeAgentMessage(chatId: string, text: string): void {
    try {
      const timestamp = Date.now();
      const messageId = `agent-${chatId}-${timestamp}`;

      const agentMessage: LocalMessage = {
        contact: chatId,
        contactName: 'You', // Agent messages show as "You"
        messageId: messageId,
        body: text,
        timestamp: timestamp,
        hasMedia: false,
        isPrintCommand: false,
        from: 'agent', // Mark as agent message
      };

      // Store message in local map
      if (!this.localMessages.has(chatId)) {
        this.localMessages.set(chatId, []);
      }
      this.localMessages.get(chatId)!.push(agentMessage);

      // Send notification to renderer
      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('whatsapp-message', {
          contact: chatId,
          contactName: 'You',
          message: agentMessage,
        });
        logger.info('[WhatsAppService] Stored and sent agent message to renderer', {
          contact: chatId,
          messageId: agentMessage.messageId,
        });
      }
    } catch (error) {
      logger.error('Error storing agent message:', error);
    }
  }

  async sendMessage(chatId: string, text: string): Promise<{ success: boolean }> {
    // Store agent message locally before sending
    this.storeAgentMessage(chatId, text);
    
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
  async sendFile(chatId: string, filePath: string, caption?: string): Promise<{ success: boolean }> {
    if (!this.whatsappProcess || this.whatsappProcess.killed) {
      logger.warn('WhatsApp service not ready to send file.');
      return { success: false };
    }

    if (!this.status.isAuthenticated) {
      logger.warn('WhatsApp is not authenticated');
      return { success: false };
    }

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
      // Store agent message locally (as a file message)
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();
      
      // Determine MIME type from extension
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.mkv': 'video/x-matroska',
      };
      const mimetype = mimeTypes[fileExtension] || 'application/octet-stream';
      
      // Store file message with media info
      const timestamp = Date.now();
      const messageId = `agent-file-${chatId}-${timestamp}`;
      
      const agentFileMessage: LocalMessage = {
        contact: chatId,
        contactName: 'You',
        messageId: messageId,
        body: caption || `📎 ${fileName}`,
        timestamp: timestamp,
        hasMedia: true,
        isPrintCommand: false,
        from: 'agent',
        media: {
          mimetype: mimetype,
          filename: fileName,
          filePath: filePath, // File is already on disk, so we can reference it
        },
      };

      // Store message in local map
      if (!this.localMessages.has(chatId)) {
        this.localMessages.set(chatId, []);
      }
      this.localMessages.get(chatId)!.push(agentFileMessage);

      // Send notification to renderer
      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('whatsapp-message', {
          contact: chatId,
          contactName: 'You',
          message: agentFileMessage,
        });
        logger.info('[WhatsAppService] Stored and sent agent file message to renderer', {
          contact: chatId,
          messageId: agentFileMessage.messageId,
          fileName,
        });
      }

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
    quoteData: {
      orderDescription: string;
      quantity?: string;
      specifications: string;
      price: number;
      internalNotes?: string;
      contact: string;
      email: string;
    }
  ): Promise<{ success: boolean; paymentLink?: string }> {
    try {
      let adminId: string = '';
      let categoryId: string = '';
      
      // Get current user (admin/clerk) ID from token
      // The backend will use this to determine the admin
      // Client will be created/updated when they make payment
      try {
        const currentUser = await apiService.getProfile();
        adminId = (currentUser as any).id || (currentUser as any)._id || '';
        if (!adminId) {
          throw new Error('User ID not found. Please ensure you are logged in.');
        }
        logger.info('Retrieved user ID from profile', { adminId });
      } catch (profileError: any) {
        logger.error('Error getting user profile for quote creation', profileError);
        throw new Error(`Failed to get user profile: ${profileError.message || 'Unknown error'}. Please ensure you are logged in.`);
      }

      // Check if this is an API job (valid MongoDB ObjectId) to try getting categoryId from it
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(String(jobId).trim());
      if (isValidObjectId) {
        try {
          logger.info('Fetching API job for categoryId', { jobId });
          const job = await apiService.getJob(jobId);
          if (job) {
            const jobAny = job as any;
            // Extract categoryId from job if available
            const extractId = (obj: any): string => {
              if (!obj) return '';
              if (typeof obj === 'string') return obj;
              if (obj._id) return String(obj._id);
              if (obj.id) return String(obj.id);
              if (obj.toString) return String(obj.toString());
              return '';
            };
            const jobCategoryId = extractId(jobAny.categoryId);
            if (jobCategoryId && jobCategoryId.trim()) {
              categoryId = jobCategoryId.trim();
              logger.info('Using categoryId from job', { categoryId });
            }
          }
        } catch (jobError: any) {
          logger.warn('Could not fetch job for categoryId, will use first available category', {
            error: jobError.message,
          });
        }
      }

      // Get first available category for this admin if not already set
      if (!categoryId || categoryId.trim() === '') {
        try {
          const categories = await apiService.getCategories(adminId);
          if (categories.length === 0) {
            throw new Error('No categories found. Please create a category first.');
          }
          categoryId = (categories[0] as any).id || (categories[0] as any)._id || '';
          logger.info('Using first available category', { categoryId, categoryName: (categories[0] as any).name });
        } catch (categoryError: any) {
          logger.error('Error getting categories', categoryError);
          throw new Error(`Failed to get categories: ${categoryError.message || 'Unknown error'}`);
        }
      }

      // Validate all required fields before creating quote
      if (!adminId || adminId.trim() === '') {
        throw new Error('Admin ID is required but was not found or is empty');
      }
      if (!categoryId || categoryId.trim() === '') {
        throw new Error('Category ID is required but was not found or is empty');
      }
      if (!quoteData.specifications || quoteData.specifications.trim() === '') {
        throw new Error('Specifications are required');
      }
      if (!quoteData.price || isNaN(quoteData.price) || quoteData.price <= 0) {
        throw new Error(`Invalid price: ${quoteData.price}. Price must be a positive number.`);
      }

      // Create print job with quote data via the new endpoint
      // Note: clientId is not required - client will be created/updated when they make payment
      const quotePayload = {
        adminId: adminId.trim(),
        categoryId: categoryId.trim(),
        orderDescription: quoteData.orderDescription || 'Print order',
        quantity: quoteData.quantity,
        specifications: quoteData.specifications.trim(),
        totalPrice: Number(quoteData.price), // Ensure it's a number
        internalNotes: quoteData.internalNotes,
      };

      logger.info('Creating quote with payload:', {
        ...quotePayload,
        totalPrice: quotePayload.totalPrice,
        totalPriceType: typeof quotePayload.totalPrice,
        adminIdLength: adminId.length,
        categoryIdLength: categoryId.length,
        specificationsLength: quotePayload.specifications.length,
      });

      const createdQuote = await apiService.createQuote(quotePayload);

      const quoteJobId = createdQuote.id;

      // Build quote confirmation link with job ID
      const quoteConfirmationLink = `${PAYMENT_LINK_BASE_URL}/quote/confirm?jobId=${quoteJobId}`;

      // Update original WhatsApp job with quote information (only if it's an API job)
      const isJobValidObjectId = /^[0-9a-fA-F]{24}$/.test(String(jobId).trim());
      if (isJobValidObjectId) {
        const job = await apiService.getJob(jobId);
        if (job) {
          const jobAny = job as any;
      const updatedMetadata = {
            ...(jobAny.metadata || {}),
        orderDescription: quoteData.orderDescription,
        specifications: quoteData.specifications,
        quantity: quoteData.quantity,
        total: quoteData.price,
            paymentLink: quoteConfirmationLink,
            quoteJobId: quoteJobId,
        internalNotes: quoteData.internalNotes,
        conversationStatus: 'quote_sent',
      };

      await apiService.updateJob(jobId, {
        status: 'quote_sent',
        description: quoteData.orderDescription,
        metadata: updatedMetadata as PrintJob['metadata'],
      });
        }
      } else {
        // For local conversations, update the local message store
        // The conversation status will be updated when the UI refreshes
        logger.info('Quote created for local conversation - status will update on next refresh', {
          jobId,
          quoteJobId,
        });
      }

      // Format and send WhatsApp message to client
      const whatsappMessage = `📋 *Your Print Order Quote*\n\n` +
        `*Order Description:*\n${quoteData.orderDescription}\n\n` +
        (quoteData.quantity ? `*Quantity:* ${quoteData.quantity}\n\n` : '') +
        `*Specifications:*\n${quoteData.specifications}\n\n` +
        `*Total Price:* GHC ${quoteData.price.toFixed(2)}\n\n` +
        `💳 *Payment Link:*\n${quoteConfirmationLink}\n\n` +
        `Please click the link above to review and confirm your payment. Once payment is confirmed, we'll start processing your order! 🚀`;

      await this.sendMessage(quoteData.contact, whatsappMessage);

      logger.info('Quote created and sent to client', {
        originalJobId: jobId,
        quoteJobId: quoteJobId,
        contact: quoteData.contact,
        price: quoteData.price,
        quoteLink: quoteConfirmationLink,
      });

      return { success: true, paymentLink: quoteConfirmationLink };
    } catch (error) {
      logger.error('Error creating quote:', error);
      throw error;
    }
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
      // Get the job
      const job = await apiService.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Update job status
      await apiService.updateJob(jobId, {
        status: 'completed',
        metadata: {
          ...job.metadata,
          conversationStatus: 'completed',
        } as PrintJob['metadata'],
      });

      // Format completion message
      const completionMessage = options.customMessage ||
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
      // Extract job ID from payment reference
      // Format: WHATSAPP-{printJobId}-{timestamp}
      const referenceMatch = paymentData.reference.match(/^WHATSAPP-(.+?)-(\d+)$/);
      if (!referenceMatch) {
        logger.warn('Invalid payment reference format', { reference: paymentData.reference });
        return { success: false };
      }

      const printJobId = referenceMatch[1];

      // Find the job by printJobId
      const jobs = await apiService.getJobs(1000);
      const job = jobs.find((j: any) => j.printJobId === printJobId);

      if (!job) {
        logger.warn('Job not found for payment reference', { printJobId, reference: paymentData.reference });
        return { success: false };
      }

      // Verify payment with Paystack
      const { paystackService } = await import('./PaystackService');
      const verification = await paystackService.verifyPayment(paymentData.reference);

      if (!verification.status || paymentData.status !== 'success') {
        logger.warn('Payment verification failed or payment not successful', {
          reference: paymentData.reference,
          status: paymentData.status,
        });
        return { success: false };
      }

      // Update job status to payment_received
      await apiService.updateJob(job.id || job._id as string, {
        status: 'payment_received',
        metadata: {
          ...job.metadata,
          conversationStatus: 'payment_received',
          paymentVerified: true,
          paymentReference: paymentData.reference,
          paymentAmount: paymentData.amount,
        } as PrintJob['metadata'],
      });

      // Send confirmation message to client
      const contact = (job.metadata as PrintJob['metadata'])?.whatsappContact;
      if (contact) {
        await this.sendMessage(
          contact,
          `✅ *Payment received!*\n\nWe've confirmed your payment of GHC ${paymentData.amount.toFixed(2)}. We'll start processing your order now! 🚀\n\nJob ID: ${printJobId}`
        );
      }

      logger.info('Payment webhook processed successfully', {
        jobId: job.printJobId,
        reference: paymentData.reference,
        amount: paymentData.amount,
      });

      return { success: true, jobId: job.id || job._id };
    } catch (error) {
      logger.error('Error handling payment webhook:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();

