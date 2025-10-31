import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { electronAPI } from '../../../lib';

// Types for dashboard data
export interface DashboardStats {
  todaysJobs: number;
  completedJobs: number;
  pendingJobs: number;
  failedJobs: number;
  totalJobs: number;
}

export interface WeeklyActivityItem {
  date: string;
  count: number;
}

export interface PrintJob {
  _id?: string;
  id?: string;
  jobId?: string;
  printJobId: string;
  fileName: string;
  filePath?: string;
  fileType: string;
  printerName: string;
  agentId?: string;
  status: 'pending' | 'queued' | 'processing' | 'printing' | 'completed' | 'failed' | 'cancelled';
  submittedBy?: string;
  submittedAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// React Query hooks for dashboard data

export function useDashboardStats(date?: string): UseQueryResult<DashboardStats, Error> {
  return useQuery<DashboardStats, Error>({
    queryKey: ['dashboard', 'stats', date],
    queryFn: async () => {
      // Type assertion to access dashboard API
      const dashboard = (electronAPI as { dashboard?: { getStats: (date?: string) => Promise<DashboardStats> } }).dashboard;
      if (!dashboard) {
        throw new Error('Dashboard API not available');
      }
      return await dashboard.getStats(date);
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
  });
}

export function useWeeklyActivity(): UseQueryResult<WeeklyActivityItem[], Error> {
  return useQuery<WeeklyActivityItem[], Error>({
    queryKey: ['dashboard', 'weekly'],
    queryFn: async () => {
      // Type assertion to access dashboard API
      const dashboard = (electronAPI as { dashboard?: { getWeeklyActivity: () => Promise<WeeklyActivityItem[]> } }).dashboard;
      if (!dashboard) {
        throw new Error('Dashboard API not available');
      }
      return await dashboard.getWeeklyActivity();
    },
    staleTime: 60 * 1000, // 1 minute
    retry: 3,
  });
}

export function useJobsByDate(date?: string): UseQueryResult<PrintJob[], Error> {
  return useQuery<PrintJob[], Error>({
    queryKey: ['dashboard', 'jobs-by-date', date],
    queryFn: async () => {
      if (!date) {
        throw new Error('Date is required');
      }
      // Type assertion to access dashboard API
      const dashboard = (electronAPI as { dashboard?: { getJobsByDate: (date: string) => Promise<PrintJob[]> } }).dashboard;
      if (!dashboard) {
        throw new Error('Dashboard API not available');
      }
      return await dashboard.getJobsByDate(date);
    },
    enabled: !!date,
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
  });
}

