/**
 * Electron Storage Adapter
 * Replaces localStorage with electron-store for better desktop app experience
 * Falls back to localStorage if electron API is not available (dev mode)
 */

class ElectronStorage {
  private isElectron(): boolean {
    return typeof window !== 'undefined' && window.electron?.storage !== undefined;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isElectron()) {
        const value = await window.electron.storage.get(key);
        return value !== null && value !== undefined ? JSON.stringify(value) : null;
      } else {
        // Fallback to localStorage in dev mode
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error('Storage getItem error:', error);
      // Fallback to localStorage
      return localStorage.getItem(key);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isElectron()) {
        const parsedValue = value ? JSON.parse(value) : value;
        await window.electron.storage.set(key, parsedValue);
      } else {
        // Fallback to localStorage in dev mode
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Storage setItem error:', error);
      // Fallback to localStorage
      localStorage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.isElectron()) {
        await window.electron.storage.delete(key);
      } else {
        // Fallback to localStorage in dev mode
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Storage removeItem error:', error);
      // Fallback to localStorage
      localStorage.removeItem(key);
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.isElectron()) {
        await window.electron.storage.clear();
      } else {
        // Fallback to localStorage in dev mode
        localStorage.clear();
      }
    } catch (error) {
      console.error('Storage clear error:', error);
      // Fallback to localStorage
      localStorage.clear();
    }
  }
}

export const electronStorage = new ElectronStorage();

// Create a localStorage-like interface for easy migration
export const storage = {
  getItem: (key: string): Promise<string | null> => electronStorage.getItem(key),
  setItem: (key: string, value: string): Promise<void> => electronStorage.setItem(key, value),
  removeItem: (key: string): Promise<void> => electronStorage.removeItem(key),
  clear: (): Promise<void> => electronStorage.clear(),
};

