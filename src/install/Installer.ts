// // ============================================================================
// // INSTALLER - Main installation class
// // ============================================================================

// import { logger } from '../utils/logger.js';
// import { platform } from '../utils/platform.js';
// // import { InstallOptions } from '../types/index.js';
// import { DirectorySetup } from './DirectorySetup.js';
// import { PermissionsManager } from './PermissionsManager.js';
// import { ServiceInstaller } from './ServiceInstaller.js';
// import { AutostartSetup } from './AutostartSetup.js';

// export class Installer {
//   private directorySetup: DirectorySetup;
//   private permissionsManager: PermissionsManager;
//   private serviceInstaller: ServiceInstaller;
//   private autostartSetup: AutostartSetup;

//   constructor() {
//     this.directorySetup = new DirectorySetup();
//     this.permissionsManager = new PermissionsManager();
//     this.serviceInstaller = new ServiceInstaller();
//     this.autostartSetup = new AutostartSetup();
//   }

//   /**
//    * Check system requirements
//    */
//   async checkRequirements(): Promise<void> {
//     try {
//       logger.info('Checking system requirements...');

//       // Check Node.js version
//       const nodeVersion = process.version;
//       const requiredVersion = '18.0.0';
      
//       if (this.compareVersions(nodeVersion, requiredVersion) < 0) {
//         throw new Error(`Node.js ${requiredVersion} or higher is required. Current version: ${nodeVersion}`);
//       }

//       // Check platform support
//       if (!platform.isSupported()) {
//         throw new Error(`Unsupported platform: ${platform.getPlatformInfo().name}`);
//       }

//       // Check available disk space
//       const freeSpace = await this.getFreeDiskSpace();
//       const requiredSpace = 100 * 1024 * 1024; // 100MB
      
//       if (freeSpace < requiredSpace) {
//         throw new Error(`Insufficient disk space. Required: ${requiredSpace / 1024 / 1024}MB, Available: ${freeSpace / 1024 / 1024}MB`);
//       }

//       // Check memory
//       const totalMemory = require('os').totalmem();
//       const requiredMemory = 256 * 1024 * 1024; // 256MB
      
//       if (totalMemory < requiredMemory) {
//         throw new Error(`Insufficient memory. Required: ${requiredMemory / 1024 / 1024}MB, Available: ${totalMemory / 1024 / 1024}MB`);
//       }

//       logger.info('System requirements check passed');
//     } catch (error) {
//       logger.error('System requirements check failed:', error);
//       throw error;
//     }
//   }

//   /**
//    * Check installation permissions
//    */
//   async checkPermissions(): Promise<boolean> {
//     try {
//       return await this.permissionsManager.checkPermissions();
//     } catch (error) {
//       logger.error('Permission check failed:', error);
//       return false;
//     }
//   }

//   /**
//    * Create necessary directories
//    */
//   async createDirectories(): Promise<void> {
//     try {
//       await this.directorySetup.createDirectories();
//     } catch (error) {
//       logger.error('Failed to create directories:', error);
//       throw error;
//     }
//   }

//   /**
//    * Install application files
//    */
//   async installFiles(): Promise<void> {
//     try {
//       logger.info('Installing application files...');

//       // Copy application files
//       await this.copyApplicationFiles();

//       // Create configuration template
//       await this.createConfigurationTemplate();

//       // Create startup scripts
//       await this.createStartupScripts();

//       logger.info('Application files installed successfully');
//     } catch (error) {
//       logger.error('Failed to install files:', error);
//       throw error;
//     }
//   }

//   /**
//    * Create desktop shortcut
//    */
//   async createDesktopShortcut(): Promise<void> {
//     try {
//       const fs = require('fs-extra');
//       const path = require('path');

//       if (platform.isWindows()) {
//         // Create Windows shortcut
//         const shortcutPath = path.join(require('os').homedir(), 'Desktop', 'PrintMyFile Agent.lnk');
//         const targetPath = path.join(platform.getApplicationDataDirectory(), 'printmyfile-agent.exe');
        
//         // Create .lnk file (simplified)
//         await fs.writeFile(shortcutPath, `[InternetShortcut]
// URL=file://${targetPath}
// IconFile=${targetPath}
// IconIndex=0`);
//       } else if (platform.isMacOS()) {
//         // Create macOS application bundle or alias
//         const appPath = path.join(require('os').homedir(), 'Applications', 'PrintMyFile Agent.app');
//         await fs.ensureDir(appPath);
        
//         const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
// <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
// <plist version="1.0">
// <dict>
//     <key>CFBundleExecutable</key>
//     <string>printmyfile-agent</string>
//     <key>CFBundleIdentifier</key>
//     <string>com.printmyfile.agent</string>
//     <key>CFBundleName</key>
//     <string>PrintMyFile Agent</string>
//     <key>CFBundleVersion</key>
//     <string>1.0.0</string>
// </dict>
// </plist>`;
        
//         await fs.writeFile(path.join(appPath, 'Contents', 'Info.plist'), infoPlist);
//       } else {
//         // Create Linux desktop file
//         const desktopPath = path.join(require('os').homedir(), 'Desktop', 'printmyfile-agent.desktop');
//         const desktopFile = `[Desktop Entry]
// Version=1.0
// Type=Application
// Name=PrintMyFile Agent
// Comment=PrintMyFile Local Print Agent
// Exec=${path.join(platform.getApplicationDataDirectory(), 'printmyfile-agent')}
// Icon=${path.join(platform.getApplicationDataDirectory(), 'icon.png')}
// Terminal=false
// Categories=Network;Printing;`;
        
//         await fs.writeFile(desktopPath, desktopFile);
//         await fs.chmod(desktopPath, 0o755);
//       }

//       logger.info('Desktop shortcut created');
//     } catch (error) {
//       logger.error('Failed to create desktop shortcut:', error);
//       throw error;
//     }
//   }

//   /**
//    * Install as system service
//    */
//   async installService(): Promise<void> {
//     try {
//       await this.serviceInstaller.installService();
//     } catch (error) {
//       logger.error('Failed to install service:', error);
//       throw error;
//     }
//   }

//   /**
//    * Configure auto-start
//    */
//   async configureAutoStart(): Promise<void> {
//     try {
//       await this.autostartSetup.configureAutoStart();
//     } catch (error) {
//       logger.error('Failed to configure auto-start:', error);
//       throw error;
//     }
//   }

//   /**
//    * Finalize installation
//    */
//   async finalizeInstallation(): Promise<void> {
//     try {
//       logger.info('Finalizing installation...');

//       // Create installation record
//       await this.createInstallationRecord();

//       // Set file permissions
//       await this.setFilePermissions();

//       // Create uninstaller
//       await this.createUninstaller();

//       logger.info('Installation finalized successfully');
//     } catch (error) {
//       logger.error('Failed to finalize installation:', error);
//       throw error;
//     }
//   }

//   /**
//    * Copy application files
//    */
//   private async copyApplicationFiles(): Promise<void> {
//     try {
//       const fs = require('fs-extra');
//       const path = require('path');

//       const sourceDir = process.cwd();
//       const targetDir = platform.getApplicationDataDirectory();

//       // Copy source files
//       const filesToCopy = [
//         'package.json',
//         'dist',
//         'node_modules',
//       ];

//       for (const file of filesToCopy) {
//         const sourcePath = path.join(sourceDir, file);
//         const targetPath = path.join(targetDir, file);

//         if (await fs.pathExists(sourcePath)) {
//           await fs.copy(sourcePath, targetPath);
//           logger.debug(`Copied ${file} to installation directory`);
//         }
//       }
//     } catch (error) {
//       logger.error('Failed to copy application files:', error);
//       throw error;
//     }
//   }

//   /**
//    * Create configuration template
//    */
//   private async createConfigurationTemplate(): Promise<void> {
//     try {
//       const fs = require('fs-extra');
//       const path = require('path');

//       const configTemplate = `# PrintMyFile Agent Configuration
// # Copy this file to .env and configure your settings

// # Required settings
// CLOUD_URL=https://api.printmyfile.com
// AGENT_ID=your-agent-id-here
// API_KEY=your-api-key-here

// # Optional settings
// LOCATION_NAME=Default Location
// LOG_LEVEL=info
// POLL_INTERVAL=5000
// HEARTBEAT_INTERVAL=30000
// DOWNLOAD_DIR=./downloads
// LOG_DIR=./logs
// CONFIG_DIR=./.config

// # Advanced settings
// FILE_WATCH_INTERVAL=60000
// MAX_RETRY_ATTEMPTS=3
// DOWNLOAD_TIMEOUT=30000
// `;

//       const configPath = path.join(platform.getApplicationDataDirectory(), '.env.example');
//       await fs.writeFile(configPath, configTemplate);

//       logger.debug('Configuration template created');
//     } catch (error) {
//       logger.error('Failed to create configuration template:', error);
//       throw error;
//     }
//   }

//   /**
//    * Create startup scripts
//    */
//   private async createStartupScripts(): Promise<void> {
//     try {
//       const fs = require('fs-extra');
//       const path = require('path');

//       const appDir = platform.getApplicationDataDirectory();

//       if (platform.isWindows()) {
//         // Create Windows batch file
//         const batchContent = `@echo off
// cd /d "${appDir}"
// node dist/index.js
// pause`;
        
//         await fs.writeFile(path.join(appDir, 'start-agent.bat'), batchContent);
//       } else {
//         // Create Unix shell script
//         const shellContent = `#!/bin/bash
// cd "${appDir}"
// node dist/index.js "$@"`;
        
//         const scriptPath = path.join(appDir, 'start-agent.sh');
//         await fs.writeFile(scriptPath, shellContent);
//         await fs.chmod(scriptPath, 0o755);
//       }

//       logger.debug('Startup scripts created');
//     } catch (error) {
//       logger.error('Failed to create startup scripts:', error);
//       throw error;
//     }
//   }

//   /**
//    * Create installation record
//    */
//   private async createInstallationRecord(): Promise<void> {
//     try {
//       const fs = require('fs-extra');
//       const path = require('path');

//       const record = {
//         version: '1.0.0',
//         installDate: new Date().toISOString(),
//         installPath: platform.getApplicationDataDirectory(),
//         platform: platform.getPlatformInfo(),
//         nodeVersion: process.version,
//         installerVersion: '1.0.0',
//       };

//       const recordPath = path.join(platform.getApplicationDataDirectory(), '.installation');
//       await fs.writeJson(recordPath, record, { spaces: 2 });

//       logger.debug('Installation record created');
//     } catch (error) {
//       logger.error('Failed to create installation record:', error);
//       throw error;
//     }
//   }

//   /**
//    * Set file permissions
//    */
//   private async setFilePermissions(): Promise<void> {
//     try {
//       await this.permissionsManager.setPermissions();
//     } catch (error) {
//       logger.error('Failed to set file permissions:', error);
//       throw error;
//     }
//   }

//   /**
//    * Create uninstaller
//    */
//   private async createUninstaller(): Promise<void> {
//     try {
//       const fs = require('fs-extra');
//       const path = require('path');

//       const appDir = platform.getApplicationDataDirectory();

//       if (platform.isWindows()) {
//         // Create Windows uninstaller
//         const uninstallContent = `@echo off
// echo Uninstalling PrintMyFile Agent...
// rmdir /s /q "${appDir}"
// echo Uninstallation complete.
// pause`;
        
//         await fs.writeFile(path.join(appDir, 'uninstall.bat'), uninstallContent);
//       } else {
//         // Create Unix uninstaller
//         const uninstallContent = `#!/bin/bash
// echo "Uninstalling PrintMyFile Agent..."
// rm -rf "${appDir}"
// echo "Uninstallation complete."`;
        
//         const uninstallPath = path.join(appDir, 'uninstall.sh');
//         await fs.writeFile(uninstallPath, uninstallContent);
//         await fs.chmod(uninstallPath, 0o755);
//       }

//       logger.debug('Uninstaller created');
//     } catch (error) {
//       logger.error('Failed to create uninstaller:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get free disk space
//    */
//   private async getFreeDiskSpace(): Promise<number> {
//     try {
//       const fs = require('fs-extra');
//       const stats = await fs.stat(platform.getApplicationDataDirectory());
//       // This is a simplified implementation
//       // In a real implementation, you'd use a proper disk space checking library
//       return 1024 * 1024 * 1024; // 1GB placeholder
//     } catch (error) {
//       logger.error('Failed to get free disk space:', error);
//       return 0;
//     }
//   }

//   /**
//    * Compare version strings
//    */
//   private compareVersions(version1: string, version2: string): number {
//     const v1 = version1.replace(/^v/, '').split('.').map(Number);
//     const v2 = version2.split('.').map(Number);

//     for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
//       const num1 = v1[i] || 0;
//       const num2 = v2[i] || 0;
      
//       if (num1 > num2) return 1;
//       if (num1 < num2) return -1;
//     }
    
//     return 0;
//   }
// }
