import { contextBridge, ipcRenderer } from 'electron';
import type { IpcApi, WhatsAppStatus } from '../shared/types/ipc.types';

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
    getMyClerks: (adminId: string) => {
      return ipcRenderer.invoke('adminManagement:getMyClerks', adminId);
    },
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
    getStats: (date?: string, month?: string, year?: string) =>
      ipcRenderer.invoke('dashboard:getStats', date, month, year),
    getWeeklyActivity: (month?: string, year?: string) =>
      ipcRenderer.invoke('dashboard:getWeeklyActivity', month, year),
    getJobsByDate: (date: string) => ipcRenderer.invoke('dashboard:getJobsByDate', date),
    getCategoryAnalytics: (days?: number) =>
      ipcRenderer.invoke('dashboard:getCategoryAnalytics', days),
    getPaymentAnalytics: (days?: number) =>
      ipcRenderer.invoke('dashboard:getPaymentAnalytics', days),
    getComprehensiveReport: (startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('dashboard:getComprehensiveReport', startDate, endDate),
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
  whatsapp: {
    initialize: () => ipcRenderer.invoke('whatsapp:initialize'),
    getStatus: () => ipcRenderer.invoke('whatsapp:getStatus'),
    disconnect: () => ipcRenderer.invoke('whatsapp:disconnect'),
    logout: () => ipcRenderer.invoke('whatsapp:logout'),
    getLocalMessages: () => ipcRenderer.invoke('whatsapp:getLocalMessages'),
    sendMessage: (chatId: string, text: string) =>
      ipcRenderer.invoke('whatsapp:sendMessage', chatId, text),
    sendFile: (chatId: string, filePath: string, caption?: string) =>
      ipcRenderer.invoke('whatsapp:sendFile', chatId, filePath, caption),
    createQuote: (jobId: string, quoteData: any) =>
      ipcRenderer.invoke('whatsapp:createQuote', jobId, quoteData),
    downloadMedia: (contact: string, messageId: string) =>
      ipcRenderer.invoke('whatsapp:downloadMedia', contact, messageId),
    markJobCompleted: (jobId: string, options: any) =>
      ipcRenderer.invoke('whatsapp:markJobCompleted', jobId, options),
    handlePaymentWebhook: (paymentData: any) =>
      ipcRenderer.invoke('whatsapp:handlePaymentWebhook', paymentData),
    onQR: (callback: (qr: string) => void) => {
      ipcRenderer.on('whatsapp-qr', (_event, qr: string) => callback(qr));
      return () => ipcRenderer.removeAllListeners('whatsapp-qr');
    },
    onStatus: (callback: (status: WhatsAppStatus) => void) => {
      ipcRenderer.on('whatsapp-status', (_event, status: WhatsAppStatus) => callback(status));
      return () => ipcRenderer.removeAllListeners('whatsapp-status');
    },
    onMessage: (callback: (message: any) => void) => {
      ipcRenderer.on('whatsapp-message', (_event, message: any) => callback(message));
      return () => ipcRenderer.removeAllListeners('whatsapp-message');
    },
    onError: (callback: (error: string) => void) => {
      ipcRenderer.on('whatsapp-error', (_event, error: string) => callback(error));
      return () => ipcRenderer.removeAllListeners('whatsapp-error');
    },
    onHistoryLoaded: (callback: (data: { count: number }) => void) => {
      ipcRenderer.on('whatsapp-message-history-loaded', (_event, data: { count: number }) => callback(data));
      return () => ipcRenderer.removeAllListeners('whatsapp-message-history-loaded');
    },
  },
  shell: {
    openPath: (filePath: string) => ipcRenderer.invoke('shell:openPath', filePath),
    showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
  },
  dialog: {
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:showOpenDialog', options),
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);
