// ============================================================================
// AUTOSTART SETUP - Configure agent to start automatically
// ============================================================================

import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger.js';
import { platform } from '../utils/platform.js';

export class AutostartSetup {
  /**
   * Configure auto-start
   */
  async configureAutoStart(): Promise<void> {
    try {
      logger.info('Configuring auto-start...');

      if (platform.isWindows()) {
        await this.configureWindowsAutostart();
      } else if (platform.isMacOS()) {
        await this.configureMacOSAutostart();
      } else if (platform.isLinux()) {
        await this.configureLinuxAutostart();
      }

      logger.info('Auto-start configured successfully');
    } catch (error) {
      logger.error('Failed to configure auto-start:', error);
      throw error;
    }
  }

  /**
   * Remove auto-start configuration
   */
  async removeAutoStart(): Promise<void> {
    try {
      logger.info('Removing auto-start configuration...');

      if (platform.isWindows()) {
        await this.removeWindowsAutostart();
      } else if (platform.isMacOS()) {
        await this.removeMacOSAutostart();
      } else if (platform.isLinux()) {
        await this.removeLinuxAutostart();
      }

      logger.info('Auto-start configuration removed');
    } catch (error) {
      logger.error('Failed to remove auto-start:', error);
      throw error;
    }
  }

  /**
   * Check if auto-start is configured
   */
  async isAutoStartConfigured(): Promise<boolean> {
    try {
      if (platform.isWindows()) {
        return await this.isWindowsAutostartConfigured();
      } else if (platform.isMacOS()) {
        return await this.isMacOSAutostartConfigured();
      } else if (platform.isLinux()) {
        return await this.isLinuxAutostartConfigured();
      }

      return false;
    } catch (error) {
      logger.error('Failed to check auto-start configuration:', error);
      return false;
    }
  }

  /**
   * Configure Windows auto-start (Registry)
   */
  private async configureWindowsAutostart(): Promise<void> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const appDir = platform.getApplicationDataDirectory();
      const executablePath = path.join(appDir, 'printmyfile-agent.exe');
      const keyName = 'PrintMyFile Agent';

      // Add to startup registry key
      const command = `reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${keyName}" /t REG_SZ /d "${executablePath}" /f`;
      
      await execAsync(command);
      logger.debug('Windows auto-start configured');
    } catch (error) {
      logger.error('Failed to configure Windows auto-start:', error);
      throw error;
    }
  }

  /**
   * Remove Windows auto-start
   */
  private async removeWindowsAutostart(): Promise<void> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const keyName = 'PrintMyFile Agent';
      const command = `reg delete "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${keyName}" /f`;
      
      await execAsync(command);
      logger.debug('Windows auto-start removed');
    } catch (error) {
      logger.error('Failed to remove Windows auto-start:', error);
      throw error;
    }
  }

  /**
   * Check if Windows auto-start is configured
   */
  private async isWindowsAutostartConfigured(): Promise<boolean> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const keyName = 'PrintMyFile Agent';
      const command = `reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${keyName}"`;
      
      await execAsync(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Configure macOS auto-start (Login Items)
   */
  private async configureMacOSAutostart(): Promise<void> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const appDir = platform.getApplicationDataDirectory();
      const executablePath = path.join(appDir, 'printmyfile-agent');

      // Create application bundle for auto-start
      const os = await import('os');
      const appBundlePath = path.join(os.homedir(), 'Applications', 'PrintMyFile Agent.app');
      await fs.ensureDir(appBundlePath);
      await fs.ensureDir(path.join(appBundlePath, 'Contents', 'MacOS'));

      // Create Info.plist
      const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>printmyfile-agent</string>
    <key>CFBundleIdentifier</key>
    <string>com.printmyfile.agent</string>
    <key>CFBundleName</key>
    <string>PrintMyFile Agent</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>LSBackgroundOnly</key>
    <true/>
</dict>
</plist>`;

      await fs.writeFile(path.join(appBundlePath, 'Contents', 'Info.plist'), infoPlist);

      // Create executable script
      const scriptContent = `#!/bin/bash
"${executablePath}" start`;
      
      await fs.writeFile(path.join(appBundlePath, 'Contents', 'MacOS', 'printmyfile-agent'), scriptContent);
      await fs.chmod(path.join(appBundlePath, 'Contents', 'MacOS', 'printmyfile-agent'), 0o755);

      // Add to login items using osascript
      const script = `tell application "System Events" to make login item at end with properties {path:"${appBundlePath}", hidden:false}`;
      await execAsync(`osascript -e '${script}'`);

      logger.debug('macOS auto-start configured');
    } catch (error) {
      logger.error('Failed to configure macOS auto-start:', error);
      throw error;
    }
  }

  /**
   * Remove macOS auto-start
   */
  private async removeMacOSAutostart(): Promise<void> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const os = await import('os');
      const appBundlePath = path.join(os.homedir(), 'Applications', 'PrintMyFile Agent.app');

      // Remove from login items
      const script = `tell application "System Events" to delete login item "PrintMyFile Agent"`;
      await execAsync(`osascript -e '${script}'`);

      // Remove application bundle
      if (await fs.pathExists(appBundlePath)) {
        await fs.remove(appBundlePath);
      }

      logger.debug('macOS auto-start removed');
    } catch (error) {
      logger.error('Failed to remove macOS auto-start:', error);
      throw error;
    }
  }

  /**
   * Check if macOS auto-start is configured
   */
  private async isMacOSAutostartConfigured(): Promise<boolean> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const script = `tell application "System Events" to get the name of every login item`;
      const { stdout } = await execAsync(`osascript -e '${script}'`);
      
      return stdout.includes('PrintMyFile Agent');
    } catch (error) {
      return false;
    }
  }

  /**
   * Configure Linux auto-start (Desktop Entry)
   */
  private async configureLinuxAutostart(): Promise<void> {
    try {
      const os = await import('os');
      const autostartDir = path.join(os.homedir(), '.config', 'autostart');
      await fs.ensureDir(autostartDir);

      const appDir = platform.getApplicationDataDirectory();
      const executablePath = path.join(appDir, 'printmyfile-agent');

      // Create desktop entry file
      const desktopEntry = `[Desktop Entry]
Type=Application
Version=1.0
Name=PrintMyFile Agent
Comment=PrintMyFile Local Print Agent
Exec=${executablePath} start
Icon=${path.join(appDir, 'icon.png')}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
StartupNotify=false
Terminal=false`;

      const desktopFilePath = path.join(autostartDir, 'printmyfile-agent.desktop');
      await fs.writeFile(desktopFilePath, desktopEntry);
      await fs.chmod(desktopFilePath, 0o755);

      logger.debug('Linux auto-start configured');
    } catch (error) {
      logger.error('Failed to configure Linux auto-start:', error);
      throw error;
    }
  }

  /**
   * Remove Linux auto-start
   */
  private async removeLinuxAutostart(): Promise<void> {
    try {
      const os = await import('os');
      const autostartDir = path.join(os.homedir(), '.config', 'autostart');
      const desktopFilePath = path.join(autostartDir, 'printmyfile-agent.desktop');

      if (await fs.pathExists(desktopFilePath)) {
        await fs.remove(desktopFilePath);
      }

      logger.debug('Linux auto-start removed');
    } catch (error) {
      logger.error('Failed to remove Linux auto-start:', error);
      throw error;
    }
  }

  /**
   * Check if Linux auto-start is configured
   */
  private async isLinuxAutostartConfigured(): Promise<boolean> {
    try {
      const os = await import('os');
      const autostartDir = path.join(os.homedir(), '.config', 'autostart');
      const desktopFilePath = path.join(autostartDir, 'printmyfile-agent.desktop');

      return await fs.pathExists(desktopFilePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get auto-start configuration info
   */
  async getAutostartInfo(): Promise<{
    configured: boolean;
    method: string;
    path: string;
  }> {
    try {
      const configured = await this.isAutoStartConfigured();
      let method = '';
      let autostartPath = '';

      if (platform.isWindows()) {
        method = 'Windows Registry';
        autostartPath = 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
      } else if (platform.isMacOS()) {
        method = 'Login Items';
        autostartPath = '~/Applications/PrintMyFile Agent.app';
      } else if (platform.isLinux()) {
        method = 'Desktop Entry';
        autostartPath = '~/.config/autostart/printmyfile-agent.desktop';
      }

      return {
        configured,
        method,
        path: autostartPath,
      };
    } catch (error) {
      logger.error('Failed to get auto-start info:', error);
      return {
        configured: false,
        method: 'Unknown',
        path: '',
      };
    }
  }

  /**
   * Test auto-start configuration
   */
  async testAutostart(): Promise<boolean> {
    try {
      // This would typically involve checking if the application
      // can be launched automatically. For now, we'll just verify
      // the configuration files exist and are valid.
      
      const configured = await this.isAutoStartConfigured();
      
      if (configured) {
        logger.info('Auto-start configuration test passed');
        return true;
      } else {
        logger.warn('Auto-start configuration test failed - not configured');
        return false;
      }
    } catch (error) {
      logger.error('Auto-start configuration test failed:', error);
      return false;
    }
  }
}
