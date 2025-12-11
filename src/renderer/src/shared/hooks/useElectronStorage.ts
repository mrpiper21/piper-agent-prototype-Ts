import { useState, useEffect, useCallback } from 'react';
import { electronStorage } from '../utils/electronStorage';

/**
 * React hook for electron storage (replaces useLocalStorage)
 * Provides async storage with electron-store backend
 */
export function useElectronStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial value
  useEffect(() => {
    let isMounted = true;

    electronStorage.getItem(key).then((item) => {
      if (!isMounted) return;

      if (item) {
        try {
          const parsed = JSON.parse(item) as T;
          setStoredValue(parsed);
        } catch (error) {
          console.error('Error parsing stored value:', error);
          setStoredValue(initialValue);
        }
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [key, initialValue]);

  const setValue = useCallback(
    async (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        await electronStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error('Error saving to storage:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue, isLoading] as const;
}

