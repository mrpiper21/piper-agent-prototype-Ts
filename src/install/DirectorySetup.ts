// ============================================================================
// DIRECTORY SETUP - Create necessary directories for installation
// ============================================================================

import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger.js';
import { platform } from '../utils/platform.js';

export class DirectorySetup {
  /**
   * Create all necessary directories
   */
  async createDirectories(): Promise<void> {
    try {
      logger.info('Creating application directories...');

      const directories = [
        platform.getApplicationDataDirectory(),
        platform.getConfigDirectory(),
        platform.getLogsDirectory(),
        platform.getDownloadsDirectory(),
        path.join(platform.getApplicationDataDirectory(), 'queue'),
        path.join(platform.getApplicationDataDirectory(), 'cache'),
        path.join(platform.getApplicationDataDirectory(), 'temp'),
      ];

      for (const dir of directories) {
        await this.createDirectory(dir);
      }

      logger.info('Application directories created successfully');
    } catch (error) {
      logger.error('Failed to create directories:', error);
      throw error;
    }
  }

  /**
   * Create a single directory
   */
  private async createDirectory(dirPath: string): Promise<void> {
    try {
      await fs.ensureDir(dirPath);
      
      // Set appropriate permissions
      await fs.chmod(dirPath, 0o755);
      
      logger.debug(`Created directory: ${dirPath}`);
    } catch (error) {
      logger.error(`Failed to create directory ${dirPath}:`, error);
      throw error;
    }
  }

  /**
   * Create directory with specific permissions
   */
  async createDirectoryWithPermissions(dirPath: string, mode: number = 0o755): Promise<void> {
    try {
      await fs.ensureDir(dirPath);
      await fs.chmod(dirPath, mode);
      
      logger.debug(`Created directory with permissions ${mode.toString(8)}: ${dirPath}`);
    } catch (error) {
      logger.error(`Failed to create directory with permissions ${dirPath}:`, error);
      throw error;
    }
  }

  /**
   * Verify directory structure
   */
  async verifyDirectoryStructure(): Promise<{
    valid: boolean;
    missing: string[];
    invalidPermissions: string[];
  }> {
    try {
      const requiredDirs = [
        platform.getApplicationDataDirectory(),
        platform.getConfigDirectory(),
        platform.getLogsDirectory(),
        platform.getDownloadsDirectory(),
      ];

      const missing: string[] = [];
      const invalidPermissions: string[] = [];

      for (const dir of requiredDirs) {
        if (!(await fs.pathExists(dir))) {
          missing.push(dir);
        } else {
          const stats = await fs.stat(dir);
          if (!stats.isDirectory()) {
            missing.push(dir);
          } else {
            // Check if directory is writable
            try {
              const testFile = path.join(dir, '.test-write');
              await fs.writeFile(testFile, 'test');
              await fs.remove(testFile);
            } catch {
              invalidPermissions.push(dir);
            }
          }
        }
      }

      return {
        valid: missing.length === 0 && invalidPermissions.length === 0,
        missing,
        invalidPermissions,
      };
    } catch (error) {
      logger.error('Failed to verify directory structure:', error);
      return {
        valid: false,
        missing: [],
        invalidPermissions: [],
      };
    }
  }

  /**
   * Clean up temporary directories
   */
  async cleanupTempDirectories(): Promise<void> {
    try {
      const tempDir = path.join(platform.getApplicationDataDirectory(), 'temp');
      
      if (await fs.pathExists(tempDir)) {
        await fs.emptyDir(tempDir);
        logger.debug('Cleaned up temporary directories');
      }
    } catch (error) {
      logger.error('Failed to cleanup temporary directories:', error);
      throw error;
    }
  }

  /**
   * Get directory size
   */
  async getDirectorySize(dirPath: string): Promise<number> {
    try {
      if (!(await fs.pathExists(dirPath))) {
        return 0;
      }

      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        return stats.size;
      }

      let totalSize = 0;
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const itemStats = await fs.stat(itemPath);

        if (itemStats.isDirectory()) {
          totalSize += await this.getDirectorySize(itemPath);
        } else {
          totalSize += itemStats.size;
        }
      }

      return totalSize;
    } catch (error) {
      logger.error(`Failed to get directory size for ${dirPath}:`, error);
      return 0;
    }
  }

  /**
   * Get directory information
   */
  async getDirectoryInfo(dirPath: string): Promise<{
    exists: boolean;
    isDirectory: boolean;
    size: number;
    permissions: string;
    createdAt: Date;
    modifiedAt: Date;
  } | null> {
    try {
      if (!(await fs.pathExists(dirPath))) {
        return {
          exists: false,
          isDirectory: false,
          size: 0,
          permissions: '',
          createdAt: new Date(),
          modifiedAt: new Date(),
        };
      }

      const stats = await fs.stat(dirPath);
      const permissions = stats.mode.toString(8);

      return {
        exists: true,
        isDirectory: stats.isDirectory(),
        size: await this.getDirectorySize(dirPath),
        permissions,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      };
    } catch (error) {
      logger.error(`Failed to get directory info for ${dirPath}:`, error);
      return null;
    }
  }

  /**
   * Remove directory and all contents
   */
  async removeDirectory(dirPath: string): Promise<void> {
    try {
      if (await fs.pathExists(dirPath)) {
        await fs.remove(dirPath);
        logger.debug(`Removed directory: ${dirPath}`);
      }
    } catch (error) {
      logger.error(`Failed to remove directory ${dirPath}:`, error);
      throw error;
    }
  }

  /**
   * Move directory
   */
  async moveDirectory(sourcePath: string, targetPath: string): Promise<void> {
    try {
      await fs.move(sourcePath, targetPath);
      logger.debug(`Moved directory from ${sourcePath} to ${targetPath}`);
    } catch (error) {
      logger.error(`Failed to move directory from ${sourcePath} to ${targetPath}:`, error);
      throw error;
    }
  }

  /**
   * Copy directory
   */
  async copyDirectory(sourcePath: string, targetPath: string): Promise<void> {
    try {
      await fs.copy(sourcePath, targetPath);
      logger.debug(`Copied directory from ${sourcePath} to ${targetPath}`);
    } catch (error) {
      logger.error(`Failed to copy directory from ${sourcePath} to ${targetPath}:`, error);
      throw error;
    }
  }

  /**
   * Create symbolic link
   */
  async createSymbolicLink(targetPath: string, linkPath: string): Promise<void> {
    try {
      await fs.ensureSymlink(targetPath, linkPath);
      logger.debug(`Created symbolic link: ${linkPath} -> ${targetPath}`);
    } catch (error) {
      logger.error(`Failed to create symbolic link ${linkPath} -> ${targetPath}:`, error);
      throw error;
    }
  }

  /**
   * Get all subdirectories
   */
  async getSubdirectories(dirPath: string): Promise<string[]> {
    try {
      if (!(await fs.pathExists(dirPath))) {
        return [];
      }

      const items = await fs.readdir(dirPath, { withFileTypes: true });
      const directories = items
        .filter(item => item.isDirectory())
        .map(item => path.join(dirPath, item.name));

      return directories;
    } catch (error) {
      logger.error(`Failed to get subdirectories for ${dirPath}:`, error);
      return [];
    }
  }

  /**
   * Get directory statistics
   */
  async getDirectoryStats(): Promise<{
    totalDirectories: number;
    totalFiles: number;
    totalSize: number;
    directories: Record<string, number>;
  }> {
    try {
      const appDir = platform.getApplicationDataDirectory();
      
      if (!(await fs.pathExists(appDir))) {
        return {
          totalDirectories: 0,
          totalFiles: 0,
          totalSize: 0,
          directories: {},
        };
      }

      let totalDirectories = 0;
      let totalFiles = 0;
      let totalSize = 0;
      const directories: Record<string, number> = {};

      const processDirectory = async (dirPath: string): Promise<void> => {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item.name);
          
          if (item.isDirectory()) {
            totalDirectories++;
            const size = await this.getDirectorySize(itemPath);
            directories[itemPath] = size;
            totalSize += size;
            await processDirectory(itemPath);
          } else {
            totalFiles++;
            const stats = await fs.stat(itemPath);
            totalSize += stats.size;
          }
        }
      };

      await processDirectory(appDir);

      return {
        totalDirectories,
        totalFiles,
        totalSize,
        directories,
      };
    } catch (error) {
      logger.error('Failed to get directory statistics:', error);
      return {
        totalDirectories: 0,
        totalFiles: 0,
        totalSize: 0,
        directories: {},
      };
    }
  }
}
