import Store from 'electron-store';
import { logger } from '../utils/logger';

/**
 * Persistent storage service using electron-store
 * Replaces localStorage for better desktop app experience
 */
class StorageService {
  private store: Store;

  constructor() {
    this.store = new Store({
      name: 'app-storage',
      defaults: {
        auth: {
          token: null,
          user: null,
        },
        settings: {
          theme: 'light',
          autoLaunch: false,
          minimizeToTray: true,
          notifications: true,
        },
        businessInfo: null,
        whatsapp: {
          conversations: [],
          lastSync: null,
        },
        cache: {},
      },
    });

    logger.info('StorageService initialized');
  }

  // Auth storage
  getAuthToken(): string | null {
    return this.store.get('auth.token') as string | null;
  }

  setAuthToken(token: string | null): void {
    this.store.set('auth.token', token);
  }

  getAuthUser(): any {
    return this.store.get('auth.user');
  }

  setAuthUser(user: any): void {
    this.store.set('auth.user', user);
  }

  clearAuth(): void {
    this.store.delete('auth');
  }

  // Settings storage
  getSettings(): any {
    return this.store.get('settings');
  }

  updateSettings(updates: Partial<any>): void {
    const current = this.getSettings();
    this.store.set('settings', { ...current, ...updates });
  }

  // Business info cache
  getBusinessInfo(): any {
    return this.store.get('businessInfo');
  }

  setBusinessInfo(info: any): void {
    this.store.set('businessInfo', info);
  }

  clearBusinessInfo(): void {
    this.store.delete('businessInfo');
  }

  // WhatsApp storage
  getWhatsAppConversations(): any[] {
    return (this.store.get('whatsapp.conversations') as any[]) || [];
  }

  setWhatsAppConversations(conversations: any[]): void {
    this.store.set('whatsapp.conversations', conversations);
    this.store.set('whatsapp.lastSync', Date.now());
  }

  // Generic cache
  getCache(key: string): any {
    return this.store.get(`cache.${key}`);
  }

  setCache(key: string, value: any): void {
    this.store.set(`cache.${key}`, value);
  }

  clearCache(key?: string): void {
    if (key) {
      this.store.delete(`cache.${key}`);
    } else {
      this.store.delete('cache');
    }
  }

  // Clear all data
  clearAll(): void {
    this.store.clear();
    logger.info('All storage cleared');
  }

  // Delete a key from storage
  delete(key: string): void {
    this.store.delete(key);
  }

  // Get store instance for advanced usage
  getStore(): Store {
    return this.store;
  }
}

export const storageService = new StorageService();

