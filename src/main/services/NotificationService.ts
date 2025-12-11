import { Notification, app } from 'electron';
import { logger } from '../utils/logger';
import { storageService } from './StorageService';

/**
 * Native notification service
 */
class NotificationService {
  private isSupported(): boolean {
    return Notification.isSupported();
  }

  show(title: string, body: string, options?: { silent?: boolean; onClick?: () => void }): void {
    if (!this.isSupported()) {
      logger.warn('Notifications not supported on this platform');
      return;
    }

    const settings = storageService.getSettings();
    if (settings?.notifications === false) {
      return; // User has disabled notifications
    }

    try {
      const notification = new Notification({
        title: app.getName(),
        body: `${title}\n${body}`,
        silent: options?.silent ?? false,
        urgency: 'normal',
      });

      if (options?.onClick) {
        notification.on('click', options.onClick);
      }

      notification.show();
      logger.info('Notification shown:', title);
    } catch (error) {
      logger.error('Failed to show notification:', error);
    }
  }

  showWhatsAppMessage(contactName: string, message: string, onClick?: () => void): void {
    this.show(`New message from ${contactName}`, message.substring(0, 100), {
      onClick,
    });
  }

  showUpdateAvailable(version: string, onClick?: () => void): void {
    this.show('Update Available', `Version ${version} is available`, {
      onClick,
    });
  }
}

export const notificationService = new NotificationService();

