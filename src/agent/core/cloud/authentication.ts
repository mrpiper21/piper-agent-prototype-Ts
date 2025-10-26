// // ============================================================================
// // AUTHENTICATION MODULE - Cloud authentication and authorization
// // ============================================================================

// import { logger } from '../../utils/logger.js';
// import { CloudClient } from '../../utils/cloud/CloundClient.js';
// import { LicenseInfo, ValidationError } from '../../types/index.js';
// import { validateApiKey, validateLicenseKey } from '../../utils/validator.js';
// import { errorRecovery } from '../../utils/errors.js';

// export class AuthenticationService {
//   private cloudClient: CloudClient;
//   private apiKey: string;
//   private agentId: string;
//   private licenseKey?: string;
//   private isAuthenticated: boolean = false;
//   private lastAuthTime: Date | null = null;
//   private authToken: string | null = null;
//   private tokenExpiry: Date | null = null;

//   constructor(cloudClient: CloudClient, apiKey: string, agentId: string, licenseKey?: string) {
//     this.cloudClient = cloudClient;
//     this.apiKey = apiKey;
//     this.agentId = agentId;
//     this.licenseKey = licenseKey;
//   }

//   /**
//    * Authenticate with cloud server
//    */
//   async authenticate(): Promise<boolean> {
//     try {
//       // Validate API key format
//       if (!validateApiKey(this.apiKey)) {
//         throw new ValidationError('Invalid API key format');
//       }

//       // Validate license key if provided
//       if (this.licenseKey && !validateLicenseKey(this.licenseKey)) {
//         throw new ValidationError('Invalid license key format');
//       }

//       logger.info('Authenticating with cloud server...');

//       // Perform authentication
//       const authResult = await errorRecovery.withRetry(
//         () => this.performAuthentication(),
//         'authenticate',
//         3
//       );

//       if (authResult.success) {
//         this.isAuthenticated = true;
//         this.lastAuthTime = new Date();
//         this.authToken = authResult.token;
//         this.tokenExpiry = authResult.expiresAt ? new Date(authResult.expiresAt) : null;
        
//         logger.info('Authentication successful');
//         return true;
//       } else {
//         logger.error(`Authentication failed: ${authResult.error}`);
//         return false;
//       }
//     } catch (error) {
//       logger.error('Authentication error:', error);
//       return false;
//     }
//   }

//   /**
//    * Perform the actual authentication request
//    */
//   private async performAuthentication(): Promise<{
//     success: boolean;
//     token?: string;
//     expiresAt?: string;
//     error?: string;
//   }> {
//     // This would typically make an HTTP request to the cloud server
//     // For now, we'll simulate the authentication process
    
//     const authPayload = {
//       agentId: this.agentId,
//       apiKey: this.apiKey,
//       licenseKey: this.licenseKey,
//       timestamp: new Date().toISOString(),
//     };

//     try {
//       // Simulate API call (replace with actual implementation)
//       const response = await this.cloudClient.verifyLicense(this.licenseKey || '');
      
//       if (response) {
//         return {
//           success: true,
//           token: this.generateAuthToken(),
//           expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
//         };
//       } else {
//         return {
//           success: false,
//           error: 'Invalid credentials',
//         };
//       }
//     } catch (error) {
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : 'Authentication failed',
//       };
//     }
//   }

//   /**
//    * Generate authentication token
//    */
//   private generateAuthToken(): string {
//     const crypto = require('crypto');
//     const payload = {
//       agentId: this.agentId,
//       timestamp: Date.now(),
//       random: crypto.randomBytes(16).toString('hex'),
//     };
    
//     return crypto
//       .createHash('sha256')
//       .update(JSON.stringify(payload))
//       .digest('hex');
//   }

//   /**
//    * Check if authentication is valid
//    */
//   isAuthValid(): boolean {
//     if (!this.isAuthenticated || !this.lastAuthTime) {
//       return false;
//     }

//     // Check if token is expired
//     if (this.tokenExpiry && new Date() > this.tokenExpiry) {
//       logger.warn('Authentication token expired');
//       this.isAuthenticated = false;
//       return false;
//     }

//     // Check if authentication is too old (re-authenticate every hour)
//     const authAge = Date.now() - this.lastAuthTime.getTime();
//     if (authAge > 60 * 60 * 1000) { // 1 hour
//       logger.info('Authentication is stale, re-authenticating...');
//       return false;
//     }

//     return true;
//   }

//   /**
//    * Refresh authentication if needed
//    */
//   async refreshAuthIfNeeded(): Promise<boolean> {
//     if (this.isAuthValid()) {
//       return true;
//     }

//     logger.info('Refreshing authentication...');
//     return await this.authenticate();
//   }

//   /**
//    * Get authentication status
//    */
//   getAuthStatus() {
//     return {
//       isAuthenticated: this.isAuthenticated,
//       lastAuthTime: this.lastAuthTime,
//       tokenExpiry: this.tokenExpiry,
//       hasValidToken: this.isAuthValid(),
//     };
//   }

//   /**
//    * Verify license key
//    */
//   async verifyLicense(): Promise<LicenseInfo> {
//     if (!this.licenseKey) {
//       return {
//         valid: false,
//         features: [],
//         limits: {},
//       };
//     }

//     try {
//       const isValid = await this.cloudClient.verifyLicense(this.licenseKey);
      
//       return {
//         valid: isValid,
//         features: isValid ? ['printing', 'cloud-sync'] : [],
//         limits: isValid ? {
//           maxPrinters: 10,
//           maxJobsPerHour: 100,
//         } : {},
//       };
//     } catch (error) {
//       logger.error('License verification failed:', error);
//       return {
//         valid: false,
//         features: [],
//         limits: {},
//       };
//     }
//   }

//   /**
//    * Logout and clear authentication
//    */
//   logout(): void {
//     this.isAuthenticated = false;
//     this.lastAuthTime = null;
//     this.authToken = null;
//     this.tokenExpiry = null;
    
//     logger.info('Logged out from cloud server');
//   }

//   /**
//    * Get current auth token
//    */
//   getAuthToken(): string | null {
//     return this.isAuthValid() ? this.authToken : null;
//   }

//   /**
//    * Check if agent has required permissions
//    */
//   hasPermission(permission: string): boolean {
//     if (!this.isAuthenticated) {
//       return false;
//     }

//     // This would typically check against permissions from the cloud server
//     // For now, return true for basic permissions
//     const basicPermissions = ['print', 'status', 'heartbeat'];
//     return basicPermissions.includes(permission);
//   }

//   /**
//    * Get agent capabilities based on license
//    */
//   async getAgentCapabilities(): Promise<string[]> {
//     const licenseInfo = await this.verifyLicense();
    
//     if (!licenseInfo.valid) {
//       return ['basic'];
//     }

//     return licenseInfo.features || ['printing', 'cloud-sync'];
//   }
// }
