import path from 'path';
import fs from 'fs-extra';
import { logger } from '../../utils/logger';

export interface PendingQuoteRequest {
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

export class WhatsAppMediaHandler {
  private downloadsDir: string;
  private pendingQuoteRequests: Map<string, PendingQuoteRequest> = new Map();
  private readonly QUOTE_REQUEST_TIMEOUT = 5 * 60 * 1000;

  constructor(downloadsDir: string) {
    this.downloadsDir = downloadsDir;
    this.ensureDownloadsDir();
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
   * Get file extension from MIME type
   */
  getFileExtensionFromMimeType(mimeType: string): string {
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
   * Download and save media file
   */
  async downloadMediaFile(
    mediaData: {
      data: string; // Base64
      mimetype: string;
      filename?: string;
    },
    messageId: string
  ): Promise<string> {
    const fileExtension = this.getFileExtensionFromMimeType(mediaData.mimetype);
    const timestamp = Date.now();
    const fileName = mediaData.filename || `whatsapp-file-${timestamp}${fileExtension}`;
    const filePath = path.join(this.downloadsDir, `${timestamp}-${fileName}`);

    // Save file
    const buffer = Buffer.from(mediaData.data, 'base64');
    await fs.writeFile(filePath, buffer);
    logger.info(`Downloaded WhatsApp file: ${fileName}`, { filePath });

    return filePath;
  }

  /**
   * Get MIME type from file extension
   */
  getMimeTypeFromExtension(fileExtension: string): string {
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
    return mimeTypes[fileExtension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Create or update pending quote request
   */
  createOrUpdateQuoteRequest(
    contact: string,
    description: string,
    messageId: string
  ): void {
    const existingRequest = this.pendingQuoteRequests.get(contact);
    
    if (existingRequest) {
      if (description && description !== 'Print request') {
        existingRequest.description = description;
      }
      existingRequest.messageIds.push(messageId);
    } else {
      this.pendingQuoteRequests.set(contact, {
        contact,
        description: description,
        files: [],
        timestamp: Date.now(),
        messageIds: [messageId],
      });
    }
  }

  /**
   * Add file to pending quote request
   */
  addFileToQuoteRequest(
    contact: string,
    filePath: string,
    fileName: string,
    fileType: string,
    messageId: string,
    body?: string
  ): void {
    const pendingRequest = this.pendingQuoteRequests.get(contact);
    if (!pendingRequest) {
      return;
    }

    pendingRequest.files.push({
      filePath,
      fileName,
      fileType,
      messageId,
    });
    pendingRequest.messageIds.push(messageId);

    if (body && body.trim()) {
      if (pendingRequest.description === 'Print request' || !pendingRequest.description) {
        pendingRequest.description = body.trim();
      } else {
        pendingRequest.description += '\n\n' + body.trim();
      }
    }

    logger.info('Added file to pending quote request', {
      contact,
      fileName,
      totalFiles: pendingRequest.files.length,
    });
  }

  /**
   * Get pending quote request
   */
  getPendingQuoteRequest(contact: string): PendingQuoteRequest | undefined {
    return this.pendingQuoteRequests.get(contact);
  }

  /**
   * Delete pending quote request
   */
  deletePendingQuoteRequest(contact: string): void {
    this.pendingQuoteRequests.delete(contact);
  }

  /**
   * Get quote request timeout
   */
  getQuoteRequestTimeout(): number {
    return this.QUOTE_REQUEST_TIMEOUT;
  }
}

