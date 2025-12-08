import { useMemo } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../shared/clerkStyles';
import { electronAPI } from '../../../lib';
import { generateJobOrderPDF } from '../utils/generateReportPDF';
import { ConnectivityIssue } from '../../../shared/components/ConnectivityIssue';
import { useConnectivity } from '../../../shared/hooks';
import { useAuthStore } from '../../auth/store/authStore';
import { useDashboard } from './dashboard/hooks/useDashboard';
import {
  DashboardHeader,
  StatsGrid,
  CategoryAnalytics,
  PaymentAnalytics,
  StatusChart,
  ActivityCalendar,
  RecentJobs,
} from './dashboard/components';

export default function DashboardPage() {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const themeStyles = useMemo(() => {
    return theme === 'dark' ? darkStyles : lightStyles;
  }, [theme]);

  const {
    selectedDate,
    setSelectedDate,
    selectedRevenueMonth,
    setSelectedRevenueMonth,
    calendarOffset,
    setCalendarOffset,
    stats,
    chartData,
    jobsByDate,
    categoryAnalytics,
    paymentAnalytics,
    calendarDates,
    calendarMonthHeader,
    calendarGridStart,
    monthlyCountMap,
    isLoading,
    hasError,
    statsData,
    weeklyData,
    jobsByDate: jobsByDateData,
    refetchStats,
    refetchWeekly,
    refetchJobs,
    getVagueRevenue,
    handleTodayClick,
  } = useDashboard(isAdmin);

  const { hasConnectivityIssue } = useConnectivity();

  if (hasConnectivityIssue && hasError && !statsData && !weeklyData && !jobsByDateData) {
    return (
      <ConnectivityIssue
        onRetry={() => {
          refetchStats();
          refetchWeekly();
          refetchJobs();
        }}
      />
    );
  }

  const handleDownloadReport = async () => {
    try {
      if (!selectedDate) {
        alert('Please select a date first');
        return;
      }

      if (!jobsByDate || jobsByDate.length === 0) {
        alert('No jobs available for the selected date');
        return;
      }

      const dateParts = selectedDate.split('-');
      if (dateParts.length !== 3) {
        alert('Invalid date format. Please select a valid date.');
        return;
      }
      const formattedDate = `${dateParts[2]} - ${dateParts[1]} - ${dateParts[0]}`;

      const jobOrderNo = selectedDate.replace(/-/g, '') || Date.now().toString().slice(-6);

      const firstJob = jobsByDate[0] as unknown as Record<string, unknown>;
      const clientId = firstJob?.clientId as Record<string, unknown> | undefined;
      const extractedClientName = (clientId?.fullName as string) || '';

      console.log('Generating PDF with:', {
        date: formattedDate,
        jobCount: jobsByDate.length,
        jobOrderNo,
        clientName: extractedClientName,
      });

      let comprehensiveData = null;
      try {
        const reportData = await electronAPI.dashboard.getComprehensiveReport(
          selectedDate,
          selectedDate
        );
        comprehensiveData = reportData;
      } catch (err) {
        console.warn('Could not fetch comprehensive report, using basic data:', err);
      }

      await generateJobOrderPDF({
        date: formattedDate,
        jobs: jobsByDate,
        businessName: user?.businessName || '',
        companyName: user?.businessName || '',
        clientName: extractedClientName,
        material: 'Flexi',
        jobOrderNo: jobOrderNo,
        businessInfo: comprehensiveData?.businessInfo || {
          businessName: user?.businessName,
          businessPhone: user?.businessPhone,
          location: user?.location,
          email: user?.email,
          name: user?.name,
        },
        categoryBreakdown: comprehensiveData?.categoryBreakdown,
        summary: comprehensiveData?.summary,
      });

      console.log('PDF generation initiated');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div style={{ ...sharedStyles.container, padding: 'var(--spacing-md, 12px)' }}>
      {hasConnectivityIssue && (statsData || weeklyData || jobsByDateData) && (
        <ConnectivityIssue
          compact
          message="You're viewing cached data. Some information may be outdated."
          showRetry={false}
          style={{ marginBottom: 'var(--spacing-md, 12px)' }}
        />
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-md, 12px)',
        }}
      >
        <DashboardHeader
          themeStyles={themeStyles}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onTodayClick={handleTodayClick}
        />

        <StatsGrid
          themeStyles={themeStyles}
          stats={stats}
          isLoading={isLoading}
          isAdmin={isAdmin}
          selectedRevenueMonth={selectedRevenueMonth}
          onRevenueMonthChange={setSelectedRevenueMonth}
          getVagueRevenue={getVagueRevenue}
        />
        <CategoryAnalytics
          themeStyles={themeStyles}
          categoryAnalytics={categoryAnalytics}
          isAdmin={isAdmin}
          getVagueRevenue={getVagueRevenue}
        />

        <PaymentAnalytics
          themeStyles={themeStyles}
          paymentAnalytics={paymentAnalytics}
          isAdmin={isAdmin}
          getVagueRevenue={getVagueRevenue}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--spacing-md, 12px)',
          }}
        >
          <StatusChart themeStyles={themeStyles} chartData={chartData} />

          <ActivityCalendar
            themeStyles={themeStyles}
            calendarDates={calendarDates}
            calendarMonthHeader={calendarMonthHeader}
            calendarGridStart={calendarGridStart}
            monthlyCountMap={monthlyCountMap}
            selectedDate={selectedDate}
            calendarOffset={calendarOffset}
            onDateSelect={setSelectedDate}
            onCalendarOffsetChange={setCalendarOffset}
            onTodayClick={handleTodayClick}
          />
        </div>

        <RecentJobs
          themeStyles={themeStyles}
          selectedDate={selectedDate}
          jobsByDate={jobsByDate}
          isLoading={isLoading}
          onDateClear={() => setSelectedDate('')}
          onDownloadReport={handleDownloadReport}
        />
      </div>
    </div>
  );
}
