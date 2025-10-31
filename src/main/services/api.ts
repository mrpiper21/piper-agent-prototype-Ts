import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import fs from 'fs';
import path from 'path';
import type { AnalyticsData, PrinterAgent, PrinterLog, PrintJob, User } from '../types';

// Use environment variable with production default, fallback to localhost for development
// const API_BASE_URL = process.env.API_BASE_URL || (
//   process.env.NODE_ENV === 'development' 
//     ? 'http://localhost:3000/api' 
//     : 'https://piper-server-prototype-ts.onrender.com/api'
// );

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: "https://piper-server-prototype-ts.onrender.com/api",
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('auth-token');
    }
    // For Node.js/Electron environment
    try {
      const tokenPath = path.join(process.cwd(), '.auth-token');
      if (fs.existsSync(tokenPath)) {
        return fs.readFileSync(tokenPath, 'utf8').trim();
      }
    } catch (error) {
      // Ignore file system errors
    }
    return null;
  }

  private setToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth-token', token);
    } else {
      try {
        const tokenPath = path.join(process.cwd(), '.auth-token');
        fs.writeFileSync(tokenPath, token, 'utf8');
      } catch (error) {
        // Ignore file system errors
      }
    }
  }

  private clearToken(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth-token');
    } else {
      try {
        const tokenPath = path.join(process.cwd(), '.auth-token');
        if (fs.existsSync(tokenPath)) {
          fs.unlinkSync(tokenPath);
        }
      } catch (error) {
        // Ignore file system errors
      }
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await this.axiosInstance.post('/auth/login', { email, password });
      
      // Backend returns: { success: true, data: { user, token } }
      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }
      
      const { user, token } = response.data.data;
      
      // Store token for future requests
      this.setToken(token);
      
      return { user, token };
    } catch (error: any) {
      // Log detailed error info
      console.error('Login API Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      
      // Throw a more descriptive error
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<{ user: User; token: string }> {
    
    const response = await this.axiosInstance.post('/auth/register', userData);
    return response.data.data;
  }

  async getProfile(): Promise<User> {
    
    const response = await this.axiosInstance.get('/auth/profile');
    return response.data.data.user;
  }

  async updateProfile(updates: { name?: string; email?: string }): Promise<User> {
    
    const response = await this.axiosInstance.put('/auth/profile', updates);
    return response.data.data.user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    
    await this.axiosInstance.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  async logout(): Promise<void> {
    
    await this.axiosInstance.post('/auth/logout');
  }

  async refreshToken(): Promise<{ token: string }> {
    
    const response = await this.axiosInstance.post('/auth/refresh');
    return response.data.data;
  }

  // Print Jobs
  async getJobs(): Promise<PrintJob[]> {
    
    const response = await this.axiosInstance.get('/print/jobs');
    return response.data.data;
  }

  async getJob(id: string): Promise<PrintJob> {
    
    const response = await this.axiosInstance.get(`/print/jobs/${id}`);
    return response.data.data;
  }

  async createJob(job: Omit<PrintJob, 'id' | 'submittedAt'>): Promise<PrintJob> {
    
    const response = await this.axiosInstance.post('/print/jobs', job);
    return response.data.data;
  }

  async updateJob(id: string, updates: Partial<PrintJob>): Promise<PrintJob> {
    
    const response = await this.axiosInstance.put(`/print/jobs/${id}/status`, updates);
    return response.data.data;
  }

  async deleteJob(id: string): Promise<void> {
    
    await this.axiosInstance.delete(`/print/jobs/${id}`);
  }

  async submitJobToPrinter(jobId: string, agentId: string): Promise<void> {
    
    await this.axiosInstance.post(`/print/jobs/${jobId}/submit`, { agentId });
  }

  // Printer Agents
  async getAgents(): Promise<PrinterAgent[]> {
    
    const response = await this.axiosInstance.get('/print/agents');
    return response.data.data;
  }

  async getAgent(id: string): Promise<PrinterAgent> {
    
    const response = await this.axiosInstance.get(`/print/agents/${id}`);
    return response.data.data;
  }

  async updateAgentStatus(id: string, status: PrinterAgent['status']): Promise<PrinterAgent> {
    
    const response = await this.axiosInstance.patch(`/print/agents/${id}/status`, { status });
    return response.data.data;
  }

  // Printer Logs
  async getLogs(agentId?: string): Promise<PrinterLog[]> {
    
    const params = agentId ? { agentId } : {};
    const response = await this.axiosInstance.get('/print/logs', { params });
    return response.data.data;
  }

  async getLogsByDateRange(startDate: string, endDate: string): Promise<PrinterLog[]> {
    
    const response = await this.axiosInstance.get('/print/logs', {
      params: { startDate, endDate },
    });
    return response.data.data;
  }

  // Analytics
  async getAnalytics(dateRange?: { start: string; end: string }): Promise<AnalyticsData> {
    
    const params = dateRange ? { start: dateRange.start, end: dateRange.end } : {};
    const response = await this.axiosInstance.get('/print/analytics', { params });
    return response.data.data;
  }

  async getComparisonData(): Promise<{
    requestedJobs: PrintJob[];
    actualPrints: PrinterLog[];
    discrepancies: Array<{
      jobId: string;
      requestedPages: number;
      actualPages: number;
      difference: number;
    }>;
  }> {
    
    const response = await this.axiosInstance.get('/print/analytics/comparison');
    return response.data.data;
  }

  // User Management (Admin only)
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<{
    users: User[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }> {
    
    const response = await this.axiosInstance.get('/users', { params });
    return response.data.data;
  }

  async getUserById(id: string): Promise<User> {

    const response = await this.axiosInstance.get(`/users/${id}`);
    return response.data.data.user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    
    const response = await this.axiosInstance.put(`/users/${id}`, updates);
    return response.data.data.user;
  }

  async deleteUser(id: string): Promise<void> {
    
    await this.axiosInstance.delete(`/users/${id}`);
  }

  async resetUserPassword(id: string, newPassword: string): Promise<void> {
    
    await this.axiosInstance.put(`/users/${id}/reset-password`, { newPassword });
  }

  async getUsersByRole(role: string): Promise<User[]> {
    
    const response = await this.axiosInstance.get(`/users/role/${role}`);
    return response.data.data.users;
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    usersByRole: Array<{ _id: string; count: number }>;
    recentUsers: User[];
  }> {
    
    const response = await this.axiosInstance.get('/users/stats');
    return response.data.data;
  }

  async bulkUpdateUserRoles(userIds: string[], role: string): Promise<{
    modifiedCount: number;
  }> {
    
    const response = await this.axiosInstance.put('/users/bulk-update-roles', {
      userIds,
      role,
    });
    return response.data.data;
  }

  // File Upload
  async uploadFile(file: File): Promise<{ fileId: string; fileName: string; fileSize: number }> {
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.axiosInstance.post('/print/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data;
  }

  // Dashboard
  async getDashboardStats(date?: string): Promise<{
    todaysJobs: number;
    completedJobs: number;
    pendingJobs: number;
    failedJobs: number;
    totalJobs: number;
  }> {
    const params = date ? { date } : {};
    const response = await this.axiosInstance.get('/dashboard/stats', { params });
    return response.data.data;
  }

  async getWeeklyActivity(): Promise<Array<{
    date: string;
    count: number;
  }>> {
    const response = await this.axiosInstance.get('/dashboard/weekly');
    return response.data.data;
  }

  async getJobsByDate(date: string): Promise<PrintJob[]> {
    const response = await this.axiosInstance.get('/dashboard/jobs-by-date', {
      params: { date },
    });
    return response.data.data;
  }

  // Health check
  async healthCheck(): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
    version: string;
  }> {
    const response = await this.axiosInstance.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();