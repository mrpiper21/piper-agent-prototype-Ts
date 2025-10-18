// // ============================================================================
// // PERMISSIONS MANAGER - Manage file and directory permissions
// // ============================================================================

// import fs from 'fs-extra';
// import path from 'path';
// import { logger } from '../utils/logger.js';
// import { platform } from '../utils/platform.js';

// export class PermissionsManager {
//   /**
//    * Check if user has necessary permissions
//    */
//   async checkPermissions(): Promise<boolean> {
//     try {
//       logger.info('Checking installation permissions...');

//       // Check if running as administrator/root
//       const hasAdminRights = await platform.hasAdminRights();
      
//       if (!hasAdminRights) {
//         logger.warn('Not running with administrator privileges');
        
//         // Check if we can write to application directory
//         const canWriteToAppDir = await this.canWriteToDirectory(platform.getApplicationDataDirectory());
//         if (!canWriteToAppDir) {
//           logger.error('Cannot write to application directory');
//           return false;
//         }
//       }

//       // Check if we can create system service (if needed)
//       if (platform.isWindows()) {
//         const canCreateService = await this.canCreateWindowsService();
//         if (!canCreateService) {
//           logger.warn('Cannot create Windows service - some features may not be available');
//         }
//       }

//       logger.info('Permission check completed');
//       return true;
//     } catch (error) {
//       logger.error('Permission check failed:', error);
//       return false;
//     }
//   }

//   /**
//    * Set appropriate permissions for application files
//    */
//   async setPermissions(): Promise<void> {
//     try {
//       logger.info('Setting file permissions...');

//       const appDir = platform.getApplicationDataDirectory();
      
//       // Set directory permissions
//       await this.setDirectoryPermissions(appDir, 0o755);
      
//       // Set file permissions
//       await this.setFilePermissions(appDir);
      
//       // Set special permissions for sensitive files
//       await this.setSecurePermissions();

//       logger.info('File permissions set successfully');
//     } catch (error) {
//       logger.error('Failed to set permissions:', error);
//       throw error;
//     }
//   }

//   /**
//    * Check if we can write to a directory
//    */
//   private async canWriteToDirectory(dirPath: string): Promise<boolean> {
//     try {
//       await fs.ensureDir(dirPath);
      
//       const testFile = path.join(dirPath, '.permission-test');
//       await fs.writeFile(testFile, 'test');
//       await fs.remove(testFile);
      
//       return true;
//     } catch (error) {
//       logger.debug(`Cannot write to directory ${dirPath}:`, error);
//       return false;
//     }
//   }

//   /**
//    * Check if we can create Windows service
//    */
//   private async canCreateWindowsService(): Promise<boolean> {
//     try {
//       if (!platform.isWindows()) {
//         return true; // Not applicable on non-Windows systems
//       }

//       // Try to access Windows service registry key
//       const { exec } = require('child_process');
//       const { promisify } = require('util');
//       const execAsync = promisify(exec);

//       try {
//         await execAsync('reg query "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services"');
//         return true;
//       } catch {
//         return false;
//       }
//     } catch (error) {
//       logger.debug('Cannot create Windows service:', error);
//       return false;
//     }
//   }

//   /**
//    * Set directory permissions
//    */
//   private async setDirectoryPermissions(dirPath: string, mode: number): Promise<void> {
//     try {
//       if (!(await fs.pathExists(dirPath))) {
//         return;
//       }

//       await fs.chmod(dirPath, mode);
      
//       // Recursively set permissions for subdirectories
//       const items = await fs.readdir(dirPath, { withFileTypes: true });
      
//       for (const item of items) {
//         const itemPath = path.join(dirPath, item.name);
        
//         if (item.isDirectory()) {
//           await this.setDirectoryPermissions(itemPath, mode);
//         }
//       }
//     } catch (error) {
//       logger.error(`Failed to set directory permissions for ${dirPath}:`, error);
//       throw error;
//     }
//   }

//   /**
//    * Set file permissions
//    */
//   private async setFilePermissions(dirPath: string): Promise<void> {
//     try {
//       if (!(await fs.pathExists(dirPath))) {
//         return;
//       }

//       const items = await fs.readdir(dirPath, { withFileTypes: true });
      
//       for (const item of items) {
//         const itemPath = path.join(dirPath, item.name);
        
//         if (item.isFile()) {
//           // Set appropriate permissions based on file type
//           const extension = path.extname(item.name).toLowerCase();
//           let mode = 0o644; // Default file permissions
          
//           if (extension === '.sh' || extension === '.bat' || item.name.includes('start-')) {
//             mode = 0o755; // Executable files
//           }
          
//           await fs.chmod(itemPath, mode);
//         } else if (item.isDirectory()) {
//           await this.setFilePermissions(itemPath);
//         }
//       }
//     } catch (error) {
//       logger.error(`Failed to set file permissions for ${dirPath}:`, error);
//       throw error;
//     }
//   }

//   /**
//    * Set secure permissions for sensitive files
//    */
//   private async setSecurePermissions(): Promise<void> {
//     try {
//       const secureFiles = [
//         path.join(platform.getConfigDirectory(), 'agent.config.json'),
//         path.join(platform.getConfigDirectory(), 'encryption.key'),
//         path.join(platform.getConfigDirectory(), 'machine-id'),
//       ];

//       for (const filePath of secureFiles) {
//         if (await fs.pathExists(filePath)) {
//           // Set restrictive permissions (owner read/write only)
//           await fs.chmod(filePath, 0o600);
//           logger.debug(`Set secure permissions for ${filePath}`);
//         }
//       }
//     } catch (error) {
//       logger.error('Failed to set secure permissions:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get file permissions
//    */
//   async getFilePermissions(filePath: string): Promise<string | null> {
//     try {
//       if (!(await fs.pathExists(filePath))) {
//         return null;
//       }

//       const stats = await fs.stat(filePath);
//       return stats.mode.toString(8);
//     } catch (error) {
//       logger.error(`Failed to get permissions for ${filePath}:`, error);
//       return null;
//     }
//   }

//   /**
//    * Change file ownership (Unix systems)
//    */
//   async changeOwnership(filePath: string, uid?: number, gid?: number): Promise<void> {
//     try {
//       if (platform.isWindows()) {
//         logger.debug('File ownership change not applicable on Windows');
//         return;
//       }

//       const chown = require('fs').chown;
//       const { promisify } = require('util');
//       const chownAsync = promisify(chown);

//       const currentUid = uid || process.getuid();
//       const currentGid = gid || process.getgid();

//       await chownAsync(filePath, currentUid, currentGid);
//       logger.debug(`Changed ownership of ${filePath} to ${currentUid}:${currentGid}`);
//     } catch (error) {
//       logger.error(`Failed to change ownership of ${filePath}:`, error);
//       throw error;
//     }
//   }

//   /**
//    * Verify permissions
//    */
//   async verifyPermissions(): Promise<{
//     valid: boolean;
//     issues: string[];
//   }> {
//     try {
//       const issues: string[] = [];
//       const appDir = platform.getApplicationDataDirectory();

//       // Check if application directory is writable
//       if (!(await this.canWriteToDirectory(appDir))) {
//         issues.push('Application directory is not writable');
//       }

//       // Check secure file permissions
//       const secureFiles = [
//         path.join(platform.getConfigDirectory(), 'encryption.key'),
//         path.join(platform.getConfigDirectory(), 'machine-id'),
//       ];

//       for (const filePath of secureFiles) {
//         if (await fs.pathExists(filePath)) {
//           const permissions = await this.getFilePermissions(filePath);
//           if (permissions && permissions !== '600') {
//             issues.push(`Insecure permissions for ${filePath}: ${permissions}`);
//           }
//         }
//       }

//       return {
//         valid: issues.length === 0,
//         issues,
//       };
//     } catch (error) {
//       logger.error('Failed to verify permissions:', error);
//       return {
//         valid: false,
//         issues: ['Permission verification failed'],
//       };
//     }
//   }

//   /**
//    * Fix permission issues
//    */
//   async fixPermissions(): Promise<void> {
//     try {
//       logger.info('Fixing permission issues...');

//       await this.setPermissions();
      
//       const verification = await this.verifyPermissions();
//       if (!verification.valid) {
//         logger.warn('Some permission issues remain:', verification.issues);
//       } else {
//         logger.info('All permission issues fixed');
//       }
//     } catch (error) {
//       logger.error('Failed to fix permissions:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get permission statistics
//    */
//   async getPermissionStats(): Promise<{
//     totalFiles: number;
//     executableFiles: number;
//     secureFiles: number;
//     permissionIssues: number;
//   }> {
//     try {
//       const appDir = platform.getApplicationDataDirectory();
      
//       if (!(await fs.pathExists(appDir))) {
//         return {
//           totalFiles: 0,
//           executableFiles: 0,
//           secureFiles: 0,
//           permissionIssues: 0,
//         };
//       }

//       let totalFiles = 0;
//       let executableFiles = 0;
//       let secureFiles = 0;
//       let permissionIssues = 0;

//       const processDirectory = async (dirPath: string): Promise<void> => {
//         const items = await fs.readdir(dirPath, { withFileTypes: true });
        
//         for (const item of items) {
//           const itemPath = path.join(dirPath, item.name);
          
//           if (item.isFile()) {
//             totalFiles++;
            
//             const permissions = await this.getFilePermissions(itemPath);
//             if (permissions) {
//               // Check if file is executable
//               if (permissions.includes('5') || permissions.includes('7')) {
//                 executableFiles++;
//               }
              
//               // Check if file has secure permissions
//               if (permissions === '600') {
//                 secureFiles++;
//               }
              
//               // Check for permission issues
//               if (permissions.includes('2') || permissions.includes('6')) {
//                 permissionIssues++;
//               }
//             }
//           } else if (item.isDirectory()) {
//             await processDirectory(itemPath);
//           }
//         }
//       };

//       await processDirectory(appDir);

//       return {
//         totalFiles,
//         executableFiles,
//         secureFiles,
//         permissionIssues,
//       };
//     } catch (error) {
//       logger.error('Failed to get permission statistics:', error);
//       return {
//         totalFiles: 0,
//         executableFiles: 0,
//         secureFiles: 0,
//         permissionIssues: 0,
//       };
//     }
//   }
// }
