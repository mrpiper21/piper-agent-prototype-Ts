// ============================================================================
// TYPE DEFINITIONS - Core types for the PrintMyFile Agent
// ============================================================================

export interface AgentConfig {
  cloudUrl: string;
  agentId: string;
  locationName: string;
  apiKey: string;
  licenseKey?: string;
  machineId: string;
  installDate: string;
  version: string;
  checksumVerified: boolean;
}

export interface PrinterInfo {
  printerName: string;
  displayName?: string;
  driverName?: string;
  isDefault: boolean;
  status: 'online' | 'offline' | 'error' | 'busy';
  location?: string;
  description?: string;
  capabilities?: PrinterCapabilities;
}

export interface PrinterCapabilities {
  color: boolean;
  duplex: boolean;
  paperSizes: string[];
  orientations: ('portrait' | 'landscape')[];
  resolutions: number[];
}

export interface PrintJob {
  jobId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  printerName: string;
  copies: number;
  colorMode: 'color' | 'grayscale' | 'black-white';
  orientation: 'portrait' | 'landscape';
  paperSize: string;
  duplex?: boolean;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'downloading' | 'printing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  printedAt?: string;
}

export interface AgentStatus {
  status: 'online' | 'offline' | 'error' | 'printing';
  printerCount: number;
  jobsProcessed: number;
  lastPoll: Date | null;
  uptime: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TamperResult {
  isTampered: boolean;
  reason?: string;
  details?: Record<string, any>;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  hostname: string;
  nodeVersion: string;
  agentVersion: string;
  uptime: number;
  memory: {
    total: number;
    free: number;
    used: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
  };
}

export interface InstallOptions {
  autoStart: boolean;
  createDesktopShortcut: boolean;
  installLocation?: string;
  runAsService: boolean;
}

export interface SecurityConfig {
  enableTamperDetection: boolean;
  enableFileWatcher: boolean;
  enableEncryption: boolean;
  allowedPaths: string[];
  blockedPaths: string[];
  maxFileSize: number;
}

export interface CloudConfig {
  baseUrl: string;
  apiKey: string;
  agentId: string;
  pollInterval: number;
  heartbeatInterval: number;
  timeout: number;
  retryAttempts: number;
}

export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  file: boolean;
  console: boolean;
  maxSize: number;
  maxFiles: number;
  directory: string;
}

export interface PrinterDriver {
  name: string;
  platform: 'windows' | 'macos' | 'linux';
  command: string;
  args: string[];
  supportedFormats: string[];
}

export interface FileDownloadOptions {
  url: string;
  outputPath: string;
  timeout?: number;
  retries?: number;
  validateChecksum?: boolean;
  checksum?: string;
}

export interface JobQueueItem {
  job: PrintJob;
  priority: number;
  addedAt: Date;
  retries: number;
  maxRetries: number;
}

export interface HeartbeatData {
  agentId: string;
  status: AgentStatus;
  timestamp: string;
  systemInfo?: SystemInfo;
}

export interface UpdateInfo {
  hasUpdate: boolean;
  version?: string;
  downloadUrl?: string;
  changelog?: string;
  required: boolean;
}

export interface LicenseInfo {
  valid: boolean;
  expiresAt?: string;
  features: string[];
  limits: Record<string, number>;
}

// Error types
export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class PrinterError extends AgentError {
  constructor(message: string, details?: any) {
    super(message, 'PRINTER_ERROR', details);
    this.name = 'PrinterError';
  }
}

export class CloudError extends AgentError {
  constructor(message: string, details?: any) {
    super(message, 'CLOUD_ERROR', details);
    this.name = 'CloudError';
  }
}

export class SecurityError extends AgentError {
  constructor(message: string, details?: any) {
    super(message, 'SECURITY_ERROR', details);
    this.name = 'SecurityError';
  }
}

export class ValidationError extends AgentError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

// Event types
export interface AgentEvents {
  'agent:started': { agentId: string; timestamp: Date };
  'agent:stopped': { agentId: string; timestamp: Date };
  'printer:discovered': { printer: PrinterInfo };
  'printer:removed': { printerName: string };
  'job:received': { job: PrintJob };
  'job:started': { jobId: string; printerName: string };
  'job:completed': { jobId: string; success: boolean };
  'job:failed': { jobId: string; error: string };
  'cloud:connected': { cloudUrl: string };
  'cloud:disconnected': { reason: string };
  'security:tamper-detected': { result: TamperResult };
  'update:available': { updateInfo: UpdateInfo };
}

// CLI Command types
export interface CLICommand {
  name: string;
  description: string;
  options?: CLIOption[];
  action: (args: any) => Promise<void>;
}

export interface CLIOption {
  name: string;
  alias?: string;
  type: 'string' | 'boolean' | 'number';
  description: string;
  required?: boolean;
  default?: any;
}

// Platform-specific types
export interface PlatformInfo {
  name: string;
  version: string;
  arch: string;
  isSupported: boolean;
}

export interface PrinterCommand {
  command: string;
  args: string[];
  timeout: number;
}

// Constants
export const SUPPORTED_FILE_TYPES = [
  'pdf',
  'txt',
  'doc',
  'docx',
  'rtf',
  'html',
  'jpg',
  'jpeg',
  'png',
  'bmp',
  'gif',
  'tiff'
] as const;

export const SUPPORTED_PLATFORMS = [
  'win32',
  'darwin',
  'linux'
] as const;

export const DEFAULT_CONFIG = {
  POLL_INTERVAL: 5000,
  HEARTBEAT_INTERVAL: 30000,
  FILE_WATCH_INTERVAL: 60000,
  DOWNLOAD_TIMEOUT: 30000,
  MAX_RETRY_ATTEMPTS: 3,
  LOG_LEVEL: 'info',
  MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_LOG_FILES: 5
} as const;
