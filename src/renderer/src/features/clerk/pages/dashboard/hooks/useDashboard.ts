import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useDashboardStats,
  useWeeklyActivity,
  useJobsByDate,
  useCategoryAnalytics,
  usePaymentAnalytics,
} from '../../../../users/api/dashboardApi';

interface DashboardStats {
  todaysJobs: number;
  completedJobs: number;
  pendingJobs: number;
  failedJobs: number;
  totalJobs: number;
  totalRevenue?: number;
  pendingRevenue?: number;
  paidJobs?: number;
}

export function useDashboard(isAdmin: boolean) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [calendarOffset, setCalendarOffset] = useState<number>(0);

  // Month selector for revenue (default to current month)
  const currentDate = new Date();
  const [selectedRevenueMonth, setSelectedRevenueMonth] = useState<string>(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );

  // Parse month and year from selectedRevenueMonth (format: YYYY-MM)
  const [revenueYear, revenueMonth] = selectedRevenueMonth.split('-');

  // Fetch dashboard data from APIs
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDashboardStats(selectedDate, revenueMonth, revenueYear);
  const {
    data: weeklyData,
    isLoading: weeklyLoading,
    error: weeklyError,
    refetch: refetchWeekly,
  } = useWeeklyActivity(revenueMonth, revenueYear);
  const {
    data: jobsByDate,
    isLoading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useJobsByDate(selectedDate);
  const { data: categoryAnalytics } = useCategoryAnalytics(30);
  const { data: paymentAnalytics } = usePaymentAnalytics(30);

  const isLoading = statsLoading || weeklyLoading || jobsLoading;
  const hasError = statsError || weeklyError || jobsError;

  // Memoized stats
  const stats: DashboardStats = useMemo(() => {
    if (!statsData) {
      return {
        todaysJobs: 0,
        completedJobs: 0,
        pendingJobs: 0,
        failedJobs: 0,
        totalJobs: 0,
        totalRevenue: 0,
        pendingRevenue: 0,
        paidJobs: 0,
      };
    }
    return statsData;
  }, [statsData]);

  // Chart data
  const chartData = useMemo(() => {
    return {
      completed: stats.completedJobs,
      pending: stats.pendingJobs,
      failed: stats.failedJobs,
      max: Math.max(stats.completedJobs, stats.pendingJobs, stats.failedJobs, 10),
    };
  }, [stats]);

  // Generate dates for the calendar view based on selected month
  const calendarDates = useMemo(() => {
    const dates = [];
    const [year, month] = selectedRevenueMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      dates.push(date);
    }

    return dates;
  }, [selectedRevenueMonth]);

  // Calendar month header
  const calendarMonthHeader = useMemo(() => {
    if (calendarDates.length === 0) return '';
    const firstDate = calendarDates[0];
    return firstDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [calendarDates]);

  // Calendar grid start offset
  const calendarGridStart = useMemo(() => {
    if (calendarDates.length === 0) return 0;
    const firstDate = calendarDates[0];
    const dayOfWeek = firstDate.getDay();
    return dayOfWeek;
  }, [calendarDates]);

  // Monthly count map
  const monthlyCountMap = useMemo(() => {
    if (!weeklyData) return new Map<string, number>();
    const map = new Map<string, number>();
    weeklyData.forEach((item: { date: string; count: number }) => {
      map.set(item.date, item.count);
    });
    return map;
  }, [weeklyData]);

  // Helper functions
  const getVagueRevenue = (amount: number): string => {
    if (amount === 0) return 'None';
    if (amount < 100) return 'Low';
    if (amount < 500) return 'Moderate';
    if (amount < 2000) return 'High';
    return 'Very High';
  };

  const handleTodayClick = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setCalendarOffset(0);
  };

  return {
    // State
    selectedDate,
    setSelectedDate,
    selectedRevenueMonth,
    setSelectedRevenueMonth,
    calendarOffset,
    setCalendarOffset,
    // Data
    stats,
    chartData,
    jobsByDate,
    categoryAnalytics,
    paymentAnalytics,
    // Calendar
    calendarDates,
    calendarMonthHeader,
    calendarGridStart,
    monthlyCountMap,
    // Loading/Error
    isLoading,
    hasError,
    statsData,
    weeklyData,
    jobsByDateData: jobsByDate as any,
    // Refetch functions
    refetchStats,
    refetchWeekly,
    refetchJobs,
    // Helper functions
    getVagueRevenue,
    handleTodayClick,
  };
}

