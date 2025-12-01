/**
 * Cache utility for business information during setup flow
 * Stores business info temporarily until location is set and everything is saved
 */

const CACHE_KEY = 'business-info-cache';

export interface WorkingHour {
  day: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface BusinessInfoCache {
  businessName: string;
  businessPhone: string;
  businessCoverImagePath?: string | null;
  businessCoverImageUrl?: string | null;
  websiteUrl?: string;
  workingHours?: WorkingHour[];
}

export const businessInfoCache = {
  /**
   * Save business info to cache
   */
  save: (info: BusinessInfoCache): void => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(info));
      console.log('[BusinessInfoCache] Saved business info to cache:', info);
    } catch (error) {
      console.error('[BusinessInfoCache] Error saving to cache:', error);
    }
  },

  /**
   * Get business info from cache
   */
  get: (): BusinessInfoCache | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as BusinessInfoCache;
        console.log('[BusinessInfoCache] Retrieved business info from cache:', parsed);
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('[BusinessInfoCache] Error reading from cache:', error);
      return null;
    }
  },

  /**
   * Clear business info cache
   */
  clear: (): void => {
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('[BusinessInfoCache] Cleared business info cache');
    } catch (error) {
      console.error('[BusinessInfoCache] Error clearing cache:', error);
    }
  },

  /**
   * Check if cache exists
   */
  exists: (): boolean => {
    return localStorage.getItem(CACHE_KEY) !== null;
  },
};

