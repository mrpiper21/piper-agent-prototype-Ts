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
  description?: string;
  agentId?: string;
  status:
    | 'pending'
    | 'queued'
    | 'processing'
    | 'printing'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'needs_quote'
    | 'quote_sent'
    | 'awaiting_payment'
    | 'payment_received';
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
    // WhatsApp-specific fields
    whatsappContact?: string;
    whatsappMessageId?: string;
    notes?: string;
    conversationStatus?: 'needs_quote' | 'quote_sent' | 'payment_received' | 'completed';
    attachedFiles?: Array<{
      filePath: string;
      fileName: string;
      fileType: string;
      messageId?: string;
    }>;
    orderDescription?: string;
    quantity?: string;
    specifications?: string;
    price?: number;
    internalNotes?: string;
    paymentLink?: string;
    paymentVerified?: boolean;
    paymentReference?: string;
    paymentAmount?: number;
    quoteReference?: string;
    binding?: boolean;
    total?: number;
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
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  isTemporaryPassword?: boolean;
}

