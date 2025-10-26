// // ============================================================================
// // ENCRYPTION - Encrypt and decrypt sensitive data
// // ============================================================================

// import crypto from 'crypto';
// import fs from 'fs-extra';
// import path from 'path';
// import { promisify } from 'util';
// import { logger } from '../../utils/logger.js';
// import { SecurityError } from '../../types/index.js';
// import { platform } from '../../utils/platform.js';
// import { exec } from 'child_process';

// const execAsync = promisify(exec);

// export class Encryption {
//   private algorithm: string = 'aes-256-gcm';
//   private keyLength: number = 32; // 256 bits
//   private ivLength: number = 16; // 128 bits
//   private tagLength: number = 16; // 128 bits
//   private key: Buffer | null = null;
//   private keyFile: string;
//   private isAvailable: boolean = false;
//   private operationCount: number = 0;

//   constructor() {
//     this.keyFile = path.join(platform.getConfigDirectory(), 'encryption.key');
//   }

//   /**
//    * Initialize encryption
//    */
//   async initialize(): Promise<void> {
//     try {
//       // Try to load existing key
//       await this.loadKey();
      
//       // If no key exists, generate a new one
//       if (!this.key) {
//         await this.generateKey();
//       }

//       this.isAvailable = true;
//       logger.debug('Encryption initialized');
//     } catch (error) {
//       logger.error('Failed to initialize encryption:', error);
//       this.isAvailable = false;
//       throw new SecurityError('Encryption initialization failed', error);
//     }
//   }

//   /**
//    * Generate encryption key
//    */
//   private async generateKey(): Promise<void> {
//     try {
//       this.key = crypto.randomBytes(this.keyLength);
//       await this.saveKey();
      
//       logger.info('Generated new encryption key');
//     } catch (error) {
//       logger.error('Failed to generate encryption key:', error);
//       throw new SecurityError('Key generation failed', error);
//     }
//   }

//   /**
//    * Save encryption key to file
//    */
//   private async saveKey(): Promise<void> {
//     try {
//       if (!this.key) {
//         throw new Error('No key to save');
//       }

//       // Ensure config directory exists
//       await fs.ensureDir(platform.getConfigDirectory());

//       // Save key with restricted permissions
//       await fs.writeFile(this.keyFile, this.key, { mode: 0o600 });
      
//       logger.debug('Encryption key saved');
//     } catch (error) {
//       logger.error('Failed to save encryption key:', error);
//       throw new SecurityError('Key save failed', error);
//     }
//   }

//   /**
//    * Load encryption key from file
//    */
//   private async loadKey(): Promise<void> {
//     try {
//       if (await fs.pathExists(this.keyFile)) {
//         this.key = await fs.readFile(this.keyFile);
        
//         if (this.key.length !== this.keyLength) {
//           throw new Error('Invalid key length');
//         }
        
//         logger.debug('Encryption key loaded');
//       }
//     } catch (error) {
//       logger.error('Failed to load encryption key:', error);
//       this.key = null;
//     }
//   }

//   /**
//    * Encrypt data
//    */
//   async encrypt(data: string): Promise<string> {
//     try {
//       if (!this.key) {
//         throw new Error('Encryption key not available');
//       }

//       this.operationCount++;

//       // Generate random IV
//       const iv = crypto.randomBytes(this.ivLength);
      
//       // Create cipher
//       const cipher = crypto.createCipheriv(this.algorithm, this.key, iv) as crypto.Cipher;
//       cipher.setAAD(Buffer.from('agent-data')); // Additional authenticated data

//       // Encrypt data
//       let encrypted = cipher.update(data, 'utf8', 'hex');
//       encrypted += cipher.final('hex');

//       // Get authentication tag
//       const tag = cipher.getAuthTag() as Buffer;
//       if (!tag) {
//         throw new Error('Authentication tag not available');
//       }

//       // Combine IV, tag, and encrypted data
//       const result = {
//         iv: iv.toString('hex'),
//         tag: tag.toString('hex'),
//         data: encrypted,
//       };

//       return Buffer.from(JSON.stringify(result)).toString('base64');
//     } catch (error) {
//       logger.error('Encryption failed:', error);
//       throw new SecurityError('Encryption failed', error);
//     }
//   }

//   /**
//    * Decrypt data
//    */
//   async decrypt(encryptedData: string): Promise<string> {
//     try {
//       if (!this.key) {
//         throw new Error('Encryption key not available');
//       }

//       this.operationCount++;

//       // Parse encrypted data
//       const parsed = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
      
//       const iv = Buffer.from(parsed.iv, 'hex');
//       const tag = Buffer.from(parsed.tag, 'hex');
//       const data = parsed.data;

//       // Create decipher
//       const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv) as crypto.Decipher;
//       decipher.setAAD(Buffer.from('agent-data'));
//       if (!tag) {
//         throw new Error('Authentication tag not available');
//       }
//       decipher.setAuthTag(tag);

//       // Decrypt data
//       let decrypted = decipher.update(data, 'hex', 'utf8');
//       decrypted += decipher.final('utf8');

//       return decrypted;
//     } catch (error) {
//       logger.error('Decryption failed:', error);
//       throw new SecurityError('Decryption failed', error);
//     }
//   }

//   /**
//    * Encrypt file
//    */
//   async encryptFile(inputPath: string, outputPath: string): Promise<void> {
//     try {
//       if (!this.key) {
//         throw new Error('Encryption key not available');
//       }

//       const data = await fs.readFile(inputPath, 'utf8');
//       const encrypted = await this.encrypt(data);
      
//       await fs.writeFile(outputPath, encrypted, { mode: 0o600 });
      
//       logger.debug(`File encrypted: ${inputPath} -> ${outputPath}`);
//     } catch (error) {
//       logger.error(`File encryption failed: ${inputPath}`, error);
//       throw new SecurityError('File encryption failed', error);
//     }
//   }

//   /**
//    * Decrypt file
//    */
//   async decryptFile(inputPath: string, outputPath: string): Promise<void> {
//     try {
//       if (!this.key) {
//         throw new Error('Encryption key not available');
//       }

//       const encryptedData = await fs.readFile(inputPath, 'utf8');
//       const decrypted = await this.decrypt(encryptedData);
      
//       await fs.writeFile(outputPath, decrypted, { mode: 0o600 });
      
//       logger.debug(`File decrypted: ${inputPath} -> ${outputPath}`);
//     } catch (error) {
//       logger.error(`File decryption failed: ${inputPath}`, error);
//       throw new SecurityError('File decryption failed', error);
//     }
//   }

//   /**
//    * Generate hash of data
//    */
//   generateHash(data: string, algorithm: string = 'sha256'): string {
//     try {
//       return crypto.createHash(algorithm).update(data).digest('hex');
//     } catch (error) {
//       logger.error('Hash generation failed:', error);
//       throw new SecurityError('Hash generation failed', error);
//     }
//   }

//   /**
//    * Generate HMAC of data
//    */
//   generateHMAC(data: string, secret?: string): string {
//     try {
//       const key = secret ? Buffer.from(secret, 'utf8') : this.key;
      
//       if (!key) {
//         throw new Error('No key available for HMAC');
//       }

//       return crypto.createHmac('sha256', key).update(data).digest('hex');
//     } catch (error) {
//       logger.error('HMAC generation failed:', error);
//       throw new SecurityError('HMAC generation failed', error);
//     }
//   }

//   /**
//    * Verify HMAC
//    */
//   verifyHMAC(data: string, hmac: string, secret?: string): boolean {
//     try {
//       const expectedHmac = this.generateHMAC(data, secret);
//       return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
//     } catch (error) {
//       logger.error('HMAC verification failed:', error);
//       return false;
//     }
//   }

//   /**
//    * Generate random bytes
//    */
//   generateRandomBytes(length: number): Buffer {
//     try {
//       return crypto.randomBytes(length);
//     } catch (error) {
//       logger.error('Random bytes generation failed:', error);
//       throw new SecurityError('Random bytes generation failed', error);
//     }
//   }

//   /**
//    * Generate secure random string
//    */
//   generateSecureRandomString(length: number): string {
//     try {
//       const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//       const randomBytes = this.generateRandomBytes(length);
//       let result = '';

//       for (let i = 0; i < length; i++) {
//         result += chars[randomBytes[i] % chars.length] || '';
//       }

//       return result;
//     } catch (error) {
//       logger.error('Secure random string generation failed:', error);
//       throw new SecurityError('Secure random string generation failed', error);
//     }
//   }

//   /**
//    * Check if encryption is available
//    */
//   isEncryptionAvailable(): boolean {
//     return this.isAvailable;
//   }

//   /**
//    * Get operation count
//    */
//   getOperationCount(): number {
//     return this.operationCount;
//   }

//   /**
//    * Get encryption statistics
//    */
//   getStats(): {
//     isAvailable: boolean;
//     operationCount: number;
//     algorithm: string;
//     keyLength: number;
//   } {
//     return {
//       isAvailable: this.isAvailable,
//       operationCount: this.operationCount,
//       algorithm: this.algorithm,
//       keyLength: this.keyLength,
//     };
//   }

//   /**
//    * Update configuration
//    */
//   async updateConfig(config: Record<string, string | number>): Promise<void> {
//     try {
//       if (config['algorithm']) {
//         this.algorithm = config.algorithm;
//       }

//       if (config['keyLength']) {
//         this.keyLength = config.keyLength;
//       }

//       if (config['ivLength']) {
//         this.ivLength = config.ivLength;
//       }

//       logger.info('Encryption configuration updated');
//     } catch (error) {
//       logger.error('Failed to update encryption configuration:', error);
//       throw error;
//     }
//   }

//   /**
//    * Rotate encryption key
//    */
//   async rotateKey(): Promise<void> {
//     try {
//       logger.info('Rotating encryption key...');
      
//       // Generate new key
//       await this.generateKey();
      
//       // Update availability
//       this.isAvailable = true;
      
//       logger.info('Encryption key rotated successfully');
//     } catch (error) {
//       logger.error('Failed to rotate encryption key:', error);
//       throw new SecurityError('Key rotation failed', error);
//     }
//   }

//   /**
//    * Validate encryption key
//    */
//   async validateKey(): Promise<boolean> {
//     try {
//       if (!this.key) {
//         return false;
//       }

//       // Test encryption/decryption
//       const testData = 'test-data-for-validation';
//       const encrypted = await this.encrypt(testData);
//       const decrypted = await this.decrypt(encrypted);
      
//       return testData === decrypted;
//     } catch (error) {
//       logger.error('Key validation failed:', error);
//       return false;
//     }
//   }

//   /**
//    * Get key fingerprint
//    */
//   getKeyFingerprint(): string | null {
//     try {
//       if (!this.key) {
//         return null;
//       }

//       return this.generateHash(this.key.toString('hex')).substring(0, 16);
//     } catch (error) {
//       logger.error('Failed to get key fingerprint:', error);
//       return null;
//     }
//   }
// }
