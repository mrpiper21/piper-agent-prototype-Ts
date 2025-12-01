import { contextBridge, ipcRenderer } from 'electron';
import type { IpcApi } from '../shared/types/ipc.types';

const electronAPI: IpcApi = {
  auth: {
    login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
    logout: () => ipcRenderer.invoke('auth:logout'),
    refreshToken: (token) => ipcRenderer.invoke('auth:refresh', token),
    updateProfile: (updates) => ipcRenderer.invoke('auth:updateProfile', updates),
  },
  users: {
    getAll: () => ipcRenderer.invoke('users:getAll'),
    getById: (id) => ipcRenderer.invoke('users:getById', id),
    create: (data) => ipcRenderer.invoke('users:create', data),
    update: (id, data) => ipcRenderer.invoke('users:update', id, data),
    updateLocation: (id, location) => ipcRenderer.invoke('users:updateLocation', id, location),
    delete: (id) => ipcRenderer.invoke('users:delete', id),
  },
  adminManagement: {
    createClerk: (data) => ipcRenderer.invoke('adminManagement:createClerk', data),
    getMyClerks: (adminId: string) => ipcRenderer.invoke('adminManagement:getMyClerks', adminId),
    changeClerkPassword: (clerkId: string, newPassword: string) =>
      ipcRenderer.invoke('adminManagement:changeClerkPassword', clerkId, newPassword),
  },
  files: {
    save: (path, content) => ipcRenderer.invoke('files:save', path, content),
    read: (path) => ipcRenderer.invoke('files:read', path),
    upload: (filePath) => ipcRenderer.invoke('files:upload', filePath),
    fetch: (fileUrl, headers) => ipcRenderer.invoke('files:fetch', fileUrl, headers),
  },
  agent: {
    start: () => ipcRenderer.invoke('agent:start'),
    stop: () => ipcRenderer.invoke('agent:stop'),
    getStatus: () => ipcRenderer.invoke('agent:getStatus'),
    getPrinters: () => ipcRenderer.invoke('agent:getPrinters'),
    discoverPrinters: () => ipcRenderer.invoke('agent:discoverPrinters'),
    printFile: (printerName, filePath, options) =>
      ipcRenderer.invoke('agent:printFile', printerName, filePath, options),
    testPrint: (printerName, filePath) =>
      ipcRenderer.invoke('agent:testPrint', printerName, filePath),
    isRunning: () => ipcRenderer.invoke('agent:isRunning'),
  },
  logs: {
    getLogs: (agentId?: string) => ipcRenderer.invoke('logs:getLogs', agentId),
    getLogsByDateRange: (startDate: string, endDate: string) =>
      ipcRenderer.invoke('logs:getLogsByDateRange', startDate, endDate),
  },
  jobs: {
    getAll: () => ipcRenderer.invoke('jobs:getAll'),
    getById: (id: string) => ipcRenderer.invoke('jobs:getById', id),
    create: (job: any) => ipcRenderer.invoke('jobs:create', job),
    update: (id: string, updates: any) => ipcRenderer.invoke('jobs:update', id, updates),
    submitToPrinter: (jobId: string, agentId: string) =>
      ipcRenderer.invoke('jobs:submitToPrinter', jobId, agentId),
  },
  agents: {
    getAll: () => ipcRenderer.invoke('agents:getAll'),
    getById: (id: string) => ipcRenderer.invoke('agents:getById', id),
    updateStatus: (id: string, status: string) =>
      ipcRenderer.invoke('agents:updateStatus', id, status),
  },
  analytics: {
    getData: (dateRange?: { start: string; end: string }) =>
      ipcRenderer.invoke('analytics:getData', dateRange),
    getComparison: () => ipcRenderer.invoke('analytics:getComparison'),
  },
  dashboard: {
    getStats: (date?: string) => ipcRenderer.invoke('dashboard:getStats', date),
    getWeeklyActivity: () => ipcRenderer.invoke('dashboard:getWeeklyActivity'),
    getJobsByDate: (date: string) => ipcRenderer.invoke('dashboard:getJobsByDate', date),
  },
  health: {
    check: () => ipcRenderer.invoke('health:check'),
  },
  location: {
    getCurrentPosition: () => ipcRenderer.invoke('location:getCurrentPosition'),
  },
  categories: {
    getAll: (adminId: string) => ipcRenderer.invoke('categories:getAll', adminId),
    create: (data) => ipcRenderer.invoke('categories:create', data),
    update: (id: string, data) => ipcRenderer.invoke('categories:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('categories:delete', id),
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);
