import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { electronAPI } from '../../../lib';

// Types for dashboard data
export interface DashboardStats {
  todaysJobs: number;
  completedJobs: number;
  pendingJobs: number;
  failedJobs: number;
  totalJobs: number;
  totalRevenue?: number;
  pendingRevenue?: number;
  paidJobs?: number;
  revenueMonth?: string;
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

export function useDashboardStats(date?: string, month?: string, year?: string): UseQueryResult<DashboardStats, Error> {
  return useQuery<DashboardStats, Error>({
    queryKey: ['dashboard', 'stats', date, month, year],
    queryFn: async () => {
      // Type assertion to access dashboard API
      const dashboard = (electronAPI as { dashboard?: { getStats: (date?: string, month?: string, year?: string) => Promise<DashboardStats> } }).dashboard;
      if (!dashboard) {
        throw new Error('Dashboard API not available');
      }
      return await dashboard.getStats(date, month, year);
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
  });
}

export function useWeeklyActivity(month?: string, year?: string): UseQueryResult<WeeklyActivityItem[], Error> {
  return useQuery<WeeklyActivityItem[], Error>({
    queryKey: ['dashboard', 'weekly', month, year],
    queryFn: async () => {
      // Type assertion to access dashboard API
      const dashboard = (electronAPI as { dashboard?: { getWeeklyActivity: (month?: string, year?: string) => Promise<WeeklyActivityItem[]> } }).dashboard;
      if (!dashboard) {
        throw new Error('Dashboard API not available');
      }
      return await dashboard.getWeeklyActivity(month, year);
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

export interface CategoryAnalytics {
  categoryId: string;
  categoryName: string;
  categoryType: string;
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  failedJobs: number;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
}

export interface PaymentAnalytics {
  paymentStats: {
    paid: { count: number; revenue: number };
    pending: { count: number; revenue: number };
    failed: { count: number; revenue: number };
    refunded: { count: number; revenue: number };
  };
  totalRevenue: number;
  totalPendingRevenue: number;
  dailyRevenue: Array<{ date: string; revenue: number; count: number }>;
}

export interface ComprehensiveReport {
  businessInfo: {
    businessName?: string;
    businessPhone?: string;
    location?: { latitude: number; longitude: number; address: string };
    email?: string;
    name?: string;
  };
  summary: {
    totalJobs: number;
    completedJobs: number;
    pendingJobs: number;
    failedJobs: number;
    totalRevenue: number;
    pendingRevenue: number;
  };
  jobs: PrintJob[];
  categoryBreakdown: Array<{ categoryName: string; count: number; revenue: number }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export function useCategoryAnalytics(days?: number): UseQueryResult<CategoryAnalytics[], Error> {
  return useQuery<CategoryAnalytics[], Error>({
    queryKey: ['dashboard', 'category-analytics', days],
    queryFn: async () => {
      const dashboard = (electronAPI as { dashboard?: { getCategoryAnalytics: (days?: number) => Promise<CategoryAnalytics[]> } }).dashboard;
      if (!dashboard) {
        throw new Error('Dashboard API not available');
      }
      return await dashboard.getCategoryAnalytics(days);
    },
    staleTime: 60 * 1000, // 1 minute
    retry: 3,
  });
}

export function usePaymentAnalytics(days?: number): UseQueryResult<PaymentAnalytics, Error> {
  return useQuery<PaymentAnalytics, Error>({
    queryKey: ['dashboard', 'payment-analytics', days],
    queryFn: async () => {
      const dashboard = (electronAPI as { dashboard?: { getPaymentAnalytics: (days?: number) => Promise<PaymentAnalytics> } }).dashboard;
      if (!dashboard) {
        throw new Error('Dashboard API not available');
      }
      return await dashboard.getPaymentAnalytics(days);
    },
    staleTime: 60 * 1000, // 1 minute
    retry: 3,
  });
}

export function useComprehensiveReport(startDate?: string, endDate?: string): UseQueryResult<ComprehensiveReport, Error> {
  return useQuery<ComprehensiveReport, Error>({
    queryKey: ['dashboard', 'comprehensive-report', startDate, endDate],
    queryFn: async () => {
      const dashboard = (electronAPI as { dashboard?: { getComprehensiveReport: (startDate?: string, endDate?: string) => Promise<ComprehensiveReport> } }).dashboard;
      if (!dashboard) {
        throw new Error('Dashboard API not available');
      }
      return await dashboard.getComprehensiveReport(startDate, endDate);
    },
    enabled: !!startDate && !!endDate,
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
  });
}

