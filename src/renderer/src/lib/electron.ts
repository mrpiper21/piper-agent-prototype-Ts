// Typed Electron API wrapper
import type { IpcApi } from '@shared/types/ipc.types';

declare global {
  interface Window {
    electron: IpcApi;
  }
}

export const electronAPI = window.electron;
