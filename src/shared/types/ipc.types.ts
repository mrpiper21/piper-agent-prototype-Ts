// IPC Types - shared between main and renderer

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'clerk';
  permissions: string[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  }
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

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'admin' | 'clerk';
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
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

// IPC API interface
export interface IpcApi {
  auth: {
    login: (credentials: LoginCredentials) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    refreshToken: (token: string) => Promise<string>;
    updateProfile: (updates: { name?: string; email?: string; location?: { latitude: number; longitude: number; address: string } }) => Promise<User>;
  };
  users: {
    getAll: () => Promise<User[]>;
    getById: (id: string) => Promise<User>;
    create: (data: CreateUserData) => Promise<User>;
    update: (id: string, data: UpdateUserData) => Promise<User>;
    delete: (id: string) => Promise<void>;
  };
  files: {
    save: (path: string, content: string) => Promise<void>;
    read: (path: string) => Promise<string>;
    upload: (filePath: string) => Promise<{ fileId: string; fileName: string; fileSize: number }>;
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
    getStats: (date?: string) => Promise<{
      todaysJobs: number;
      completedJobs: number;
      pendingJobs: number;
      failedJobs: number;
      totalJobs: number;
    }>;
    getWeeklyActivity: () => Promise<Array<{
      date: string;
      count: number;
    }>>;
    getJobsByDate: (date: string) => Promise<any[]>;
  };
  health: {
    check: () => Promise<any>;
  };
  location: {
    getCurrentPosition: () => Promise<{ latitude: number; longitude: number; accuracy?: number }>;
  };
}

declare global {
  interface Window {
    electron: IpcApi;
  }
}
