import { ipcMain, Notification } from 'electron';
import { dbService } from '../services/DatabaseService';
import { agentService } from '../services/AgentService';
import { apiService } from '../services/api';
import { updateService } from '../services/UpdateService';
import { logger } from '../utils/logger';
import { sendClerkWelcomeEmail } from '../services/EmailService';
import fs from 'fs';
import type {
  LoginCredentials,
  AuthResponse,
  CreateUserData,
  UpdateUserData,
  PrintOptions,
  createClerkData,
} from '../../shared/types/ipc.types';

export function setupIpcHandlers() {
  // Auth handlers
  ipcMain.handle('auth:login', async (_, credentials: LoginCredentials) => {
    try {
      // Use the API service to authenticate with the backend
      const response = await apiService.login(credentials.email, credentials.password);

      logger.info('User logged in', {
        email: credentials.email,
        hasLocation: !!response.user.location,
        isTemporaryPassword: response.user.isTemporaryPassword,
      });

      // Priority 1: Check if clerk has temporary password (must change password first)
      // If isTemporaryPassword is true, user is a clerk and must change password
      if (response.user.isTemporaryPassword === true) {
        logger.info('Clerk logged in with temporary password, password setup required', {
          email: credentials.email,
        });

        // Show notification that password change is required
        new Notification({
          title: 'Password Change Required',
          body: 'Please set a new password to continue',
          silent: false,
        }).show();

        return {
          user: response.user,
          token: response.token,
          requiresLocation: false,
          requiresPasswordSetup: true, // Password setup required, user cannot be authenticated yet
        } as AuthResponse & { requiresLocation: boolean; requiresPasswordSetup: boolean };
      }

      // Priority 2: If isTemporaryPassword is not present, user is an admin
      // Check if admin has location set
      if (response.user.location) {
        // User has location - save to local database and authenticate
        try {
          // Create user with basic data first
          const createdUser = dbService.createUser({
            name: response.user.name,
            email: response.user.email,
          });
          // Then update with full data if needed
          if (response.user.location) {
            dbService.updateUser(createdUser.id, {
              location: response.user.location,
            });
          }
          logger.info('User saved to local database (has location)');
        } catch (dbError) {
          logger.warn('Failed to save user to local database, continuing anyway', dbError);
        }

        // Show success notification
        new Notification({
          title: 'Login Successful',
          body: `Welcome ${response.user.name}!`,
          silent: false,
        }).show();

        return {
          user: response.user,
          token: response.token,
          requiresLocation: false, // Location exists, user can be authenticated
          requiresPasswordSetup: false,
        } as AuthResponse & { requiresLocation: boolean; requiresPasswordSetup: boolean };
      } else {
        // User doesn't have location - DON'T save to database, DON'T authenticate
        logger.info('User logged in but location required', { email: credentials.email });

        // Show notification that location is required
        new Notification({
          title: 'Location Required',
          body: 'Please set your location to continue',
          silent: false,
        }).show();

        return {
          user: response.user,
          token: response.token,
          requiresLocation: true, // Location required, user cannot be authenticated yet
          requiresPasswordSetup: false,
        } as AuthResponse & { requiresLocation: boolean; requiresPasswordSetup: boolean };
      }
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

  ipcMain.handle('auth:refresh', async (_) => {
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

  ipcMain.handle(
    'auth:updateProfile',
    async (
      _,
      updates: {
        name?: string;
        email?: string;
        location?: { latitude: number; longitude: number; address: string };
      }
    ) => {
      try {
        logger.info('Updating profile with data:', updates);

        // Update profile via API using /auth/profile endpoint
        const user = await apiService.updateProfile(updates);

        logger.info('Profile updated successfully via API');

        // Also update local database if user ID exists
        if (user.id) {
          try {
            dbService.updateUser(user.id, updates);
            logger.info('Profile updated in local database');
          } catch (dbError) {
            logger.warn('Failed to update profile in local database, continuing anyway', dbError);
          }
        }

        return user;
      } catch (error) {
        logger.error('Update profile error', error);
        throw error;
      }
    }
  );

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
      logger.info(`Updating user ${id} with data:`, data);

      // Update via API to sync with backend first
      const user = await apiService.updateUser(id, data);

      logger.info(`User ${id} updated successfully via API`);

      // Also update local database
      dbService.updateUser(id, data);

      logger.info(`User ${id} updated in local database`);

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

  // Admin Management handlers
  ipcMain.handle('adminManagement:createClerk', async (_, data: createClerkData) => {
    try {
      logger.info('Creating clerk via API', { email: data.email });
      const user = await apiService.createClerk(data);
      logger.info('Clerk created successfully via API', { userId: user.id });

      // Send welcome email with temporary password
      await sendClerkWelcomeEmail({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      return user;
    } catch (error) {
      logger.error('Create clerk error', error);
      throw error;
    }
  });

  ipcMain.handle('adminManagement:getMyClerks', async (_, adminId: string) => {
    try {
      logger.info('IPC handler received getMyClerks', {
        adminId,
        type: typeof adminId,
        isUndefined: adminId === undefined,
        isNull: adminId === null,
        isEmpty: adminId === '',
      });

      if (!adminId || adminId === 'undefined' || adminId === 'null' || adminId === '') {
        logger.error('adminId is required but was not provided or is invalid', { adminId });
        throw new Error('Admin ID is required');
      }

      logger.info('Fetching admin clerks via API', { adminId });
      const clerks = await apiService.getMyClerks(adminId);
      logger.info('Fetched clerks successfully', { count: clerks.length, adminId });
      return clerks;
    } catch (error) {
      logger.error('Get my clerks error', { error, adminId });
      throw error;
    }
  });

  ipcMain.handle(
    'adminManagement:changeClerkPassword',
    async (_, clerkId: string, newPassword: string) => {
      try {
        logger.info('Changing clerk password via API', { clerkId });
        const updatedClerk = await apiService.changeClerkPassword(clerkId, newPassword);
        logger.info('Clerk password changed successfully via API', { clerkId });
        return updatedClerk;
      } catch (error) {
        logger.error('Change clerk password error', error);
        throw error;
      }
    }
  );

  // Files handlers
  ipcMain.handle('files:save', async (_, filePath: string, content: string) => {
    try {
      await fs.promises.writeFile(filePath, content);
      logger.info('File saved', { path: filePath });
    } catch (error) {
      logger.error('File save error', error);
      throw error;
    }
  });

  ipcMain.handle('files:read', async (_, filePath: string) => {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
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

  // Dashboard handlers
  ipcMain.handle('dashboard:getStats', async (_, date?: string) => {
    try {
      return await apiService.getDashboardStats(date);
    } catch (error) {
      logger.error('Get dashboard stats error', error);
      throw error;
    }
  });

  ipcMain.handle('dashboard:getWeeklyActivity', async () => {
    try {
      return await apiService.getWeeklyActivity();
    } catch (error) {
      logger.error('Get weekly activity error', error);
      throw error;
    }
  });

  ipcMain.handle('dashboard:getJobsByDate', async (_, date: string) => {
    try {
      return await apiService.getJobsByDate(date);
    } catch (error) {
      logger.error('Get jobs by date error', error);
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

  // Update handlers
  ipcMain.handle('update:check', async () => {
    try {
      await updateService.checkForUpdates();
      return { success: true };
    } catch (error) {
      logger.error('Update check error', error);
      throw error;
    }
  });

  ipcMain.handle('update:getVersion', async () => {
    return { version: updateService.getCurrentVersion() };
  });

  // Location handlers - fallback if browser geolocation fails
  ipcMain.handle('location:getCurrentPosition', async () => {
    // This is a fallback - browser geolocation should work with proper permissions
    // For now, we'll return an error to use browser geolocation
    throw new Error('Please use browser geolocation API. Ensure location permissions are granted.');
  });

  logger.info('IPC handlers registered');
}
