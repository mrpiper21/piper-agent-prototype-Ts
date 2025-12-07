// Typed Electron API wrapper
import type { IpcApi } from '@shared/types/ipc.types';

declare global {
  interface Window {
    electron: IpcApi;
  }
}

// Safely get electron API - check if it exists
if (typeof window !== 'undefined') {
  if (!window.electron) {
    console.error('window.electron is not available. Preload script may not be loaded or needs to be rebuilt.');
  } else {
    const availableKeys = Object.keys(window.electron);
    console.log('[electron.ts] Electron API available. Keys:', availableKeys);
    
    if (!window.electron.whatsapp) {
      console.error('window.electron.whatsapp is not available. Preload script may need to be rebuilt.');
    }
    
    if (!window.electron.dialog) {
      console.warn('[electron.ts] window.electron.dialog is not available. File selection may not work. Please restart the app.');
    } else {
      console.log('[electron.ts] Dialog API is available');
    }
  }
}

export const electronAPI: IpcApi = (typeof window !== 'undefined' && window.electron) 
  ? window.electron 
  : ({} as IpcApi);
