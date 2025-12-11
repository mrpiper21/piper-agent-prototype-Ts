import { Tray, Menu, app, BrowserWindow } from 'electron';
import path from 'path';
import { logger } from '../utils/logger';
import { storageService } from './StorageService';

/**
 * System tray service for native desktop integration
 */
class TrayService {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;

  initialize(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;

    try {
      // Get icon path
      let iconPath: string;
      if (app.isPackaged) {
        iconPath = path.join(process.resourcesPath, 'build', 'icon.png');
      } else {
        // In development, __dirname is in out/main, so go up to project root
        // The icon is in src/assets/printAgentLogo.png
        const fs = require('fs');
        const possiblePaths = [
          path.join(__dirname, '../../src/assets/printAgentLogo.png'), // out/main -> src/assets
          path.join(__dirname, '../../assets/printAgentLogo.png'), // out/main -> assets (fallback)
        ];
        
        // Find the first existing path
        iconPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];
        
        if (!fs.existsSync(iconPath)) {
          logger.warn(`Tray icon not found. Tried: ${possiblePaths.join(', ')}. Skipping tray initialization.`);
          return;
        }
        
        logger.info(`Using tray icon: ${iconPath}`);
      }

      // Create tray
      this.tray = new Tray(iconPath);
      this.tray.setToolTip('PrintMyFile Agent');

      // Create context menu
      this.updateMenu();

      // Handle tray click
      this.tray.on('click', () => {
        if (this.mainWindow) {
          if (this.mainWindow.isVisible()) {
            this.mainWindow.hide();
          } else {
            this.mainWindow.show();
            this.mainWindow.focus();
          }
        }
      });

      // Handle double click
      this.tray.on('double-click', () => {
        if (this.mainWindow) {
          this.mainWindow.show();
          this.mainWindow.focus();
        }
      });

      logger.info('System tray initialized');
    } catch (error) {
      logger.error('Failed to initialize system tray:', error);
    }
  }

  private updateMenu() {
    if (!this.tray) return;

    const settings = storageService.getSettings();
    const isMinimizeToTray = settings?.minimizeToTray ?? true;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show PrintMyFile Agent',
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.show();
            this.mainWindow.focus();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Minimize to Tray',
        type: 'checkbox',
        checked: isMinimizeToTray,
        click: (item) => {
          storageService.updateSettings({ minimizeToTray: item.checked });
          this.updateMenu();
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

export const trayService = new TrayService();

