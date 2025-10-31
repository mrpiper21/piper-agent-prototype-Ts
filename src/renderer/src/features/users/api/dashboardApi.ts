import { useQuery } from '@tanstack/react-query';
import { electronAPI } from '../../../lib';

// React Query hooks for dashboard data

export function useDashboardStats(date?: string) {
  return useQuery({
    queryKey: ['dashboard', 'stats', date],
    queryFn: () => electronAPI.dashboard.getStats(date),
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
  });
}

export function useWeeklyActivity() {
  return useQuery({
    queryKey: ['dashboard', 'weekly'],
    queryFn: () => electronAPI.dashboard.getWeeklyActivity(),
    staleTime: 60 * 1000, // 1 minute
    retry: 3,
  });
}

export function useJobsByDate(date: string) {
  return useQuery({
    queryKey: ['dashboard', 'jobs-by-date', date],
    queryFn: () => electronAPI.dashboard.getJobsByDate(date),
    enabled: !!date,
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
  });
}

