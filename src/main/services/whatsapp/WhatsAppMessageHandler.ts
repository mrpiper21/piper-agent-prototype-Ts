import { Notification } from 'electron';
import { logger } from '../../utils/logger';
import { getMainWindow } from '../../windows/MainWindow';

export interface LocalMessage {
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

export class WhatsAppMessageHandler {
  private localMessages: Map<string, LocalMessage[]> = new Map();

  /**
   * Store message locally and send to renderer for display
   */
  storeAndDisplayMessage(messageData: {
    from: string;
    contactName?: string;
    messageId: string;
    body?: string;
    timestamp?: number;
    hasMedia?: boolean;
    media?: {
      mimetype: string;
      filename?: string;
      filePath?: string;
      data?: string;
    };
    isPrintCommand?: boolean;
    isHistorical?: boolean;
  }): void {
    try {
      const contact = messageData.from;
      const contactName = messageData.contactName || contact.split('@')[0];
      const isHistorical = messageData.isHistorical || false;

      // Check for duplicates - check by messageId first (fastest), then by body+timestamp (for WhatsApp echo)
      if (this.localMessages.has(contact)) {
        const existingMessages = this.localMessages.get(contact)!;
        
        // First check: exact messageId match
        const existsById = existingMessages.some(
          msg => msg.messageId === messageData.messageId
        );
        if (existsById) {
          logger.info('Message already stored (by ID), skipping duplicate', {
            contact,
            messageId: messageData.messageId,
          });
          return;
        }
        
        // Second check: same body and timestamp within 5 seconds (handles WhatsApp echo)
        // Normalize timestamp for comparison
        let timestamp = messageData.timestamp || Date.now();
        if (timestamp && timestamp < 1000000000000) {
          timestamp = timestamp * 1000;
        }
        const body = (messageData.body || '').trim();
        if (body) {
          const existsByContent = existingMessages.some(msg => {
            const msgTimestamp = msg.timestamp || 0;
            const timeDiff = Math.abs(timestamp - msgTimestamp);
            const sameBody = (msg.body || '').trim() === body;
            // If same body and timestamp within 5 seconds, consider it a duplicate
            return sameBody && timeDiff < 5000;
          });
          if (existsByContent) {
            logger.info('Message already stored (by content), skipping duplicate', {
              contact,
              messageId: messageData.messageId,
              body: body.substring(0, 50),
            });
            return;
          }
        }
      }
      
      // Normalize timestamp
      let timestamp = messageData.timestamp || Date.now();
      if (timestamp && timestamp < 1000000000000) {
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
        from: 'client',
      };

      if (messageData.media) {
        localMessage.media = {
          mimetype: messageData.media.mimetype,
          filename: messageData.media.filename || 'file',
          filePath: messageData.media.filePath,
          mediaData: messageData.media.data,
        };
      }

      // Store message in local map
      if (!this.localMessages.has(contact)) {
        this.localMessages.set(contact, []);
      }
      this.localMessages.get(contact)!.push(localMessage);

      // Send notification to renderer FIRST to ensure UI updates and sound play before notification
      this.sendToRenderer(contact, contactName, localMessage, isHistorical);

      // Send desktop notification with delay
      if (!isHistorical) {
        this.sendDesktopNotification(contactName, localMessage);
      }

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
   * Store agent message locally (before sending to WhatsApp)
   */
  storeAgentMessage(chatId: string, text: string): void {
    try {
      const timestamp = Date.now();
      const messageId = `agent-${chatId}-${timestamp}`;

      const agentMessage: LocalMessage = {
        contact: chatId,
        contactName: 'You',
        messageId: messageId,
        body: text,
        timestamp: timestamp,
        hasMedia: false,
        isPrintCommand: false,
        from: 'agent',
      };

      if (!this.localMessages.has(chatId)) {
        this.localMessages.set(chatId, []);
      }
      this.localMessages.get(chatId)!.push(agentMessage);

      this.sendToRenderer(chatId, 'You', agentMessage, false);
      
      logger.info('[WhatsAppMessageHandler] Stored and sent agent message to renderer', {
        contact: chatId,
        messageId: agentMessage.messageId,
      });
    } catch (error) {
      logger.error('Error storing agent message:', error);
    }
  }

  /**
   * Store agent file message
   */
  storeAgentFileMessage(
    chatId: string,
    fileName: string,
    filePath: string,
    mimetype: string,
    caption?: string
  ): void {
    try {
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
          filePath: filePath,
        },
      };

      if (!this.localMessages.has(chatId)) {
        this.localMessages.set(chatId, []);
      }
      this.localMessages.get(chatId)!.push(agentFileMessage);

      this.sendToRenderer(chatId, 'You', agentFileMessage, false);
      
      logger.info('[WhatsAppMessageHandler] Stored and sent agent file message to renderer', {
        contact: chatId,
        messageId: agentFileMessage.messageId,
        fileName,
      });
    } catch (error) {
      logger.error('Error storing agent file message:', error);
    }
  }

  /**
   * Update stored message with filePath after file is downloaded
   */
  updateStoredMessageWithFilePath(contact: string, messageId: string, filePath: string): void {
    try {
      const messages = this.localMessages.get(contact);
      if (messages) {
        const message = messages.find(msg => msg.messageId === messageId);
        if (message && message.media) {
          message.media.filePath = filePath;
          logger.info('Updated stored message with filePath', { contact, messageId, filePath });
          
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
   * Send message to renderer process
   */
  private sendToRenderer(
    contact: string,
    contactName: string,
    message: LocalMessage,
    isHistorical: boolean
  ): void {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('whatsapp-message', {
        contact,
        contactName,
        message,
      });
      if (!isHistorical) {
        logger.info('[WhatsAppMessageHandler] Sent new message to renderer', {
          contact,
          messageId: message.messageId,
        });
      }
    } else {
      logger.warn('[WhatsAppMessageHandler] Main window not available, cannot send message to renderer');
    }
  }

  /**
   * Send desktop notification with delay to allow UI updates first
   */
  private sendDesktopNotification(contactName: string, message: LocalMessage): void {
    // Delay notification to allow renderer to update UI, play sound, and reorder list first
    setTimeout(() => {
      new Notification({
        title: `New WhatsApp Message 📱`,
        body: `${contactName}: ${message.body.substring(0, 50)}${message.body.length > 50 ? '...' : ''}`,
        silent: false,
      }).show();
    }, 200); // 200ms delay to ensure UI updates and sound play first
  }
}

