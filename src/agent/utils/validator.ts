

import { ValidationResult, PrinterInfo, PrintJob } from '../types/index.js';

/**
 * Validate required environment variables
 */
export function validateEnv(): ValidationResult {
  const required = ['CLOUD_URL', 'AGENT_ID', 'API_KEY'];

  const errors: string[] = [];

  // Check required variables
  for (const variable of required) {
    if (!process.env[variable]) {
      errors.push(`Missing required environment variable: ${variable}`);
    }
  }

  // Check URL format
  if (process.env['CLOUD_URL']) {
    try {
      new URL(process.env['CLOUD_URL']);
    } catch {
      errors.push(`Invalid CLOUD_URL format: ${process.env['CLOUD_URL']}`);
    }
  }

  // Set defaults for optional variables
  process.env['LOCATION_NAME'] = process.env['LOCATION_NAME'] || 'Default Location';
  process.env['LOG_LEVEL'] = process.env['LOG_LEVEL'] || 'info';
  process.env['POLL_INTERVAL'] = process.env['POLL_INTERVAL'] || '5000';
  process.env['HEARTBEAT_INTERVAL'] = process.env['HEARTBEAT_INTERVAL'] || '30000';
  process.env['DOWNLOAD_DIR'] = process.env['DOWNLOAD_DIR'] || './downloads';
  process.env['LOG_DIR'] = process.env['LOG_DIR'] || './logs';
  process.env['CONFIG_DIR'] = process.env['CONFIG_DIR'] || './.config';

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate agent ID format
 */
export function validateAgentId(agentId: string): boolean {
  if (!agentId) return false;
  return /^[a-zA-Z0-9_-]+$/.test(agentId);
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey) return false;
  return /^sk_[a-f0-9]{32,}$/.test(apiKey);
}

/**
 * Validate printer name
 */
export function validatePrinterName(name: string): boolean {
  if (!name) return false;
  return /^[a-zA-Z0-9\s\-_]+$/.test(name);
}

/**
 * Validate file path
 */
export function validateFilePath(filePath: string): boolean {
  if (!filePath) return false;
  return typeof filePath === 'string' && filePath.length > 0;
}

/**
 * Validate printer object
 */
export function validatePrinter(printer: PrinterInfo): ValidationResult {
  const errors: string[] = [];

  if (!printer.printerName) errors.push('Missing printerName');
  if (!printer.displayName) errors.push('Missing displayName');
  if (!['online', 'offline', 'error', 'busy'].includes(printer.status)) errors.push('Invalid status');

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate job object
 */
export function validateJobObject(job: PrintJob): ValidationResult {
  const errors: string[] = [];

  console.log("validating  ------", job)

  if (!job.id) errors.push('Missing jobId');
  if (!job.fileName) errors.push('Missing fileName');
  if (!job?.filePath) errors.push('Missing fileUrl');
  if (!job.printerName) errors.push('Missing printerName');
  if (typeof job.copies !== 'number' || job.copies < 1)
    errors.push('Invalid copies');
  // if (!['color', 'grayscale', 'black-white'].includes(job.colorMode))
  //   errors.push('Invalid colorMode');
  // if (!['portrait', 'landscape'].includes(job.orientation))
  //   errors.push('Invalid orientation');

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate file type
 */
export function validateFileType(fileName: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const supportedTypes = ['pdf', 'txt', 'doc', 'docx', 'rtf', 'html', 'jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff'];
  return extension ? supportedTypes.includes(extension) : false;
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate numeric range
 */
export function validateRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.replace(/[<>:"/\\|?*]/g, '_');
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate license key format
 */
export function validateLicenseKey(licenseKey: string): boolean {
  if (!licenseKey) return false;
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(licenseKey);
}