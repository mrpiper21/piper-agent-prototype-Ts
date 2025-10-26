import { contextBridge, ipcRenderer } from 'electron';
import type { IpcApi } from '../shared/types/ipc.types';

const electronAPI: IpcApi = {
  auth: {
    login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
    logout: () => ipcRenderer.invoke('auth:logout'),
    refreshToken: (token) => ipcRenderer.invoke('auth:refresh', token),
  },
  users: {
    getAll: () => ipcRenderer.invoke('users:getAll'),
    getById: (id) => ipcRenderer.invoke('users:getById', id),
    create: (data) => ipcRenderer.invoke('users:create', data),
    update: (id, data) => ipcRenderer.invoke('users:update', id, data),
    delete: (id) => ipcRenderer.invoke('users:delete', id),
  },
  files: {
    save: (path, content) => ipcRenderer.invoke('files:save', path, content),
    read: (path) => ipcRenderer.invoke('files:read', path),
  },
  agent: {
    start: () => ipcRenderer.invoke('agent:start'),
    stop: () => ipcRenderer.invoke('agent:stop'),
    getStatus: () => ipcRenderer.invoke('agent:getStatus'),
    getPrinters: () => ipcRenderer.invoke('agent:getPrinters'),
    discoverPrinters: () => ipcRenderer.invoke('agent:discoverPrinters'),
    printFile: (printerName, filePath, options) => ipcRenderer.invoke('agent:printFile', printerName, filePath, options),
    testPrint: (printerName, filePath) => ipcRenderer.invoke('agent:testPrint', printerName, filePath),
    isRunning: () => ipcRenderer.invoke('agent:isRunning'),
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);
