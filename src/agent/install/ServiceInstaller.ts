// ============================================================================
// SERVICE INSTALLER - Install agent as system service
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger.js';
import { platform } from '../utils/platform.js';

const execAsync = promisify(exec);

export class ServiceInstaller {
  private serviceName = 'printmyfile-agent';
  private serviceDescription = 'PrintMyFile Local Print Agent';

  /**
   * Install agent as system service
   */
  async installService(): Promise<void> {
    try {
      logger.info('Installing agent as system service...');

      if (platform.isWindows()) {
        await this.installWindowsService();
      } else if (platform.isMacOS()) {
        await this.installMacOSService();
      } else if (platform.isLinux()) {
        await this.installLinuxService();
      } else {
        throw new Error(`Service installation not supported on ${platform.getPlatformInfo().name}`);
      }

      logger.info('Service installed successfully');
    } catch (error) {
      logger.error('Failed to install service:', error);
      throw error;
    }
  }

  /**
   * Uninstall system service
   */
  async uninstallService(): Promise<void> {
    try {
      logger.info('Uninstalling system service...');

      if (platform.isWindows()) {
        await this.uninstallWindowsService();
      } else if (platform.isMacOS()) {
        await this.uninstallMacOSService();
      } else if (platform.isLinux()) {
        await this.uninstallLinuxService();
      }

      logger.info('Service uninstalled successfully');
    } catch (error) {
      logger.error('Failed to uninstall service:', error);
      throw error;
    }
  }

  /**
   * Start the service
   */
  async startService(): Promise<void> {
    try {
      logger.info('Starting service...');

      if (platform.isWindows()) {
        await execAsync(`sc start "${this.serviceName}"`);
      } else if (platform.isMacOS()) {
        await execAsync(`sudo launchctl start ${this.serviceName}`);
      } else if (platform.isLinux()) {
        await execAsync(`sudo systemctl start ${this.serviceName}`);
      }

      logger.info('Service started successfully');
    } catch (error) {
      logger.error('Failed to start service:', error);
      throw error;
    }
  }

  /**
   * Stop the service
   */
  async stopService(): Promise<void> {
    try {
      logger.info('Stopping service...');

      if (platform.isWindows()) {
        await execAsync(`sc stop "${this.serviceName}"`);
      } else if (platform.isMacOS()) {
        await execAsync(`sudo launchctl stop ${this.serviceName}`);
      } else if (platform.isLinux()) {
        await execAsync(`sudo systemctl stop ${this.serviceName}`);
      }

      logger.info('Service stopped successfully');
    } catch (error) {
      logger.error('Failed to stop service:', error);
      throw error;
    }
  }

  /**
   * Check if service is installed
   */
  async isServiceInstalled(): Promise<boolean> {
    try {
      if (platform.isWindows()) {
        const { stdout } = await execAsync(`sc query "${this.serviceName}"`);
        return stdout.includes('SERVICE_NAME');
      } else if (platform.isMacOS()) {
        const { stdout } = await execAsync(`launchctl list | grep ${this.serviceName}`);
        return stdout.trim().length > 0;
      } else if (platform.isLinux()) {
        const { stdout } = await execAsync(`systemctl is-enabled ${this.serviceName}`);
        return stdout.includes('enabled') || stdout.includes('disabled');
      }

      return false;
    } catch (error) {
      logger.debug('Service not found:', error);
      return false;
    }
  }

  /**
   * Get service status
   */
  async getServiceStatus(): Promise<{
    installed: boolean;
    running: boolean;
    enabled: boolean;
  }> {
    try {
      const installed = await this.isServiceInstalled();
      let running = false;
      let enabled = false;

      if (installed) {
        if (platform.isWindows()) {
          const { stdout } = await execAsync(`sc query "${this.serviceName}"`);
          running = stdout.includes('RUNNING');
          enabled = stdout.includes('AUTO_START');
        } else if (platform.isMacOS()) {
          const { stdout } = await execAsync(`launchctl list | grep ${this.serviceName}`);
          running = stdout.includes('com.printmyfile.agent');
          enabled = true; // macOS services are enabled when installed
        } else if (platform.isLinux()) {
          const { stdout: status } = await execAsync(`systemctl is-active ${this.serviceName}`);
          const { stdout: enabledStatus } = await execAsync(`systemctl is-enabled ${this.serviceName}`);
          running = status.includes('active');
          enabled = enabledStatus.includes('enabled');
        }
      }

      return {
        installed,
        running,
        enabled,
      };
    } catch (error) {
      logger.error('Failed to get service status:', error);
      return {
        installed: false,
        running: false,
        enabled: false,
      };
    }
  }

  /**
   * Install Windows service
   */
  private async installWindowsService(): Promise<void> {
    try {
      const appDir = platform.getApplicationDataDirectory();
      const executablePath = path.join(appDir, 'printmyfile-agent.exe');

      // Create service using sc command
      const command = `sc create "${this.serviceName}" binPath= "${executablePath}" start= auto DisplayName= "${this.serviceDescription}"`;
      await execAsync(command);

      logger.debug('Windows service created');
    } catch (error) {
      logger.error('Failed to install Windows service:', error);
      throw error;
    }
  }

  /**
   * Uninstall Windows service
   */
  private async uninstallWindowsService(): Promise<void> {
    try {
      await execAsync(`sc delete "${this.serviceName}"`);
      logger.debug('Windows service deleted');
    } catch (error) {
      logger.error('Failed to uninstall Windows service:', error);
      throw error;
    }
  }

  /**
   * Install macOS service (LaunchDaemon)
   */
  private async installMacOSService(): Promise<void> {
    try {
      const plistPath = `/Library/LaunchDaemons/com.printmyfile.agent.plist`;
      const appDir = platform.getApplicationDataDirectory();
      const executablePath = path.join(appDir, 'printmyfile-agent');

      // Create plist file
      const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.printmyfile.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>${executablePath}</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>${appDir}</string>
    <key>StandardOutPath</key>
    <string>${platform.getLogsDirectory()}/service.log</string>
    <key>StandardErrorPath</key>
    <string>${platform.getLogsDirectory()}/service-error.log</string>
</dict>
</plist>`;

      await fs.writeFile(plistPath, plistContent);
      await execAsync(`sudo chown root:wheel ${plistPath}`);
      await execAsync(`sudo chmod 644 ${plistPath}`);

      // Load the service
      await execAsync(`sudo launchctl load -w ${plistPath}`);

      logger.debug('macOS service installed');
    } catch (error) {
      logger.error('Failed to install macOS service:', error);
      throw error;
    }
  }

  /**
   * Uninstall macOS service
   */
  private async uninstallMacOSService(): Promise<void> {
    try {
      const plistPath = `/Library/LaunchDaemons/com.printmyfile.agent.plist`;
      
      // Unload the service
      await execAsync(`sudo launchctl unload -w ${plistPath}`);
      
      // Remove plist file
      await execAsync(`sudo rm ${plistPath}`);

      logger.debug('macOS service uninstalled');
    } catch (error) {
      logger.error('Failed to uninstall macOS service:', error);
      throw error;
    }
  }

  /**
   * Install Linux service (systemd)
   */
  private async installLinuxService(): Promise<void> {
    try {
      const servicePath = `/etc/systemd/system/${this.serviceName}.service`;
      const appDir = platform.getApplicationDataDirectory();
      const executablePath = path.join(appDir, 'printmyfile-agent');

      // Create service file
      const serviceContent = `[Unit]
Description=${this.serviceDescription}
After=network.target

[Service]
Type=simple
User=printmyfile
Group=printmyfile
WorkingDirectory=${appDir}
ExecStart=${executablePath} start
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${this.serviceName}

[Install]
WantedBy=multi-user.target`;

      await fs.writeFile(servicePath, serviceContent);

      // Create user and group if they don't exist
      try {
        await execAsync('sudo useradd -r -s /bin/false printmyfile');
      } catch {
        // User already exists, ignore error
      }

      try {
        await execAsync('sudo groupadd -r printmyfile');
      } catch {
        // Group already exists, ignore error
      }

      // Set ownership
      await execAsync(`sudo chown -R printmyfile:printmyfile ${appDir}`);

      // Reload systemd and enable service
      await execAsync('sudo systemctl daemon-reload');
      await execAsync(`sudo systemctl enable ${this.serviceName}`);

      logger.debug('Linux service installed');
    } catch (error) {
      logger.error('Failed to install Linux service:', error);
      throw error;
    }
  }

  /**
   * Uninstall Linux service
   */
  private async uninstallLinuxService(): Promise<void> {
    try {
      const servicePath = `/etc/systemd/system/${this.serviceName}.service`;
      
      // Stop and disable service
      await execAsync(`sudo systemctl stop ${this.serviceName}`);
      await execAsync(`sudo systemctl disable ${this.serviceName}`);
      
      // Remove service file
      await execAsync(`sudo rm ${servicePath}`);
      
      // Reload systemd
      await execAsync('sudo systemctl daemon-reload');

      logger.debug('Linux service uninstalled');
    } catch (error) {
      logger.error('Failed to uninstall Linux service:', error);
      throw error;
    }
  }

  /**
   * Create service configuration
   */
  async createServiceConfig(): Promise<void> {
    try {
      const configPath = path.join(platform.getConfigDirectory(), 'service.json');
      
      const config = {
        serviceName: this.serviceName,
        description: this.serviceDescription,
        platform: platform.getPlatformInfo().name,
        installed: await this.isServiceInstalled(),
        installDate: new Date().toISOString(),
      };

      await fs.writeJson(configPath, config, { spaces: 2 });
      logger.debug('Service configuration created');
    } catch (error) {
      logger.error('Failed to create service configuration:', error);
      throw error;
    }
  }

  /**
   * Get service logs
   */
  async getServiceLogs(lines: number = 100): Promise<string[]> {
    try {
      let command = '';

      if (platform.isWindows()) {
        command = `powershell "Get-EventLog -LogName Application -Source '${this.serviceName}' -Newest ${lines} | Select-Object TimeGenerated, Message | Format-Table -Wrap"`;
      } else if (platform.isMacOS()) {
        command = `log show --predicate 'process == "${this.serviceName}"' --last ${lines} --info`;
      } else if (platform.isLinux()) {
        command = `journalctl -u ${this.serviceName} -n ${lines} --no-pager`;
      }

      if (command) {
        const { stdout } = await execAsync(command);
        return stdout.split('\n').filter(line => line.trim());
      }

      return [];
    } catch (error) {
      logger.error('Failed to get service logs:', error);
      return [];
    }
  }
}
