import { useAuthStore } from '../auth/store/authStore';
import { useTheme } from '../../context/ThemeContext';
import React, { useState } from 'react';
import { electronAPI } from '../../lib';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'agents' | 'analytics'>('overview');

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <div style={{ ...styles.sidebar, ...themeStyles.sidebar }}>
        <div style={styles.sidebarHeader}>
          <h2 style={{ color: themeStyles.text, margin: 0 }}>⚙️ Admin Panel</h2>
        </div>
        <nav style={styles.nav}>
          <button 
            onClick={() => setActiveTab('overview')}
            style={{ 
              ...styles.navItem, 
              ...(activeTab === 'overview' ? themeStyles.activeNav : {}),
              color: activeTab === 'overview' ? '#ffffff' : themeStyles.text
            }}
          >
            📊 Overview
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            style={{ 
              ...styles.navItem, 
              ...(activeTab === 'users' ? themeStyles.activeNav : {}),
              color: activeTab === 'users' ? '#ffffff' : themeStyles.text
            }}
          >
            👥 Users
          </button>
          <button 
            onClick={() => setActiveTab('agents')}
            style={{ 
              ...styles.navItem, 
              ...(activeTab === 'agents' ? themeStyles.activeNav : {}),
              color: activeTab === 'agents' ? '#ffffff' : themeStyles.text
            }}
          >
            🖨️ Agents
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            style={{ 
              ...styles.navItem, 
              ...(activeTab === 'analytics' ? themeStyles.activeNav : {}),
              color: activeTab === 'analytics' ? '#ffffff' : themeStyles.text
            }}
          >
            📈 Analytics
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.userInfo}>
            <button onClick={toggleTheme} style={{ ...styles.iconButton, ...themeStyles.button }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <span style={{ color: themeStyles.text }}>{user?.name || 'Admin'}</span>
            <button onClick={logout} style={{ ...styles.logoutButton, ...themeStyles.dangerButton }}>
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {activeTab === 'overview' && <OverviewTab themeStyles={themeStyles} />}
          {activeTab === 'users' && <UsersTab themeStyles={themeStyles} />}
          {activeTab === 'agents' && <AgentsTab themeStyles={themeStyles} />}
          {activeTab === 'analytics' && <AnalyticsTab themeStyles={themeStyles} />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ themeStyles }: { themeStyles: any }) {
  const [overviewData, setOverviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  React.useEffect(() => {
    loadOverviewData();
    const interval = setInterval(loadOverviewData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadOverviewData = async () => {
    try {
      const [analytics, agents, jobs] = await Promise.all([
        electronAPI.analytics.getData(),
        electronAPI.agents.getAll(),
        electronAPI.jobs.getAll()
      ]);
      
      setOverviewData({
        analytics,
        agents,
        jobs,
        totalUsers: 0,
        activePrinters: agents.filter((a: any) => a.status === 'online').length,
        jobsToday: jobs.length,
        successRate: analytics?.successRate || 0
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
        <h2 style={{ color: themeStyles.text }}>System Overview</h2>
        <div style={styles.stats}>
          <div style={{ ...styles.statCard, ...themeStyles.card }}>
            <h3 style={{ color: themeStyles.textSecondary }}>Total Users</h3>
            <p style={{ ...styles.statValue, color: themeStyles.accent }}>
              {overviewData?.totalUsers || 0}
            </p>
          </div>
          <div style={{ ...styles.statCard, ...themeStyles.card }}>
            <h3 style={{ color: themeStyles.textSecondary }}>Active Printers</h3>
            <p style={{ ...styles.statValue, color: themeStyles.accent }}>
              {overviewData?.activePrinters || 0}
            </p>
          </div>
          <div style={{ ...styles.statCard, ...themeStyles.card }}>
            <h3 style={{ color: themeStyles.textSecondary }}>Jobs Today</h3>
            <p style={{ ...styles.statValue, color: themeStyles.accent }}>
              {overviewData?.jobsToday || 0}
            </p>
          </div>
          <div style={{ ...styles.statCard, ...themeStyles.card }}>
            <h3 style={{ color: themeStyles.textSecondary }}>Success Rate</h3>
            <p style={{ ...styles.statValue, color: themeStyles.success }}>
              {overviewData?.successRate ? `${overviewData.successRate.toFixed(1)}%` : '0%'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTab({ themeStyles }: { themeStyles: any }) {
  return (
    <div style={{ ...styles.card, ...themeStyles.card }}>
      <h2 style={{ color: themeStyles.text }}>User Management</h2>
      <button style={{ ...styles.actionButton, ...themeStyles.primaryButton }}>
        Add New User
      </button>
      <p style={{ color: themeStyles.textSecondary, marginTop: '20px' }}>User list will go here</p>
    </div>
  );
}

function AgentsTab({ themeStyles }: { themeStyles: any }) {
  const [agentStatus, setAgentStatus] = useState<string>('Not Running');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);

  React.useEffect(() => {
    checkAgentStatus();
    loadAgents();
    loadPrinters();
    const interval = setInterval(() => {
      checkAgentStatus();
      loadAgents();
      loadPrinters();
    }, 2000);
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
      <h2 style={{ color: themeStyles.text }}>Print Agents</h2>
      <div style={{ ...styles.statusCard, ...themeStyles.card }}>
        <div>
          <p style={{ color: themeStyles.textSecondary }}>Agent Status</p>
          <p style={{ ...styles.statusBadge, color: agentStatus === 'Running' ? themeStyles.success : themeStyles.error }}>
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
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ color: themeStyles.text }}>Available Printers</h3>
        <div style={styles.printersGrid}>
          {printers.map((printer, i) => (
            <div key={i} style={{ ...styles.printerCard, ...themeStyles.card }}>
              <div>
                <p style={{ color: themeStyles.text, fontWeight: 'bold' }}>{printer.displayName || printer.printerName}</p>
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
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ color: themeStyles.text }}>Registered Agents</h3>
          <div style={styles.agentsList}>
            {agents.map((agent) => (
              <div key={agent.id || agent._id} style={{ ...styles.agentCard, ...themeStyles.card }}>
                <div>
                  <p style={{ color: themeStyles.text, fontWeight: 'bold' }}>{agent.name}</p>
                  <p style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
                    {agent.location || 'No location'} • {agent.machineId}
                  </p>
                </div>
                <span style={{ 
                  color: agent.status === 'online' ? themeStyles.success : themeStyles.error,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '12px'
                }}>
                  {agent.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ themeStyles }: { themeStyles: any }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [printerLogs, setPrinterLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
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
    return printerLogs.filter(log => log.metadata?.isAnonymous || !log.jobId);
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ ...styles.card, ...themeStyles.card }}>
            <h3 style={{ color: themeStyles.textSecondary }}>Total Jobs</h3>
            <p style={{ ...styles.statValue, color: themeStyles.accent }}>{analytics.totalJobs || 0}</p>
          </div>
          <div style={{ ...styles.card, ...themeStyles.card }}>
            <h3 style={{ color: themeStyles.textSecondary }}>Completed</h3>
            <p style={{ ...styles.statValue, color: themeStyles.success }}>{analytics.completedJobs || 0}</p>
          </div>
          <div style={{ ...styles.card, ...themeStyles.card }}>
            <h3 style={{ color: themeStyles.textSecondary }}>Failed</h3>
            <p style={{ ...styles.statValue, color: themeStyles.error }}>{analytics.failedJobs || 0}</p>
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
                      <p style={{ 
                        color: disc.difference > 0 ? themeStyles.warning : themeStyles.success,
                        fontWeight: 'bold'
                      }}>
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
                  <span style={{
                    color: log.event === 'complete' ? themeStyles.success : themeStyles.textSecondary,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '12px'
                  }}>
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
}

const styles = {
  wrapper: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  sidebar: {
    width: '250px',
    display: 'flex',
    flexDirection: 'column' as const,
    borderRight: '1px solid',
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '10px',
    gap: '5px',
  },
  navItem: {
    padding: '12px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: '14px',
    background: 'transparent',
    transition: 'all 0.2s ease',
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
    padding: '13.5px',
    borderBottom: '1px solid',
  },
  userInfo: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  iconButton: {
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '20px',
    transition: 'all 0.2s ease',
    border: 'none',
  },
  logoutButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  content: {
    flex: 1,
    padding: '20px',
    overflow: 'auto',
  },
  overview: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  card: {
    padding: '24px',
    borderRadius: '8px',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  statCard: {
    padding: '20px',
    borderRadius: '8px',
  },
  statValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginTop: '10px',
  },
  statusCard: {
    padding: '20px',
    borderRadius: '8px',
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginTop: '5px',
  },
  actionButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  printersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
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
    gap: '12px',
    marginTop: '12px',
  },
  agentCard: {
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discrepanciesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginTop: '12px',
  },
  discrepancyCard: {
    padding: '16px',
    borderRadius: '8px',
  },
  logsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  logCard: {
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  primaryButton: { background: '#60a5fa', color: '#0f172a' },
  dangerButton: { background: '#f87171', color: '#0f172a' },
  activeNav: { background: '#60a5fa' },
  warning: '#fbbf24',
};
