import { useAuthStore } from '../auth/store/authStore';
import { useTheme } from '../../context/ThemeContext';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { electronAPI } from '../../lib';
import { useQuery } from '@tanstack/react-query';
import {
  AiOutlineDashboard,
  AiOutlineUser,
  AiOutlinePrinter,
  AiOutlineBarChart,
  AiOutlineMoon,
  AiOutlineSun,
  AiOutlineHome,
  AiOutlineFileText,
  AiOutlineSearch,
  AiOutlineClose,
} from 'react-icons/ai';
import { HiOutlineLogout } from 'react-icons/hi';
import { JobListItem, JobPreview } from '../clerk/shared';
import { sharedStyles } from '../clerk/shared/clerkStyles';
import { useDebounce } from '../../shared/hooks/useDebounce';
import { ConnectivityIssue } from '../../shared/components/ConnectivityIssue';
import { useConnectivity } from '../../shared/hooks';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [sidebarTab, setSidebarTab] = useState<'home' | 'jobs'>('home');
  const [contentTab, setContentTab] = useState<'overview' | 'users' | 'agents' | 'analytics'>(
    'overview'
  );
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(jobSearchQuery, 300); // Debounce search by 300ms
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const themeStyles = useMemo(() => {
    return theme === 'dark' ? darkStyles : lightStyles;
  }, [theme]);

  // Fetch jobs globally - optimized query settings
  const { data: jobs, error: jobsError, refetch: refetchJobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => electronAPI.jobs.getAll(),
    staleTime: 30000, // 30 seconds - reduce refetch frequency
    gcTime: 300000, // 5 minutes cache (formerly cacheTime)
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
  });

  const { hasConnectivityIssue } = useConnectivity();

  // Reset selected job when switching tabs
  useEffect(() => {
    if (sidebarTab === 'home') {
      setSelectedJob(null);
    }
  }, [sidebarTab]);

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      const minWidth = 200;
      const maxWidth = window.innerWidth * 0.5; // Max 50% of window width
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Memoize job selection check function
  const isJobSelected = useCallback(
    (job: any) => {
      if (!selectedJob) return false;
      return (
        (selectedJob.id && selectedJob.id === job.id) ||
        (selectedJob._id && selectedJob._id === job._id) ||
        (selectedJob.printJobId && selectedJob.printJobId === job.printJobId)
      );
    },
    [selectedJob]
  );

  // Filter jobs based on search query (using debounced value)
  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    if (!debouncedSearchQuery.trim()) return jobs;

    const query = debouncedSearchQuery.toLowerCase().trim();
    return jobs.filter((job: any) => {
      const fileName = (job.fileName || '').toLowerCase();
      const artwork = (job.artwork || '').toLowerCase();
      const printerName = (job.printerName || '').toLowerCase();
      const status = (job.status || '').toLowerCase();
      const description = (job.description || '').toLowerCase();

      return (
        fileName.includes(query) ||
        artwork.includes(query) ||
        printerName.includes(query) ||
        status.includes(query) ||
        description.includes(query)
      );
    });
  }, [jobs, debouncedSearchQuery]);

  // Show connectivity issue if offline or network error (and no cached data)
  if (hasConnectivityIssue && jobsError && !jobs) {
    return (
      <ConnectivityIssue
        onRetry={() => {
          refetchJobs();
        }}
      />
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Connectivity Indicator - Show when offline but have cached data */}
      {hasConnectivityIssue && jobs && jobs.length > 0 && (
        <div style={{ position: 'fixed', top: '40px', left: 0, right: 0, zIndex: 1000 }}>
          <ConnectivityIssue
            compact
            message="You're viewing cached data. Some information may be outdated."
            showRetry={false}
          />
        </div>
      )}
      {/* Sidebar */}
      <div
        style={{
          ...styles.sidebar,
          ...themeStyles.sidebar,
          width: sidebarWidth !== null ? `${sidebarWidth}px` : '220px',
          transition: isResizing ? 'none' : 'width 0.2s ease',
        }}
      >
        {/* Tab Switcher - VS Code style */}
        <div
          style={{
            ...styles.tabContainer,
            padding: 0,
            background: themeStyles.sidebar.background,
            borderBottom: themeStyles.sidebar.borderColor
              ? `1px solid ${themeStyles.sidebar.borderColor}`
              : '1px solid',
            minHeight: '48px',
            height: '48px',
          }}
        >
          <div style={styles.tabsWrapper}>
            <button
              onClick={() => setSidebarTab('home')}
              onMouseEnter={(e) => {
                if (sidebarTab !== 'home') {
                  e.currentTarget.style.background =
                    theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                }
              }}
              onMouseLeave={(e) => {
                if (sidebarTab !== 'home') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
              style={{
                ...styles.tabButton,
                ...(sidebarTab === 'home' ? styles.tabButtonActive : {}),
                background:
                  sidebarTab === 'home'
                    ? theme === 'dark'
                      ? 'rgba(251, 191, 36, 0.15)'
                      : 'rgba(251, 191, 36, 0.1)'
                    : 'transparent',
                color: sidebarTab === 'home' ? '#fbbf24' : themeStyles.textSecondary,
                borderBottom: sidebarTab === 'home' ? `2px solid #fbbf24` : '2px solid transparent',
                padding: '8px',
                minHeight: '48px',
              }}
              title="Home"
            >
              <AiOutlineHome style={{ fontSize: '18px' }} />
            </button>
            <button
              onClick={() => setSidebarTab('jobs')}
              onMouseEnter={(e) => {
                if (sidebarTab !== 'jobs') {
                  e.currentTarget.style.background =
                    theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                }
              }}
              onMouseLeave={(e) => {
                if (sidebarTab !== 'jobs') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
              style={{
                ...styles.tabButton,
                ...(sidebarTab === 'jobs' ? styles.tabButtonActive : {}),
                background:
                  sidebarTab === 'jobs'
                    ? theme === 'dark'
                      ? 'rgba(251, 191, 36, 0.15)'
                      : 'rgba(251, 191, 36, 0.1)'
                    : 'transparent',
                color: sidebarTab === 'jobs' ? '#fbbf24' : themeStyles.textSecondary,
                borderBottom: sidebarTab === 'jobs' ? `2px solid #fbbf24` : '2px solid transparent',
                position: 'relative' as const,
                padding: '8px',
                minHeight: '48px',
              }}
              title="Jobs"
            >
              <AiOutlineFileText style={{ fontSize: '18px' }} />
            </button>
          </div>
        </div>

        {/* Dynamic Sidebar Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {sidebarTab === 'home' ? (
            <nav style={{ ...styles.nav, flex: 1, overflowY: 'auto' }}>
              <button
                onClick={() => setContentTab('overview')}
                style={{
                  ...styles.navItem,
                  ...(contentTab === 'overview' ? themeStyles.activeNav : {}),
                  color: contentTab === 'overview' ? '#000000' : themeStyles.text,
                  fontWeight: contentTab === 'overview' ? '700' : '500',
                }}
              >
                <AiOutlineDashboard style={{ marginRight: '8px' }} />
                Overview
              </button>
              <button
                onClick={() => setContentTab('users')}
                style={{
                  ...styles.navItem,
                  ...(contentTab === 'users' ? themeStyles.activeNav : {}),
                  color: contentTab === 'users' ? '#000000' : themeStyles.text,
                  fontWeight: contentTab === 'users' ? '700' : '500',
                }}
              >
                <AiOutlineUser style={{ marginRight: '8px' }} />
                Users
              </button>
              <button
                onClick={() => setContentTab('agents')}
                style={{
                  ...styles.navItem,
                  ...(contentTab === 'agents' ? themeStyles.activeNav : {}),
                  color: contentTab === 'agents' ? '#000000' : themeStyles.text,
                  fontWeight: contentTab === 'agents' ? '700' : '500',
                }}
              >
                <AiOutlinePrinter style={{ marginRight: '8px' }} />
                Agents
              </button>
              <button
                onClick={() => setContentTab('analytics')}
                style={{
                  ...styles.navItem,
                  ...(contentTab === 'analytics' ? themeStyles.activeNav : {}),
                  color: contentTab === 'analytics' ? '#000000' : themeStyles.text,
                  fontWeight: contentTab === 'analytics' ? '700' : '500',
                }}
              >
                <AiOutlineBarChart style={{ marginRight: '8px' }} />
                Analytics
              </button>
            </nav>
          ) : (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Search Bar */}
              <div
                style={{
                  padding: '8px 8px 6px',
                  borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <AiOutlineSearch
                    style={{
                      position: 'absolute',
                      left: '8px',
                      color: themeStyles.textSecondary,
                      fontSize: '14px',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={jobSearchQuery}
                    onChange={(e) => setJobSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px 6px 28px',
                      borderRadius: '4px',
                      border: `1px solid ${themeStyles.card.border}`,
                      background:
                        (themeStyles as any).input?.background || themeStyles.card.background,
                      color: (themeStyles as any).input?.color || themeStyles.text,
                      fontSize: '12px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = themeStyles.accent;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = themeStyles.card.border;
                    }}
                  />
                  {jobSearchQuery && (
                    <button
                      onClick={() => setJobSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '6px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: themeStyles.textSecondary,
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '3px',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = themeStyles.card.background;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <AiOutlineClose style={{ fontSize: '14px' }} />
                    </button>
                  )}
                </div>
              </div>

              {/* Jobs List */}
              <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '4px 0' }}>
                {!jobs || jobs.length === 0 ? (
                  <div
                    style={{
                      padding: '24px 12px',
                      textAlign: 'center',
                      color: themeStyles.textSecondary,
                    }}
                  >
                    <p style={{ fontSize: '14px', margin: 0 }}>No jobs found</p>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div
                    style={{
                      padding: '24px 12px',
                      textAlign: 'center',
                      color: themeStyles.textSecondary,
                    }}
                  >
                    <p style={{ fontSize: '14px', margin: 0, marginBottom: '4px' }}>
                      No jobs match your search
                    </p>
                    <p style={{ fontSize: '12px', margin: 0, opacity: 0.7 }}>
                      Try a different search term
                    </p>
                  </div>
                ) : (
                  <div style={{ ...sharedStyles.jobsList, gap: '2px', padding: '0 4px' }}>
                    {filteredJobs.map((job: any) => (
                      <JobListItem
                        key={job.id || job._id || job.printJobId}
                        job={job}
                        isSelected={isJobSelected(job)}
                        onSelect={() => setSelectedJob(isJobSelected(job) ? null : job)}
                        compact={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        style={{
          width: '4px',
          cursor: 'col-resize',
          background: 'transparent',
          position: 'relative',
          flexShrink: 0,
          zIndex: 10,
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = themeStyles.accent;
        }}
        onMouseLeave={(e) => {
          if (!isResizing) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '-2px',
            top: 0,
            bottom: 0,
            width: '4px',
            background: isResizing ? themeStyles.accent : 'transparent',
            transition: 'background 0.2s ease',
          }}
        />
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Header */}
        <div
          style={{
            ...styles.header,
            boxSizing: 'border-box' as const,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderBottom: themeStyles.sidebar.borderColor
              ? `1px solid ${themeStyles.sidebar.borderColor}`
              : '1px solid',
          }}
        >
          <div style={styles.userInfo}>
            <button onClick={toggleTheme} style={{ ...styles.iconButton, ...themeStyles.button }}>
              {theme === 'light' ? <AiOutlineMoon /> : <AiOutlineSun />}
            </button>
            <span style={{ color: themeStyles.text }}>{user?.name || 'Admin'}</span>
            <button
              onClick={logout}
              style={{ ...styles.logoutButton, ...themeStyles.dangerButton }}
            >
              <HiOutlineLogout style={{ marginRight: '4px' }} />
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        {sidebarTab === 'jobs' && selectedJob ? (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <JobPreview job={selectedJob} onClose={() => setSelectedJob(null)} />
          </div>
        ) : (
          <div style={styles.content}>
            {sidebarTab === 'jobs' && !selectedJob ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: themeStyles.textSecondary,
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <AiOutlineFileText style={{ fontSize: '48px', opacity: 0.3 }} />
                <p style={{ fontSize: '16px', margin: 0, fontWeight: '500' }}>
                  Select a job to view details
                </p>
                <p style={{ fontSize: '14px', margin: 0, opacity: 0.7 }}>
                  Click on any job from the sidebar to see its preview
                </p>
              </div>
            ) : (
              <>
                {contentTab === 'overview' && <OverviewTab themeStyles={themeStyles} />}
                {contentTab === 'users' && <UsersTab themeStyles={themeStyles} />}
                {contentTab === 'agents' && <AgentsTab themeStyles={themeStyles} />}
                {contentTab === 'analytics' && <AnalyticsTab themeStyles={themeStyles} />}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const OverviewTab = React.memo(function OverviewTab({ themeStyles }: { themeStyles: any }) {
  const [overviewData, setOverviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  React.useEffect(() => {
    loadOverviewData();
    // Increase interval to reduce load - 15 seconds instead of 5
    const interval = setInterval(loadOverviewData, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadOverviewData = async () => {
    try {
      const [analytics, agents, jobs] = await Promise.all([
        electronAPI.analytics.getData(),
        electronAPI.agents.getAll(),
        electronAPI.jobs.getAll(),
      ]);

      setOverviewData({
        analytics,
        agents,
        jobs,
        totalUsers: 0,
        activePrinters: agents.filter((a: any) => a.status === 'online').length,
        jobsToday: jobs.length,
        successRate: analytics?.successRate || 0,
      });
    } catch (error) {
      console.error('Failed to load overview data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !overviewData) {
    return (
      <div style={{ ...styles.card, ...themeStyles.card }}>
        <p style={{ color: themeStyles.text }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.overview}>
      <div style={{ ...styles.card, ...themeStyles.card }}>
        <h2
          style={{
            color: themeStyles.text,
            margin: 0,
            marginBottom: '12px',
            fontSize: '18px',
            fontWeight: '600',
          }}
        >
          System Overview
        </h2>
        <div style={styles.stats}>
          <div style={{ ...styles.statCard, ...themeStyles.card }}>
            <h3
              style={{
                color: themeStyles.textSecondary,
                margin: 0,
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              Total Users
            </h3>
            <p style={{ ...styles.statValue, color: themeStyles.accent, margin: 0 }}>
              {overviewData?.totalUsers || 0}
            </p>
          </div>
          <div style={{ ...styles.statCard, ...themeStyles.card }}>
            <h3
              style={{
                color: themeStyles.textSecondary,
                margin: 0,
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              Active Printers
            </h3>
            <p style={{ ...styles.statValue, color: themeStyles.accent, margin: 0 }}>
              {overviewData?.activePrinters || 0}
            </p>
          </div>
          <div style={{ ...styles.statCard, ...themeStyles.card }}>
            <h3
              style={{
                color: themeStyles.textSecondary,
                margin: 0,
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              Jobs Today
            </h3>
            <p style={{ ...styles.statValue, color: themeStyles.accent, margin: 0 }}>
              {overviewData?.jobsToday || 0}
            </p>
          </div>
          <div style={{ ...styles.statCard, ...themeStyles.card }}>
            <h3
              style={{
                color: themeStyles.textSecondary,
                margin: 0,
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              Success Rate
            </h3>
            <p style={{ ...styles.statValue, color: themeStyles.success, margin: 0 }}>
              {overviewData?.successRate ? `${overviewData.successRate.toFixed(1)}%` : '0%'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

const UsersTab = React.memo(function UsersTab({ themeStyles }: { themeStyles: any }) {
  return (
    <div style={{ ...styles.card, ...themeStyles.card }}>
      <h2
        style={{
          color: themeStyles.text,
          margin: 0,
          marginBottom: '16px',
          fontSize: '18px',
          fontWeight: '600',
        }}
      >
        User Management
      </h2>
      <button style={{ ...styles.actionButton, ...themeStyles.primaryButton }}>Add New User</button>
      <p style={{ color: themeStyles.textSecondary, marginTop: '16px', fontSize: '14px' }}>
        User list will go here
      </p>
    </div>
  );
});

const AgentsTab = React.memo(function AgentsTab({ themeStyles }: { themeStyles: any }) {
  const [agentStatus, setAgentStatus] = useState<string>('Not Running');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);

  React.useEffect(() => {
    checkAgentStatus();
    loadAgents();
    loadPrinters();
    // Increase interval to reduce load - 10 seconds instead of 2
    const interval = setInterval(() => {
      checkAgentStatus();
      loadAgents();
      loadPrinters();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkAgentStatus = async () => {
    try {
      const status = await electronAPI.agent.getStatus();
      setAgentStatus(status.isRunning ? 'Running' : 'Not Running');
    } catch (error) {
      console.error('Failed to get agent status:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const agentsData = await electronAPI.agents.getAll();
      setAgents(agentsData);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadPrinters = async () => {
    try {
      const printersData = await electronAPI.agent.getPrinters();
      setPrinters(printersData);
    } catch (error) {
      console.error('Failed to load printers:', error);
    }
  };

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (agentStatus === 'Running') {
        await electronAPI.agent.stop();
        setAgentStatus('Not Running');
      } else {
        await electronAPI.agent.start();
        setAgentStatus('Running');
      }
    } catch (error) {
      console.error('Failed to toggle agent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ ...styles.card, ...themeStyles.card }}>
      <h2
        style={{
          color: themeStyles.text,
          margin: 0,
          marginBottom: '16px',
          fontSize: '18px',
          fontWeight: '600',
        }}
      >
        Print Agents
      </h2>
      <div style={{ ...styles.statusCard, ...themeStyles.card }}>
        <div>
          <p style={{ color: themeStyles.textSecondary }}>Agent Status</p>
          <p
            style={{
              ...styles.statusBadge,
              color: agentStatus === 'Running' ? themeStyles.success : themeStyles.error,
            }}
          >
            {agentStatus}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={isLoading}
          style={{ ...styles.actionButton, ...themeStyles.primaryButton }}
        >
          {isLoading ? 'Loading...' : agentStatus === 'Running' ? 'Stop Agent' : 'Start Agent'}
        </button>
      </div>

      {/* Printers */}
      <div style={{ marginTop: '16px' }}>
        <h3
          style={{
            color: themeStyles.text,
            margin: 0,
            marginBottom: '12px',
            fontSize: '16px',
            fontWeight: '600',
          }}
        >
          Available Printers
        </h3>
        <div style={styles.printersGrid}>
          {printers.map((printer, i) => (
            <div key={i} style={{ ...styles.printerCard, ...themeStyles.card }}>
              <div>
                <p style={{ color: themeStyles.text, fontWeight: 'bold' }}>
                  {printer.displayName || printer.printerName}
                </p>
                <p style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
                  {printer.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agents List */}
      {agents.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h3
            style={{
              color: themeStyles.text,
              margin: 0,
              marginBottom: '12px',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            Registered Agents
          </h3>
          <div style={styles.agentsList}>
            {agents.map((agent) => (
              <div key={agent.id || agent._id} style={{ ...styles.agentCard, ...themeStyles.card }}>
                <div>
                  <p style={{ color: themeStyles.text, fontWeight: 'bold' }}>{agent.name}</p>
                  <p style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
                    {agent.location || 'No location'} • {agent.machineId}
                  </p>
                </div>
                <span
                  style={{
                    color: agent.status === 'online' ? themeStyles.success : themeStyles.error,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '12px',
                  }}
                >
                  {agent.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const AnalyticsTab = React.memo(function AnalyticsTab({ themeStyles }: { themeStyles: any }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [printerLogs, setPrinterLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  React.useEffect(() => {
    loadAnalytics();
    loadComparison();
    loadPrinterLogs();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await electronAPI.analytics.getData(dateRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadComparison = async () => {
    try {
      const data = await electronAPI.analytics.getComparison();
      setComparison(data);
    } catch (error) {
      console.error('Failed to load comparison:', error);
    }
  };

  const loadPrinterLogs = async () => {
    try {
      const logs = await electronAPI.logs.getLogsByDateRange(dateRange.start, dateRange.end);
      setPrinterLogs(logs);
    } catch (error) {
      console.error('Failed to load printer logs:', error);
    }
  };

  const getAnonymousLogs = () => {
    return printerLogs.filter((log) => log.metadata?.isAnonymous || !log.jobId);
  };

  if (isLoading && !analytics) {
    return (
      <div style={{ ...styles.card, ...themeStyles.card }}>
        <p style={{ color: themeStyles.text }}>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Date Range Selector */}
      <div style={{ ...styles.card, ...themeStyles.card }}>
        <h2 style={{ color: themeStyles.text }}>Filter by Date Range</h2>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
          }}
        >
          <div style={{ ...styles.card, ...themeStyles.card }}>
            <h3 style={{ color: themeStyles.textSecondary }}>Total Jobs</h3>
            <p style={{ ...styles.statValue, color: themeStyles.accent }}>
              {analytics.totalJobs || 0}
            </p>
          </div>
          <div style={{ ...styles.card, ...themeStyles.card }}>
            <h3 style={{ color: themeStyles.textSecondary }}>Completed</h3>
            <p style={{ ...styles.statValue, color: themeStyles.success }}>
              {analytics.completedJobs || 0}
            </p>
          </div>
          <div style={{ ...styles.card, ...themeStyles.card }}>
            <h3 style={{ color: themeStyles.textSecondary }}>Failed</h3>
            <p style={{ ...styles.statValue, color: themeStyles.error }}>
              {analytics.failedJobs || 0}
            </p>
          </div>
          <div style={{ ...styles.card, ...themeStyles.card }}>
            <h3 style={{ color: themeStyles.textSecondary }}>Success Rate</h3>
            <p style={{ ...styles.statValue, color: themeStyles.success }}>
              {analytics.successRate ? `${analytics.successRate.toFixed(1)}%` : '0%'}
            </p>
          </div>
        </div>
      )}

      {/* Comparison Data */}
      {comparison && (
        <div style={{ ...styles.card, ...themeStyles.card }}>
          <h2 style={{ color: themeStyles.text }}>Cloud vs Printer Comparison</h2>
          <div style={{ marginTop: '20px' }}>
            <p style={{ color: themeStyles.textSecondary }}>
              Requested Jobs: {comparison.requestedJobs?.length || 0}
            </p>
            <p style={{ color: themeStyles.textSecondary }}>
              Actual Prints: {comparison.actualPrints?.length || 0}
            </p>
            {comparison.discrepancies && comparison.discrepancies.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ color: themeStyles.text }}>Discrepancies</h3>
                <div style={styles.discrepanciesList}>
                  {comparison.discrepancies.map((disc: any, i: number) => (
                    <div key={i} style={{ ...styles.discrepancyCard, ...themeStyles.card }}>
                      <p style={{ color: themeStyles.text }}>Job ID: {disc.jobId}</p>
                      <p style={{ color: themeStyles.textSecondary }}>
                        Requested: {disc.requestedPages} pages
                      </p>
                      <p style={{ color: themeStyles.textSecondary }}>
                        Actual: {disc.actualPages} pages
                      </p>
                      <p
                        style={{
                          color: disc.difference > 0 ? themeStyles.warning : themeStyles.success,
                          fontWeight: 'bold',
                        }}
                      >
                        Difference: {disc.difference} pages
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printer Logs - Anonymous Printing (Admin Only) */}
      <div style={{ ...styles.card, ...themeStyles.card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: themeStyles.text }}>Printer Logs (Anonymous Printing)</h2>
          <button
            onClick={loadPrinterLogs}
            style={{ ...styles.actionButton, ...themeStyles.primaryButton }}
          >
            Refresh
          </button>
        </div>
        <p style={{ color: themeStyles.textSecondary, fontSize: '12px', margin: '10px 0' }}>
          These are prints made directly from the printer without going through the agent
        </p>
        <div style={{ maxHeight: '400px', overflow: 'auto', marginTop: '20px' }}>
          {getAnonymousLogs().length === 0 ? (
            <p style={{ color: themeStyles.textSecondary }}>No anonymous printing detected</p>
          ) : (
            <div style={styles.logsList}>
              {getAnonymousLogs().map((log, i) => (
                <div key={i} style={{ ...styles.logCard, ...themeStyles.card }}>
                  <div>
                    <p style={{ color: themeStyles.text, fontWeight: 'bold' }}>
                      {log.fileName || 'Unknown File'}
                    </p>
                    <p style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
                      {log.printerName} • {new Date(log.timestamp).toLocaleString()}
                    </p>
                    <p style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
                      {log.event} • {log.message}
                    </p>
                  </div>
                  <span
                    style={{
                      color:
                        log.event === 'complete' ? themeStyles.success : themeStyles.textSecondary,
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      fontSize: '12px',
                    }}
                  >
                    {log.event}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const styles = {
  wrapper: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  sidebar: {
    width: '220px',
    display: 'flex',
    flexDirection: 'column' as const,
    borderRight: '1px solid',
  },
  sidebarHeader: {
    padding: '16px',
    borderBottom: '1px solid',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '8px',
    gap: '4px',
  },
  navItem: {
    padding: '10px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: '14px',
    background: 'transparent',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'end',
    alignItems: 'center',
    padding: '8px 16px',
    borderBottom: '1px solid',
    minHeight: '48px',
    height: '48px',
  },
  userInfo: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  iconButton: {
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'all 0.2s ease',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
  },
  content: {
    flex: 1,
    padding: '16px',
    overflow: 'auto',
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
  },
  overview: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  card: {
    padding: '16px',
    borderRadius: '8px',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '12px',
    marginTop: '16px',
  },
  statCard: {
    padding: '16px',
    borderRadius: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginTop: '8px',
  },
  statusCard: {
    padding: '16px',
    borderRadius: '8px',
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginTop: '4px',
  },
  actionButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  printersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '10px',
    marginTop: '12px',
  },
  printerCard: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid',
  },
  agentsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginTop: '12px',
  },
  agentCard: {
    padding: '12px',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discrepanciesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginTop: '12px',
  },
  discrepancyCard: {
    padding: '12px',
    borderRadius: '6px',
  },
  logsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  logCard: {
    padding: '12px',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    borderBottom: '1px solid',
  },
  tabsWrapper: {
    display: 'flex',
    width: '100%',
    height: '100%',
  },
  tabButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
  },
  tabButtonActive: {
    fontWeight: '600',
  },
};

const lightStyles = {
  container: { background: '#f5f7fa' },
  text: '#1a2d4f',
  textSecondary: '#4a5a7a',
  accent: '#1e4d72',
  success: '#10b981',
  error: '#ef4444',
  sidebar: { background: '#ffffff', borderColor: '#cbd5e0' },
  card: { background: '#ffffff', border: '1px solid #cbd5e0' },
  button: { background: '#ffffff', color: '#1a2d4f', border: '1px solid #cbd5e0' },
  input: { background: '#ffffff', color: '#1a2d4f', border: '1px solid #cbd5e0' },
  primaryButton: { background: '#1e4d72', color: '#ffffff' },
  dangerButton: { background: '#ef4444', color: '#ffffff' },
  activeNav: { background: '#1e4d72' },
  warning: '#f59e0b',
};

const darkStyles = {
  container: { background: '#1e293b' },
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  accent: '#60a5fa',
  success: '#34d399',
  error: '#f87171',
  sidebar: { background: '#0f172a', borderColor: '#334155' },
  card: { background: '#0f172a', border: '1px solid #334155' },
  button: { background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' },
  input: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' },
  primaryButton: { background: '#60a5fa', color: '#0f172a' },
  dangerButton: { background: '#f87171', color: '#0f172a' },
  activeNav: { background: '#60a5fa' },
  warning: '#fbbf24',
};
