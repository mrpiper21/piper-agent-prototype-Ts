import { logger } from '../utils/logger';
import { storageService } from './StorageService';

/**
 * Message queue service for offline message handling
 * Queues messages when offline and sends them when connection is restored
 */
interface QueuedMessage {
  id: string;
  chatId: string;
  text?: string;
  filePath?: string;
  caption?: string;
  timestamp: number;
  retries: number;
}

class MessageQueueService {
  private queue: QueuedMessage[] = [];
  private maxRetries = 3;
  private isProcessing = false;

  constructor() {
    this.loadQueue();
  }

  private loadQueue(): void {
    try {
      const stored = storageService.getCache('messageQueue');
      if (Array.isArray(stored)) {
        this.queue = stored;
        logger.info(`Loaded ${this.queue.length} queued messages`);
      }
    } catch (error) {
      logger.error('Error loading message queue:', error);
    }
  }

  private saveQueue(): void {
    try {
      storageService.setCache('messageQueue', this.queue);
    } catch (error) {
      logger.error('Error saving message queue:', error);
    }
  }

  /**
   * Add message to queue
   */
  enqueue(chatId: string, text?: string, filePath?: string, caption?: string): string {
    const message: QueuedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      text,
      filePath,
      caption,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(message);
    this.saveQueue();
    logger.info('Message queued', { id: message.id, chatId });

    return message.id;
  }

  /**
   * Process queued messages
   */
  async processQueue(sendHandler: (message: QueuedMessage) => Promise<boolean>): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    logger.info(`Processing ${this.queue.length} queued messages`);

    const failed: QueuedMessage[] = [];

    for (const message of this.queue) {
      try {
        const success = await sendHandler(message);
        if (!success) {
          message.retries++;
          if (message.retries < this.maxRetries) {
            failed.push(message);
          } else {
            logger.warn('Message exceeded max retries, removing from queue', { id: message.id });
          }
        }
      } catch (error) {
        logger.error('Error processing queued message:', error);
        message.retries++;
        if (message.retries < this.maxRetries) {
          failed.push(message);
        }
      }
    }

    this.queue = failed;
    this.saveQueue();
    this.isProcessing = false;

    if (failed.length > 0) {
      logger.warn(`${failed.length} messages failed and will be retried`);
    }
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
    this.saveQueue();
    logger.info('Message queue cleared');
  }

  /**
   * Get queue status
   */
  getStatus(): { count: number; oldest: number | null } {
    return {
      count: this.queue.length,
      oldest: this.queue.length > 0 ? Math.min(...this.queue.map((m) => m.timestamp)) : null,
    };
  }
}

export const messageQueueService = new MessageQueueService();

