import React, { useState, useMemo } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../shared/clerkStyles';
import { 
  AiOutlineCalendar, 
  AiOutlineFile, 
  AiOutlineCheckCircle, 
  AiOutlineClockCircle,
  AiOutlineCloseCircle,
  AiOutlineThunderbolt
} from 'react-icons/ai';

interface DashboardStats {
  todaysJobs: number;
  completedJobs: number;
  pendingJobs: number;
  failedJobs: number;
  totalJobs: number;
}

// Dummy data for now
const generateDummyData = (): any[] => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const jobs = [];
  
  // Generate today's jobs
  for (let i = 0; i < 8; i++) {
    jobs.push({
      id: `job-today-${i}`,
      fileName: `Document_${i + 1}.pdf`,
      status: ['completed', 'pending', 'processing', 'failed'][Math.floor(Math.random() * 4)],
      createdAt: new Date(startOfDay.getTime() + (i * 120000)), // Every 2 minutes
      printerName: ['Printer A', 'Printer B', 'Printer C'][Math.floor(Math.random() * 3)],
      location: ['Office', 'Warehouse', 'Reception'][Math.floor(Math.random() * 3)],
      submittedBy: `User ${Math.floor(Math.random() * 5) + 1}`,
    });
  }
  
  // Generate historical jobs
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    jobs.push({
      id: `job-hist-${i}`,
      fileName: `File_${i + 1}.pdf`,
      status: ['completed', 'completed', 'completed', 'failed'][Math.floor(Math.random() * 4)],
      createdAt: new Date(startOfDay.getTime() - (daysAgo * 86400000) + (i * 3600000)),
      printerName: ['Printer A', 'Printer B'][Math.floor(Math.random() * 2)],
      location: ['Office', 'Warehouse'][Math.floor(Math.random() * 2)],
      submittedBy: `User ${Math.floor(Math.random() * 5) + 1}`,
    });
  }
  
  return jobs;
};

export default function DashboardPage() {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  
  const jobs = useMemo(() => generateDummyData(), []);
  
  const stats: DashboardStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const todaysJobs = jobs.filter(job => {
      const jobDate = new Date(job.createdAt);
      return jobDate >= today && jobDate <= endOfDay;
    });
    
    const filteredJobs = selectedDate 
      ? jobs.filter(job => {
          const jobDate = new Date(job.createdAt).toISOString().split('T')[0];
          return jobDate === selectedDate;
        })
      : jobs;
    
    return {
      todaysJobs: todaysJobs.length,
      completedJobs: filteredJobs.filter(j => j.status === 'completed').length,
      pendingJobs: filteredJobs.filter(j => j.status === 'pending' || j.status === 'processing').length,
      failedJobs: filteredJobs.filter(j => j.status === 'failed').length,
      totalJobs: filteredJobs.length,
    };
  }, [jobs, selectedDate]);
  
  const chartData = useMemo(() => {
    return {
      completed: stats.completedJobs,
      pending: stats.pendingJobs,
      failed: stats.failedJobs,
      max: Math.max(stats.completedJobs, stats.pendingJobs, stats.failedJobs, 10),
    };
  }, [stats]);
  
  // Generate dates for the calendar view
  const calendarDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date);
    }
    return dates;
  }, []);
  
  return (
    <div style={{ 
      padding: '24px', 
      // height: '100%', 
      flexDirection: 'column', 
      gap: '24px',
      overflow: 'auto',
      display: 'grid',
      flexWrap: 'wrap'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div>
          <h1 style={{ 
            color: themeStyles.text, 
            fontWeight: '700', 
            fontSize: '32px',
            marginBottom: '4px'
          }}>
            Dashboard Overview
          </h1>
          <p style={{ 
            color: themeStyles.textSecondary, 
            fontSize: '14px'
          }}>
            Monitor and manage all your print jobs
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '20px',
        flexShrink: 0,
      }}>
        <StatCard
          icon={<AiOutlineFile />}
          title="Today's Jobs"
          value={stats.todaysJobs}
          color={themeStyles.accent}
          themeStyles={themeStyles}
          description="Active jobs today"
          theme={theme}
        />
        <StatCard
          icon={<AiOutlineCheckCircle />}
          title="Completed"
          value={stats.completedJobs}
          color={themeStyles.success}
          themeStyles={themeStyles}
          description="Successfully printed"
          theme={theme}
        />
        <StatCard
          icon={<AiOutlineClockCircle />}
          title="Pending"
          value={stats.pendingJobs}
          color={themeStyles.warning}
          themeStyles={themeStyles}
          description="Awaiting processing"
          theme={theme}
        />
        <StatCard
          icon={<AiOutlineCloseCircle />}
          title="Failed"
          value={stats.failedJobs}
          color={themeStyles.error}
          themeStyles={themeStyles}
          description="Unsuccessful jobs"
          theme={theme}
        />
      </div>
      
      {/* Charts and Calendar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
        gap: '24px',
        flex: 1,
        minHeight: 0
      }}>
        {/* Status Chart */}
        <div style={{ 
          ...sharedStyles.card, 
          ...themeStyles.card, 
          display: 'flex', 
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: `${themeStyles.primaryButton.background}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              📊
            </div>
            <div>
              <h3 style={{ color: themeStyles.text, margin: 0, fontWeight: '700', fontSize: '18px' }}>
                Job Status Overview
              </h3>
              <p style={{ color: themeStyles.textSecondary, margin: 0, fontSize: '12px' }}>
                Current job distribution
              </p>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'space-around' }}>
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
          <div style={{ 
            marginTop: '24px', 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'center',
            flexWrap: 'wrap' as const,
            padding: '16px',
            background: themeStyles.input.background,
            borderRadius: '8px'
          }}>
            <LegendItem color={themeStyles.success} label="Completed" themeStyles={themeStyles} />
            <LegendItem color={themeStyles.warning} label="Pending" themeStyles={themeStyles} />
            <LegendItem color={themeStyles.error} label="Failed" themeStyles={themeStyles} />
          </div>
        </div>
        
        {/* Calendar with Job Counts */}
        <div style={{ 
          ...sharedStyles.card, 
          ...themeStyles.card, 
          display: 'flex', 
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: `${themeStyles.primaryButton.background}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              📅
            </div>
            <div>
              <h3 style={{ color: themeStyles.text, margin: 0, fontWeight: '700', fontSize: '18px' }}>
                Weekly Activity
              </h3>
              <p style={{ color: themeStyles.textSecondary, margin: 0, fontSize: '12px' }}>
                Job count by date
              </p>
            </div>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', 
            gap: '12px'
          }}>
            {calendarDates.map((date, index) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayJobs = jobs.filter(job => {
                const jobDate = new Date(job.createdAt).toISOString().split('T')[0];
                return jobDate === dateStr;
              });
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{
                    padding: '16px 12px',
                    borderRadius: '12px',
                    border: `2px solid ${isSelected ? themeStyles.primaryButton.background : 'transparent'}`,
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
                  <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', opacity: 0.8 }}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {date.getDate()}
                  </span>
                  {dayJobs.length > 0 && (
                    <span style={{
                      background: isSelected ? '#000000' : themeStyles.primaryButton.background,
                      color: isSelected ? themeStyles.primaryButton.background : '#000000',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      marginTop: '4px',
                    }}>
                      {dayJobs.length}
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
        <div style={{ 
          ...sharedStyles.card, 
          ...themeStyles.card,
          flexShrink: 0,
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div>
              <h3 style={{ 
                color: themeStyles.text, 
                margin: 0, 
                marginBottom: '4px',
                fontWeight: '700',
                fontSize: '18px'
              }}>
                Jobs for {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <p style={{ 
                color: themeStyles.textSecondary, 
                margin: 0,
                fontSize: '13px'
              }}>
                {jobs.filter(job => new Date(job.createdAt).toISOString().split('T')[0] === selectedDate).length} jobs found
              </p>
            </div>
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
          </div>
          <div style={sharedStyles.jobsList}>
            {jobs
              .filter(job => new Date(job.createdAt).toISOString().split('T')[0] === selectedDate)
              .map((job) => (
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
                    <p style={{ color: themeStyles.text, fontWeight: '600', marginBottom: '6px', fontSize: '15px' }}>
                      {job.fileName}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ color: themeStyles.textSecondary, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🖨️ {job.printerName}
                      </span>
                      <span style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
                        🕒 {new Date(job.createdAt).toLocaleTimeString()}
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
                        job.status === 'completed' ? themeStyles.success :
                        job.status === 'failed' ? themeStyles.error :
                        themeStyles.warning,
                      color: '#ffffff',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {job.status}
                  </span>
                </div>
              ))}
            {jobs.filter(job => new Date(job.createdAt).toISOString().split('T')[0] === selectedDate).length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                color: themeStyles.textSecondary 
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>No jobs on this date</p>
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
  theme?: string;
}

function StatCard({ icon, title, value, color, themeStyles, description, theme = 'light' }: StatCardProps) {
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

