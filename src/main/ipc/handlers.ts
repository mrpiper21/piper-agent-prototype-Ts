import { ipcMain, Notification } from 'electron';
import { dbService } from '../services/DatabaseService';
import { agentService } from '../services/AgentService';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';
import type {
  LoginCredentials,
  AuthResponse,
  CreateUserData,
  UpdateUserData,
  PrintOptions,
} from '../../shared/types/ipc.types';

export function setupIpcHandlers() {
  // Auth handlers
  ipcMain.handle('auth:login', async (_, credentials: LoginCredentials) => {
    try {
      // Use the API service to authenticate with the backend
      const response = await apiService.login(credentials.email, credentials.password);

      logger.info('User logged in', { email: credentials.email });

      // Show success notification
      new Notification({
        title: 'Login Successful',
        body: `Welcome ${response.user.name}!`,
        silent: false,
      }).show();

      return {
        user: response.user,
        token: response.token,
      } as AuthResponse;
    } catch (error: any) {
      logger.error('Login error', error);

      // Show error notification
      new Notification({
        title: 'Login Failed',
        body: error.message || 'Invalid credentials',
        silent: false,
      }).show();

      throw error;
    }
  });

  ipcMain.handle('auth:logout', async (_) => {
    try {
      await apiService.logout();
      // Note: token management handled by apiService
      logger.info('User logged out');

      // Show notification
      new Notification({
        title: 'Logged Out',
        body: 'You have been logged out successfully',
        silent: false,
      }).show();
    } catch (error) {
      logger.error('Logout error', error);
      throw error;
    }
  });

  ipcMain.handle('auth:refresh', async (_, token: string) => {
    try {
      // Use the API service to refresh token
      const response = await apiService.refreshToken();

      logger.info('Token refreshed');

      return response.token;
    } catch (error) {
      logger.error('Token refresh error', error);
      throw error;
    }
  });

  // Users handlers
  ipcMain.handle('users:getAll', async () => {
    try {
      return dbService.getAllUsers();
    } catch (error) {
      logger.error('Get users error', error);
      throw error;
    }
  });

  ipcMain.handle('users:getById', async (_, id: string) => {
    try {
      const user = dbService.getUserById(id);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      logger.error('Get user error', error);
      throw error;
    }
  });

  ipcMain.handle('users:create', async (_, data: CreateUserData) => {
    try {
      return dbService.createUser(data);
    } catch (error) {
      logger.error('Create user error', error);
      throw error;
    }
  });

  ipcMain.handle('users:update', async (_, id: string, data: UpdateUserData) => {
    try {
      const user = dbService.updateUser(id, data);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      logger.error('Update user error', error);
      throw error;
    }
  });

  ipcMain.handle('users:delete', async (_, id: string) => {
    try {
      dbService.deleteUser(id);
    } catch (error) {
      logger.error('Delete user error', error);
      throw error;
    }
  });

  // Files handlers
  ipcMain.handle('files:save', async (_, filePath: string, content: string) => {
    try {
      const fs = require('fs').promises;
      await fs.writeFile(filePath, content, 'utf-8');
      logger.info('File saved', { path: filePath });
    } catch (error) {
      logger.error('File save error', error);
      throw error;
    }
  });

  ipcMain.handle('files:read', async (_, filePath: string) => {
    try {
      const fs = require('fs').promises;
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      logger.error('File read error', error);
      throw error;
    }
  });

  // Agent handlers
  ipcMain.handle('agent:start', async () => {
    try {
      await agentService.start();
      logger.info('Agent started via IPC');
      return { success: true };
    } catch (error) {
      logger.error('Agent start error', error);
      throw error;
    }
  });

  ipcMain.handle('agent:stop', async () => {
    try {
      await agentService.stop();
      logger.info('Agent stopped via IPC');
      return { success: true };
    } catch (error) {
      logger.error('Agent stop error', error);
      throw error;
    }
  });

  ipcMain.handle('agent:getStatus', async () => {
    try {
      return agentService.getStatus();
    } catch (error) {
      logger.error('Agent getStatus error', error);
      throw error;
    }
  });

  ipcMain.handle('agent:getPrinters', async () => {
    try {
      return agentService.getPrinters();
    } catch (error) {
      logger.error('Agent getPrinters error', error);
      throw error;
    }
  });

  ipcMain.handle('agent:discoverPrinters', async () => {
    try {
      return await agentService.discoverPrinters();
    } catch (error) {
      logger.error('Agent discoverPrinters error', error);
      throw error;
    }
  });

  ipcMain.handle(
    'agent:printFile',
    async (_, printerName: string, filePath: string, options?: PrintOptions) => {
      try {
        await agentService.printFile(printerName, filePath, options || {});
        logger.info('Print job sent via IPC', { printerName, filePath });
      } catch (error) {
        logger.error('Agent printFile error', error);
        throw error;
      }
    }
  );

  ipcMain.handle('agent:testPrint', async (_, printerName: string, filePath: string) => {
    try {
      await agentService.testPrint(printerName, filePath);
      logger.info('Test print sent via IPC', { printerName, filePath });
    } catch (error) {
      logger.error('Agent testPrint error', error);
      throw error;
    }
  });

  ipcMain.handle('agent:isRunning', async () => {
    try {
      return agentService.isAgentRunning();
    } catch (error) {
      logger.error('Agent isRunning error', error);
      throw error;
    }
  });

  // Printer logs handlers
  ipcMain.handle('logs:getLogs', async (_, agentId?: string) => {
    try {
      return await apiService.getLogs(agentId);
    } catch (error) {
      logger.error('Get logs error', error);
      throw error;
    }
  });

  ipcMain.handle('logs:getLogsByDateRange', async (_, startDate: string, endDate: string) => {
    try {
      return await apiService.getLogsByDateRange(startDate, endDate);
    } catch (error) {
      logger.error('Get logs by date range error', error);
      throw error;
    }
  });

  // Print jobs handlers
  ipcMain.handle('jobs:getAll', async () => {
    try {
      return await apiService.getJobs();
    } catch (error) {
      logger.error('Get jobs error', error);
      throw error;
    }
  });

  ipcMain.handle('jobs:getById', async (_, id: string) => {
    try {
      return await apiService.getJob(id);
    } catch (error) {
      logger.error('Get job error', error);
      throw error;
    }
  });

  ipcMain.handle('jobs:create', async (_, job: any) => {
    try {
      return await apiService.createJob(job);
    } catch (error) {
      logger.error('Create job error', error);
      throw error;
    }
  });

  ipcMain.handle('jobs:update', async (_, id: string, updates: any) => {
    try {
      return await apiService.updateJob(id, updates);
    } catch (error) {
      logger.error('Update job error', error);
      throw error;
    }
  });

  ipcMain.handle('jobs:submitToPrinter', async (_, jobId: string, agentId: string) => {
    try {
      await apiService.submitJobToPrinter(jobId, agentId);
    } catch (error) {
      logger.error('Submit job to printer error', error);
      throw error;
    }
  });

  // Agents handlers
  ipcMain.handle('agents:getAll', async () => {
    try {
      return await apiService.getAgents();
    } catch (error) {
      logger.error('Get agents error', error);
      throw error;
    }
  });

  ipcMain.handle('agents:getById', async (_, id: string) => {
    try {
      return await apiService.getAgent(id);
    } catch (error) {
      logger.error('Get agent error', error);
      throw error;
    }
  });

  ipcMain.handle('agents:updateStatus', async (_, id: string, status: string) => {
    try {
      return await apiService.updateAgentStatus(id, status as any);
    } catch (error) {
      logger.error('Update agent status error', error);
      throw error;
    }
  });

  // Analytics handlers
  ipcMain.handle('analytics:getData', async (_, dateRange?: { start: string; end: string }) => {
    try {
      return await apiService.getAnalytics(dateRange);
    } catch (error) {
      logger.error('Get analytics error', error);
      throw error;
    }
  });

  ipcMain.handle('analytics:getComparison', async () => {
    try {
      return await apiService.getComparisonData();
    } catch (error) {
      logger.error('Get comparison data error', error);
      throw error;
    }
  });

  // File upload handler
  ipcMain.handle('files:upload', async (_, filePath: string) => {
    try {
      // For file upload, return a mock response since this is running in Node.js context
      return {
        fileId: `file-${Date.now()}`,
        fileName: filePath.split('/').pop() || 'file',
        fileSize: 0,
      };
    } catch (error) {
      logger.error('File upload error', error);
      throw error;
    }
  });

  // Health check handler
  ipcMain.handle('health:check', async () => {
    try {
      return await apiService.healthCheck();
    } catch (error) {
      logger.error('Health check error', error);
      throw error;
    }
  });

  logger.info('IPC handlers registered');
}
