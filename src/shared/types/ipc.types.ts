// IPC Types - shared between main and renderer

export interface WorkingHour {
  day: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'clerk';
  permissions: string[];
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  businessName?: string;
  businessPhone?: string;
  businessCoverImage?: string;
  websiteUrl?: string;
  workingHours?: WorkingHour[];
  isActive?: boolean;
  isTemporaryPassword?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  role?: 'admin' | 'clerk';
}
export interface createClerkData {
  name: string;
  email: string;
  password: string;
  permissions: string[];
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'admin' | 'clerk';
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  businessName?: string;
  businessPhone?: string;
  businessCoverImage?: string;
  websiteUrl?: string;
  workingHours?: WorkingHour[];
  isActive?: boolean;
}

// Agent types
export interface PrinterInfo {
  printerName: string;
  displayName?: string;
  status: 'online' | 'offline' | 'error' | 'busy';
  location?: string;
  manufacturer?: string;
  model?: string;
}

export interface AgentStatus {
  status: 'initializing' | 'online' | 'offline' | 'printing' | 'error';
  isRunning: boolean;
  printerCount: number;
  jobsProcessed: number;
  lastPoll: Date | null;
  uptime: number;
}

export interface PrintOptions {
  copies?: number;
  colorMode?: 'color' | 'grayscale' | 'black-white';
  orientation?: 'portrait' | 'landscape';
  paperSize?: string;
  duplex?: boolean;
}

export type CategoryType =
  | 'wassce_result'
  | 'bece_result'
  | 'novdec_result'
  | 'large_format'
  | 'regular_format';

export type RegularFormatProperties = 'front_only' | 'front_and_back';

export interface Category {
  id: string;
  name: string;
  unitPrice: number;
  description?: string;
  adminId: string;
  categoryType?: CategoryType;
  regularFormatProperties?: RegularFormatProperties;
  createdAt?: number;
  updatedAt?: number;
}

export interface CreateCategoryData {
  name: string;
  unitPrice: number;
  description?: string;
  categoryType?: CategoryType;
  regularFormatProperties?: RegularFormatProperties;
}

export interface UpdateCategoryData {
  name?: string;
  unitPrice?: number;
  description?: string;
  categoryType?: CategoryType;
  regularFormatProperties?: RegularFormatProperties;
}

// WhatsApp types
export interface WhatsAppStatus {
  isConnected: boolean;
  isAuthenticated: boolean;
  qrCode?: string;
  error?: string;
  phoneNumber?: string;
}

// IPC API interface
export interface IpcApi {
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<{ success: boolean }>;
    delete: (key: string) => Promise<{ success: boolean }>;
    clear: () => Promise<{ success: boolean }>;
  };
  auth: {
    login: (credentials: LoginCredentials) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    refreshToken: (token: string) => Promise<string>;
    updateProfile: (updates: {
      name?: string;
      email?: string;
      location?: { latitude: number; longitude: number; address: string };
    }) => Promise<User>;
  };
  users: {
    getAll: () => Promise<User[]>;
    getById: (id: string) => Promise<User>;
    create: (data: CreateUserData) => Promise<User>;
    update: (id: string, data: UpdateUserData) => Promise<User>;
    updateLocation: (
      id: string,
      location: { latitude: number; longitude: number; address: string }
    ) => Promise<User>;
    delete: (id: string) => Promise<void>;
  };
  adminManagement: {
    createClerk: (data: createClerkData) => Promise<User>;
    getMyClerks: (adminId: string) => Promise<User[]>;
    changeClerkPassword: (clerkId: string, newPassword: string) => Promise<User>;
  };
  files: {
    save: (path: string, content: string) => Promise<void>;
    read: (path: string) => Promise<string>;
    upload: (filePath: string) => Promise<{ fileId: string; fileName: string; fileSize: number }>;
    fetch: (
      fileUrl: string,
      headers?: Record<string, string>
    ) => Promise<{ data: string; contentType: string }>;
  };
  agent: {
    start: () => Promise<void>;
    stop: () => Promise<void>;
    getStatus: () => Promise<AgentStatus>;
    getPrinters: () => Promise<PrinterInfo[]>;
    discoverPrinters: () => Promise<PrinterInfo[]>;
    printFile: (printerName: string, filePath: string, options?: PrintOptions) => Promise<void>;
    testPrint: (printerName: string, filePath: string) => Promise<void>;
    isRunning: () => Promise<boolean>;
  };
  logs: {
    getLogs: (agentId?: string) => Promise<any[]>;
    getLogsByDateRange: (startDate: string, endDate: string) => Promise<any[]>;
  };
  jobs: {
    getAll: () => Promise<any[]>;
    getById: (id: string) => Promise<any>;
    create: (job: any) => Promise<any>;
    update: (id: string, updates: any) => Promise<any>;
    submitToPrinter: (jobId: string, agentId: string) => Promise<void>;
  };
  agents: {
    getAll: () => Promise<any[]>;
    getById: (id: string) => Promise<any>;
    updateStatus: (id: string, status: string) => Promise<any>;
  };
  analytics: {
    getData: (dateRange?: { start: string; end: string }) => Promise<any>;
    getComparison: () => Promise<any>;
  };
  dashboard: {
    getStats: (
      date?: string,
      month?: string,
      year?: string
    ) => Promise<{
      todaysJobs: number;
      completedJobs: number;
      pendingJobs: number;
      failedJobs: number;
      totalJobs: number;
      totalRevenue?: number;
      pendingRevenue?: number;
      paidJobs?: number;
      revenueMonth?: string;
    }>;
    getWeeklyActivity: (
      month?: string,
      year?: string
    ) => Promise<
      Array<{
        date: string;
        count: number;
      }>
    >;
    getJobsByDate: (date: string) => Promise<any[]>;
    getCategoryAnalytics: (days?: number) => Promise<any[]>;
    getPaymentAnalytics: (days?: number) => Promise<any>;
    getComprehensiveReport: (startDate?: string, endDate?: string) => Promise<any>;
  };
  health: {
    check: () => Promise<any>;
  };
  location: {
    getCurrentPosition: () => Promise<{ latitude: number; longitude: number; accuracy?: number }>;
  };
  categories: {
    getAll: (adminId: string) => Promise<Category[]>;
    create: (data: CreateCategoryData) => Promise<Category>;
    update: (id: string, data: UpdateCategoryData) => Promise<Category>;
    delete: (id: string) => Promise<void>;
  };
  whatsapp: {
    initialize: () => Promise<WhatsAppStatus>;
    getStatus: () => Promise<WhatsAppStatus>;
    disconnect: () => Promise<WhatsAppStatus>;
    logout: () => Promise<WhatsAppStatus>;
    getLocalMessages: () => Promise<any[]>;
    sendMessage: (chatId: string, text: string) => Promise<{ success: boolean }>;
    sendFile: (chatId: string, filePath: string, caption?: string) => Promise<{ success: boolean }>;
    createQuote: (
      jobId: string,
      quoteData: {
        orderDescription: string;
        quantity?: string;
        specifications: string;
        price: number;
        internalNotes?: string;
        contact: string;
        email: string;
      }
    ) => Promise<{ success: boolean; paymentLink?: string }>;
    downloadMedia: (
      contact: string,
      messageId: string
    ) => Promise<{ success: boolean; filePath?: string }>;
    markJobCompleted: (
      jobId: string,
      options: {
        contact: string;
        customMessage?: string;
      }
    ) => Promise<{ success: boolean }>;
    handlePaymentWebhook: (paymentData: {
      reference: string;
      status: string;
      amount: number;
      customer: { email: string };
    }) => Promise<{ success: boolean; jobId?: string }>;
    onQR: (callback: (qr: string) => void) => () => void;
    onStatus: (callback: (status: WhatsAppStatus) => void) => () => void;
    onMessage: (callback: (message: any) => void) => () => void;
    onError: (callback: (error: string) => void) => () => void;
    onHistoryLoaded: (callback: (data: { count: number }) => void) => () => void;
    onMessageAck?: (callback: (data: { messageId: string; chatId: string; ack: number }) => void) => () => void;
    onReady?: (callback: () => void) => () => void;
  };
  shell: {
    openPath: (filePath: string) => Promise<{ success: boolean }>;
    showItemInFolder: (filePath: string) => Promise<{ success: boolean }>;
  };
  dialog: {
    showOpenDialog: (options: {
      properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
      filters?: Array<{ name: string; extensions: string[] }>;
    }) => Promise<{ canceled: boolean; filePaths: string[] }>;
  };
}

declare global {
  interface Window {
    electron: IpcApi;
  }
}
