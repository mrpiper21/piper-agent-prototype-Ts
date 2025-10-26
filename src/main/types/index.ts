// Type definitions for API service

export interface PrintJob {
  _id?: string;
  id?: string;
  jobId?: string;
  printJobId: string;
  fileName: string;
  filePath?: string;
  fileType: string;
  printerName: string;
  agentId?: string;
  status: 'pending' | 'queued' | 'processing' | 'printing' | 'completed' | 'failed' | 'cancelled';
  submittedBy?: string;
  submittedAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
  metadata?: {
    copies?: number;
    colorMode?: string;
    orientation?: string;
    paperSize?: string;
    duplex?: boolean;
    pages?: number;
  };
}

export interface PrinterAgent {
  _id?: string;
  id?: string;
  agentId: string;
  machineId: string;
  name: string;
  location?: string;
  status: 'online' | 'offline' | 'error' | 'printing';
  printers: Array<{
    name: string;
    status: 'online' | 'offline' | 'busy';
  }>;
  lastHeartbeat?: string;
  isRunning: boolean;
  jobsProcessed: number;
  createdAt: string;
  updatedAt: string;
}

export interface PrinterLog {
  _id?: string;
  id?: string;
  logId?: string;
  agentId?: string;
  printerName: string;
  jobId?: string;
  fileName?: string;
  event: 'print' | 'complete' | 'error' | 'cancel' | 'test';
  message: string;
  timestamp: string;
  metadata?: {
    pages?: number;
    copies?: number;
    size?: number;
    error?: string;
    isAnonymous?: boolean;
  };
}

export interface AnalyticsData {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  activeJobs: number;
  totalPrintVolume: number;
  jobsByDay: Array<{
    date: string;
    count: number;
  }>;
  jobsByPrinter: Array<{
    printerName: string;
    count: number;
  }>;
  successRate: number;
  averageJobDuration: number;
  topPrinters: Array<{
    printerName: string;
    jobsCount: number;
  }>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'clerk';
  permissions: string[];
  createdAt: number;
  updatedAt: number;
}

