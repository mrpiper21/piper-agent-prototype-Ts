import React, { useState, useMemo } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../shared/clerkStyles';
import {
  AiOutlineCalendar,
  AiOutlineFile,
  AiOutlineCheckCircle,
  AiOutlineClockCircle,
  AiOutlineCloseCircle,
  AiOutlineThunderbolt,
  AiOutlineLeft,
  AiOutlineRight,
  AiOutlineDownload,
} from 'react-icons/ai';
import { useDashboardStats, useWeeklyActivity, useJobsByDate } from '../../users/api/dashboardApi';
import { generateJobOrderPDF } from '../utils/generateReportPDF';

interface DashboardStats {
  todaysJobs: number;
  completedJobs: number;
  pendingJobs: number;
  failedJobs: number;
  totalJobs: number;
}

export default function DashboardPage() {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [calendarOffset, setCalendarOffset] = useState<number>(0); // 0 = current period, -1 = past, +1 = future

  // Fetch dashboard data from APIs
  const { data: statsData, isLoading: statsLoading } = useDashboardStats(selectedDate);
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyActivity();
  const { data: jobsByDate, isLoading: jobsLoading } = useJobsByDate(selectedDate);

  const stats: DashboardStats = useMemo(() => {
    if (!statsData) {
      return {
        todaysJobs: 0,
        completedJobs: 0,
        pendingJobs: 0,
        failedJobs: 0,
        totalJobs: 0,
      };
    }
    return statsData;
  }, [statsData]);

  const chartData = useMemo(() => {
    return {
      completed: stats.completedJobs,
      pending: stats.pendingJobs,
      failed: stats.failedJobs,
      max: Math.max(stats.completedJobs, stats.pendingJobs, stats.failedJobs, 10),
    };
  }, [stats]);

  // Generate dates for the calendar view (28 days = 4 weeks) and map weekly activity data
  const calendarDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    const offsetDays = calendarOffset * 28; // Each offset represents 28 days (4 weeks)

    // Calculate the end date of the period (most recent date in the view)
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - offsetDays);

    // Generate 28 dates going backwards from end date (oldest to newest)
    // This ensures contiguous periods with no gaps
    for (let i = 27; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - i);
      dates.push(date);
    }

    return dates;
  }, [calendarOffset]);

  // Get the date range for the calendar header
  const calendarDateRange = useMemo(() => {
    if (calendarDates.length === 0) return '';
    const firstDate = calendarDates[0];
    const lastDate = calendarDates[calendarDates.length - 1];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // If the range includes today, show "Today" or date range
    if (
      firstDate.toISOString().split('T')[0] <= todayStr &&
      lastDate.toISOString().split('T')[0] >= todayStr
    ) {
      return `Week of ${firstDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })} - ${lastDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    }
    return `${firstDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} - ${lastDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  }, [calendarDates]);

  // Map weekly activity to a date -> count lookup
  const weeklyCountMap = useMemo(() => {
    if (!weeklyData) return new Map<string, number>();
    const map = new Map<string, number>();
    weeklyData.forEach((item: { date: string; count: number }) => {
      map.set(item.date, item.count);
    });
    return map;
  }, [weeklyData]);

  const isLoading = statsLoading || weeklyLoading || jobsLoading;

  return (
    <div
      style={{
        padding: '8px',
        // height: '100%',
        flexDirection: 'column',
        gap: '18px',
        overflow: 'auto',
        display: 'grid',
        flexWrap: 'wrap',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div>
          <h1
            style={{
              color: themeStyles.text,
              fontWeight: '700',
              fontSize: '24px',
              marginBottom: '4px',
            }}
          >
            Dashboard Overview
          </h1>
          <p
            style={{
              color: themeStyles.textSecondary,
              fontSize: '14px',
            }}
          >
            Monitor and manage all your print jobs
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setSelectedDate(today);
              setCalendarOffset(0);
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: `1px solid ${themeStyles.card.border}`,
              background: themeStyles.primaryButton.background,
              color: themeStyles.primaryButton.color,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <AiOutlineThunderbolt />
            Today
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: `1px solid ${themeStyles.card.border}`,
              background: themeStyles.input.background,
              color: themeStyles.input.color,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading && !statsData ? (
        <div
          style={{
            ...sharedStyles.card,
            ...themeStyles.card,
            textAlign: 'center',
            padding: '40px',
          }}
        >
          <p style={{ color: themeStyles.textSecondary }}>Loading dashboard stats...</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            flexShrink: 0,
          }}
        >
          <StatCard
            icon={<AiOutlineFile />}
            title="Today's Jobs"
            value={stats.todaysJobs}
            color={themeStyles.accent}
            themeStyles={themeStyles}
            description="Active jobs today"
          />
          <StatCard
            icon={<AiOutlineCheckCircle />}
            title="Completed"
            value={stats.completedJobs}
            color={themeStyles.success}
            themeStyles={themeStyles}
            description="Successfully printed"
          />
          <StatCard
            icon={<AiOutlineClockCircle />}
            title="Pending"
            value={stats.pendingJobs}
            color={themeStyles.warning}
            themeStyles={themeStyles}
            description="Awaiting processing"
          />
          <StatCard
            icon={<AiOutlineCloseCircle />}
            title="Failed"
            value={stats.failedJobs}
            color={themeStyles.error}
            themeStyles={themeStyles}
            description="Unsuccessful jobs"
          />
        </div>
      )}

      {/* Charts and Calendar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '24px',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Status Chart */}
        <div
          style={{
            ...sharedStyles.card,
            ...themeStyles.card,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `${themeStyles.primaryButton.background}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              📊
            </div>
            <div>
              <h3
                style={{ color: themeStyles.text, margin: 0, fontWeight: '700', fontSize: '18px' }}
              >
                Job Status Overview
              </h3>
              <p style={{ color: themeStyles.textSecondary, margin: 0, fontSize: '12px' }}>
                Current job distribution
              </p>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              justifyContent: 'space-around',
            }}
          >
            <Bar
              label="Completed"
              value={chartData.completed}
              max={chartData.max}
              color={themeStyles.success}
              themeStyles={themeStyles}
            />
            <Bar
              label="Pending"
              value={chartData.pending}
              max={chartData.max}
              color={themeStyles.warning}
              themeStyles={themeStyles}
            />
            <Bar
              label="Failed"
              value={chartData.failed}
              max={chartData.max}
              color={themeStyles.error}
              themeStyles={themeStyles}
            />
          </div>
          <div
            style={{
              marginTop: '24px',
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap' as const,
              padding: '16px',
              background: themeStyles.input.background,
              borderRadius: '8px',
            }}
          >
            <LegendItem color={themeStyles.success} label="Completed" themeStyles={themeStyles} />
            <LegendItem color={themeStyles.warning} label="Pending" themeStyles={themeStyles} />
            <LegendItem color={themeStyles.error} label="Failed" themeStyles={themeStyles} />
          </div>
        </div>

        {/* Calendar with Job Counts */}
        <div
          style={{
            ...sharedStyles.card,
            ...themeStyles.card,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `${themeStyles.primaryButton.background}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                📅
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    color: themeStyles.text,
                    margin: 0,
                    fontWeight: '700',
                    fontSize: '18px',
                  }}
                >
                  Activity Calendar
                </h3>
                <p style={{ color: themeStyles.textSecondary, margin: 0, fontSize: '12px' }}>
                  {calendarDateRange || 'Job count by date'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setCalendarOffset((prev) => prev + 1)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${themeStyles.card.border}`,
                  background: themeStyles.input.background,
                  color: themeStyles.text,
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeStyles.card.background;
                  e.currentTarget.style.transform = 'translateX(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeStyles.input.background;
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
                title="Go to previous period"
              >
                <AiOutlineLeft />
              </button>
              <button
                onClick={() => setCalendarOffset(0)}
                disabled={calendarOffset === 0}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${themeStyles.card.border}`,
                  background:
                    calendarOffset === 0
                      ? themeStyles.card.background
                      : themeStyles.primaryButton.background,
                  color:
                    calendarOffset === 0
                      ? themeStyles.textSecondary
                      : themeStyles.primaryButton.color,
                  cursor: calendarOffset === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  opacity: calendarOffset === 0 ? 0.6 : 1,
                }}
                title="Jump to today"
              >
                Today
              </button>
              <button
                onClick={() => setCalendarOffset((prev) => prev - 1)}
                disabled={calendarOffset === 0}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${themeStyles.card.border}`,
                  background: themeStyles.input.background,
                  color: calendarOffset === 0 ? themeStyles.textSecondary : themeStyles.text,
                  cursor: calendarOffset === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  opacity: calendarOffset === 0 ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (calendarOffset !== 0) {
                    e.currentTarget.style.background = themeStyles.card.background;
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeStyles.input.background;
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
                title="Go to next period"
              >
                <AiOutlineRight />
              </button>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: '12px',
            }}
          >
            {calendarDates.map((date, index) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayJobCount = weeklyCountMap.get(dateStr) || 0;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{
                    padding: '16px 12px',
                    borderRadius: '12px',
                    border: `2px solid ${
                      isSelected ? themeStyles.primaryButton.background : 'transparent'
                    }`,
                    background: isSelected
                      ? themeStyles.primaryButton.background
                      : isToday
                      ? `${themeStyles.primaryButton.background}15`
                      : themeStyles.card.background,
                    color: isSelected ? '#000000' : themeStyles.text,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    position: 'relative',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = themeStyles.input.background;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = isToday
                        ? `${themeStyles.primaryButton.background}15`
                        : themeStyles.card.background;
                    }
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      opacity: 0.8,
                    }}
                  >
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{date.getDate()}</span>
                  {dayJobCount > 0 && (
                    <span
                      style={{
                        background: isSelected ? '#000000' : themeStyles.primaryButton.background,
                        color: isSelected ? themeStyles.primaryButton.background : '#000000',
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        marginTop: '4px',
                      }}
                    >
                      {dayJobCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      {selectedDate && (
        <div
          style={{
            ...sharedStyles.card,
            ...themeStyles.card,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <div>
              <h3
                style={{
                  color: themeStyles.text,
                  margin: 0,
                  marginBottom: '4px',
                  fontWeight: '700',
                  fontSize: '18px',
                }}
              >
                Jobs for{' '}
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <p
                style={{
                  color: themeStyles.textSecondary,
                  margin: 0,
                  fontSize: '13px',
                }}
              >
                {jobsByDate?.length || 0} jobs found
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setSelectedDate('')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${themeStyles.card.border}`,
                  background: themeStyles.input.background,
                  color: themeStyles.text,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AiOutlineCalendar />
                Clear Filter
              </button>
              <button
                onClick={() => {
                  try {
                    console.log('Download button clicked');
                    console.log('selectedDate:', selectedDate);
                    console.log('jobsByDate:', jobsByDate);
                    console.log('jobsByDate length:', jobsByDate?.length);

                    if (!selectedDate) {
                      alert('Please select a date first');
                      return;
                    }

                    if (!jobsByDate || jobsByDate.length === 0) {
                      alert('No jobs available for the selected date');
                      return;
                    }

                    // Format date as DD - MM - YYYY
                    const dateParts = selectedDate.split('-');
                    if (dateParts.length !== 3) {
                      alert('Invalid date format. Please select a valid date.');
                      return;
                    }
                    const formattedDate = `${dateParts[2]} - ${dateParts[1]} - ${dateParts[0]}`;

                    // Generate job order number from date or use a sequential number
                    const jobOrderNo =
                      selectedDate.replace(/-/g, '') || Date.now().toString().slice(-6);

                    console.log('Generating PDF with:', {
                      date: formattedDate,
                      jobCount: jobsByDate.length,
                      jobOrderNo,
                    });

                    generateJobOrderPDF({
                      date: formattedDate,
                      jobs: jobsByDate,
                      companyName: '', // Can be added later
                      clientName: '', // Can be added later
                      material: 'Flexi', // Default material
                      jobOrderNo: jobOrderNo,
                    })

                    console.log('PDF generation initiated');
                  } catch (error) {
                    console.error('Error generating PDF:', error);
                    alert(
                      `Error generating PDF: ${
                        error instanceof Error ? error.message : 'Unknown error'
                      }`
                    );
                  }
                }}
                disabled={!selectedDate || !jobsByDate || jobsByDate.length === 0}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${themeStyles.card.border}`,
                  background: themeStyles.input.background,
                  color: themeStyles.text,
                  cursor: !jobsByDate || jobsByDate.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: !jobsByDate || jobsByDate.length === 0 ? 0.6 : 1,
                }}
              >
                <AiOutlineDownload />
                Download Report
              </button>
            </div>
          </div>
          <div style={sharedStyles.jobsList}>
            {isLoading ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: themeStyles.textSecondary,
                }}
              >
                <p style={{ fontSize: '16px' }}>Loading jobs...</p>
              </div>
            ) : jobsByDate && jobsByDate.length > 0 ? (
              jobsByDate.map((job: any) => (
                <div
                  key={job.id}
                  style={{
                    ...sharedStyles.jobItem,
                    ...themeStyles.card,
                    padding: '16px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        color: themeStyles.text,
                        fontWeight: '600',
                        marginBottom: '6px',
                        fontSize: '15px',
                      }}
                    >
                      {job.fileName || job.name || 'Unnamed Job'}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          color: themeStyles.textSecondary,
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        🖨️ {job.printerName || job.printer || 'N/A'}
                      </span>
                      <span style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
                        🕒 {job.createdAt ? new Date(job.createdAt).toLocaleTimeString() : 'N/A'}
                      </span>
                      <span style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
                        📍 {job.location || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      background:
                        job.status === 'completed'
                          ? themeStyles.success
                          : job.status === 'failed'
                          ? themeStyles.error
                          : themeStyles.warning,
                      color: '#ffffff',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {job.status || 'pending'}
                  </span>
                </div>
              ))
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: themeStyles.textSecondary,
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                  No jobs on this date
                </p>
                <p style={{ fontSize: '13px' }}>Try selecting a different date</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
  themeStyles: any;
  description?: string;
}

function StatCard({ icon, title, value, color, themeStyles, description }: StatCardProps) {
  return (
    <div style={{ 
      ...sharedStyles.card, 
      ...themeStyles.card,
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    }}
    onMouseEnter={(e: any) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e: any) => {
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: color,
        }}>
          {icon}
        </div>
        <div style={{
          padding: '4px 12px',
          borderRadius: '20px',
          background: `${color}20`,
          color: color,
          fontSize: '12px',
          fontWeight: '700',
        }}>
          {value}
        </div>
      </div>
      <h4 style={{ 
        color: themeStyles.text, 
        fontSize: '16px', 
        fontWeight: '700',
        marginBottom: '4px'
      }}>
        {title}
      </h4>
      {description && (
        <p style={{ 
          color: themeStyles.textSecondary, 
          fontSize: '12px',
          margin: 0,
          lineHeight: '1.4'
        }}>
          {description}
        </p>
      )}
    </div>
  );
}

interface BarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  themeStyles: any;
}

function Bar({ label, value, max, color, themeStyles }: BarProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ 
          color: themeStyles.text, 
          fontSize: '14px', 
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '3px',
            background: color,
          }} />
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            color: themeStyles.textSecondary, 
            fontSize: '13px',
            fontWeight: '500'
          }}>
            {value} jobs
          </span>
          <span style={{
            padding: '2px 8px',
            borderRadius: '10px',
            background: `${color}20`,
            color: color,
            fontSize: '11px',
            fontWeight: '700',
          }}>
            {Math.round((value / max) * 100)}%
          </span>
        </div>
      </div>
      <div style={{
        width: '100%',
        height: '24px',
        background: themeStyles.input.background,
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div
          style={{
            width: `${Math.min((value / max) * 100, 100)}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color}, ${color})`,
            borderRadius: '12px',
            transition: 'width 0.3s ease',
            boxShadow: `0 2px 8px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

interface LegendItemProps {
  color: string;
  label: string;
  themeStyles: any;
}

function LegendItem({ color, label, themeStyles }: LegendItemProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ width: '12px', height: '12px', background: color, borderRadius: '3px' }} />
      <span style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>{label}</span>
    </div>
  );
}

