import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../auth/store/authStore';
import { useTheme } from '../../../context/ThemeContext';
import { useSettings } from '../../../context/SettingsContext';
import { useQuery } from '@tanstack/react-query';
import { electronAPI } from '../../../lib';
import {
  AiOutlinePrinter,
  AiOutlineFileAdd,
  AiOutlineMoon,
  AiOutlineSun,
  AiOutlineDashboard,
  AiOutlineCheckCircle,
  AiOutlineClockCircle,
  AiOutlineUser,
  AiOutlineSetting,
  AiOutlineHome,
  AiOutlineFileText,
  AiOutlineSearch,
  AiOutlineClose,
  AiOutlineAppstore,
} from 'react-icons/ai';
import { HiOutlineLogout } from 'react-icons/hi';
import { lightStyles, darkStyles, sharedStyles } from '../shared/clerkStyles';
import { FaUserTie } from 'react-icons/fa';
import { SettingsModal } from '../../../shared/components/SettingsModal';
import { JobListItem, JobPreview } from '../shared';
import { useDebounce } from '../../../shared/hooks/useDebounce';

export default function ClerkLayout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const { getFontSize, getSpacing, getIconSize } = useSettings();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activeTab, setActiveTab] = useState<'home' | 'jobs'>('home');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(jobSearchQuery, 300); // Debounce search by 300ms
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Fetch jobs globally - optimized query settings
  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => electronAPI.jobs.getAll(),
    staleTime: 30000, // 30 seconds - reduce refetch frequency
    gcTime: 300000, // 5 minutes cache (formerly cacheTime)
    refetchInterval: 30000, // Refetch every 30 seconds instead of 10
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
  });

  // Memoize pending jobs count
  const pendingCount = useMemo(() => {
    if (!jobs) return 0;
    return jobs.filter((job: any) => job.status === 'pending' || job.status === 'queued').length;
  }, [jobs]);

  // Fetch printers for status - optimized query settings
  const { data: printers } = useQuery({
    queryKey: ['printers'],
    queryFn: () => electronAPI.agent.getPrinters(),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes cache (formerly cacheTime)
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Memoize printer counts
  const onlinePrintersCount = useMemo(() => {
    if (!printers) return 0;
    return printers.filter((p: any) => p.status === 'online').length;
  }, [printers]);

  const totalPrintersCount = useMemo(() => {
    return printers?.length || 0;
  }, [printers]);

  // Current time state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Memoize themeStyles to ensure consistent updates across all components
  const themeStyles = useMemo(() => {
    return theme === 'dark' ? darkStyles : lightStyles;
  }, [theme]);

  // Memoize dynamic sizes based on settings to prevent recalculation
  // Note: getFontSize, getSpacing, getIconSize are already memoized in context
  const fontSize = getFontSize();
  const spacing = getSpacing();
  const iconSize = 16 * getIconSize();

  // Reset selected job when switching tabs or routes
  useEffect(() => {
    if (activeTab === 'home') {
      setSelectedJob(null);
    }
  }, [activeTab, location.pathname]);

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
      // Get client fullName from populated clientId
      const clientName = job.clientId && typeof job.clientId === 'object' 
        ? (job.clientId.fullName || '').toLowerCase() 
        : '';
      const fileName = (job.fileName || '').toLowerCase();
      const artwork = (job.artwork || '').toLowerCase();
      const printerName = (job.printerName || '').toLowerCase();
      const status = (job.status || '').toLowerCase();
      const description = (job.description || '').toLowerCase();

      return (
        clientName.includes(query) ||
        fileName.includes(query) ||
        artwork.includes(query) ||
        printerName.includes(query) ||
        status.includes(query) ||
        description.includes(query)
      );
    });
  }, [jobs, debouncedSearchQuery]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.mainContainer}>
        {/* Sidebar */}
        <div
          style={{
            ...styles.sidebar,
            ...themeStyles.sidebar,
            width: isSidebarCollapsed
              ? '60px'
              : sidebarWidth !== null
                ? `${sidebarWidth}px`
                : `${Math.max(200, 200 * spacing)}px`,
            transition: isResizing ? 'none' : 'width 0.2s ease',
            position: windowWidth < 768 ? 'absolute' : 'relative',
            zIndex: windowWidth < 768 ? 1000 : 'auto',
            height: windowWidth < 768 ? '100%' : 'auto',
            boxShadow:
              windowWidth < 768 && !isSidebarCollapsed ? '2px 0 8px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          {/* Tab Switcher - VS Code style */}
          <div
            style={{
              ...styles.tabContainer,
              ...themeStyles.sidebarHeader,
              padding: 0,
              borderBottom: themeStyles.sidebar.borderColor
                ? `1px solid ${themeStyles.sidebar.borderColor}`
                : '1px solid',
              minHeight: `${48 * spacing}px`,
              height: `${48 * spacing}px`,
            }}
          >
            <div style={styles.tabsWrapper}>
              <button
                onClick={() => setActiveTab('home')}
                onMouseEnter={(e) => {
                  if (activeTab !== 'home') {
                    e.currentTarget.style.background =
                      theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'home') {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === 'home' ? styles.tabButtonActive : {}),
                  background:
                    activeTab === 'home'
                      ? theme === 'dark'
                        ? 'rgba(251, 191, 36, 0.15)'
                        : 'rgba(251, 191, 36, 0.1)'
                      : 'transparent',
                  color: activeTab === 'home' ? '#fbbf24' : themeStyles.textSecondary,
                  borderBottom:
                    activeTab === 'home' ? `2px solid #fbbf24` : '2px solid transparent',
                  padding: `${8 * spacing}px`,
                  minHeight: `${48 * spacing}px`,
                }}
                title="Home"
              >
                <AiOutlineHome style={{ fontSize: `${iconSize}px` }} />
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                onMouseEnter={(e) => {
                  if (activeTab !== 'jobs') {
                    e.currentTarget.style.background =
                      theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'jobs') {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === 'jobs' ? styles.tabButtonActive : {}),
                  background:
                    activeTab === 'jobs'
                      ? theme === 'dark'
                        ? 'rgba(251, 191, 36, 0.15)'
                        : 'rgba(251, 191, 36, 0.1)'
                      : 'transparent',
                  color: activeTab === 'jobs' ? '#fbbf24' : themeStyles.textSecondary,
                  borderBottom:
                    activeTab === 'jobs' ? `2px solid #fbbf24` : '2px solid transparent',
                  position: 'relative' as const,
                  padding: `${8 * spacing}px`,
                  minHeight: `${48 * spacing}px`,
                }}
                title="Jobs"
              >
                <AiOutlineFileText style={{ fontSize: `${iconSize}px` }} />
                {pendingCount > 0 && (
                  <span
                    style={{
                      ...badgeStyles,
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      minWidth: '16px',
                      height: '16px',
                      fontSize: '10px',
                      padding: '0 4px',
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          {/* Dynamic Sidebar Content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'home' ? (
              <nav
                style={{
                  ...styles.nav,
                  padding: `${10 * spacing}px`,
                  gap: `${5 * spacing}px`,
                  flex: 1,
                  overflowY: 'auto',
                }}
              >
                <NavLink
                  to="/clerk/dashboard"
                  style={({ isActive }) => ({
                    ...styles.navItem,
                    ...(isActive ? themeStyles.activeNav : {}),
                    color: isActive ? '#000000' : themeStyles.text,
                    fontWeight: isActive ? '700' : '500',
                  })}
                >
                  <AiOutlineDashboard
                    style={{ marginRight: `${8 * spacing}px`, fontSize: `${iconSize}px` }}
                  />
                  {!isSidebarCollapsed && 'Dashboard'}
                </NavLink>
                <NavLink
                  to="/clerk/submit"
                  style={({ isActive }) => ({
                    ...styles.navItem,
                    ...(isActive ? themeStyles.activeNav : {}),
                    color: isActive ? '#000000' : themeStyles.text,
                    fontWeight: isActive ? '700' : '500',
                  })}
                >
                  <AiOutlineFileAdd
                    style={{ marginRight: `${8 * spacing}px`, fontSize: `${iconSize}px` }}
                  />
                  {!isSidebarCollapsed && 'Submit Print'}
                </NavLink>
                <NavLink
                  to="/clerk/status"
                  style={({ isActive }) => ({
                    ...styles.navItem,
                    ...(isActive ? themeStyles.activeNav : {}),
                    color: isActive ? '#000000' : themeStyles.text,
                    fontWeight: isActive ? '700' : '500',
                  })}
                >
                  <AiOutlinePrinter
                    style={{ marginRight: `${8 * spacing}px`, fontSize: `${iconSize}px` }}
                  />
                  {!isSidebarCollapsed && 'Printer Status'}
                </NavLink>
                <NavLink
                  to="/clerk/profile"
                  style={({ isActive }) => ({
                    ...styles.navItem,
                    ...(isActive ? themeStyles.activeNav : {}),
                    color: isActive ? '#000000' : themeStyles.text,
                    fontWeight: isActive ? '700' : '500',
                  })}
                >
                  <FaUserTie
                    style={{ marginRight: `${8 * spacing}px`, fontSize: `${iconSize}px` }}
                  />
                  {!isSidebarCollapsed && 'Profile'}
                </NavLink>
                {user?.role === 'admin' && (
                  <>
                    <NavLink
                      to="/clerk/user-management"
                      style={({ isActive }) => ({
                        ...styles.navItem,
                        ...(isActive ? themeStyles.activeNav : {}),
                        color: isActive ? '#000000' : themeStyles.text,
                        fontWeight: isActive ? '700' : '500',
                      })}
                    >
                      <AiOutlineUser
                        style={{ marginRight: `${8 * spacing}px`, fontSize: `${iconSize}px` }}
                      />
                      {!isSidebarCollapsed && 'User Management'}
                    </NavLink>
                    <NavLink
                      to="/clerk/services"
                      style={({ isActive }) => ({
                        ...styles.navItem,
                        ...(isActive ? themeStyles.activeNav : {}),
                        color: isActive ? '#000000' : themeStyles.text,
                        fontWeight: isActive ? '700' : '500',
                      })}
                    >
                      <AiOutlineAppstore
                        style={{ marginRight: `${8 * spacing}px`, fontSize: `${iconSize}px` }}
                      />
                      {!isSidebarCollapsed && 'Services'}
                    </NavLink>
                  </>
                )}
              </nav>
            ) : (
              <div
                style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                {/* Search Bar */}
                <div
                  style={{
                    padding: `${8 * spacing}px ${8 * spacing}px ${6 * spacing}px`,
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
                        left: `${8 * spacing}px`,
                        color: themeStyles.textSecondary,
                        fontSize: `${iconSize * 0.75}px`,
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
                        padding: `${6 * spacing}px ${8 * spacing}px ${6 * spacing}px ${28 * spacing}px`,
                        borderRadius: '4px',
                        border: `1px solid ${themeStyles.card.border}`,
                        background: themeStyles.input.background,
                        color: themeStyles.input.color,
                        fontSize: `${fontSize * 0.9}px`,
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
                          right: `${6 * spacing}px`,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: themeStyles.textSecondary,
                          padding: `${2 * spacing}px`,
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
                        <AiOutlineClose style={{ fontSize: `${iconSize * 0.75}px` }} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Jobs List */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: `${4 * spacing}px 0`,
                  }}
                >
                  {!jobs || jobs.length === 0 ? (
                    <div
                      style={{
                        padding: `${24 * spacing}px ${12 * spacing}px`,
                        textAlign: 'center',
                        color: themeStyles.textSecondary,
                      }}
                    >
                      <p style={{ fontSize: `${fontSize}px`, margin: 0 }}>No jobs found</p>
                    </div>
                  ) : filteredJobs.length === 0 ? (
                    <div
                      style={{
                        padding: `${24 * spacing}px ${12 * spacing}px`,
                        textAlign: 'center',
                        color: themeStyles.textSecondary,
                      }}
                    >
                      <p
                        style={{
                          fontSize: `${fontSize}px`,
                          margin: 0,
                          marginBottom: `${4 * spacing}px`,
                        }}
                      >
                        No jobs match your search
                      </p>
                      <p style={{ fontSize: `${fontSize * 0.85}px`, margin: 0, opacity: 0.7 }}>
                        Try a different search term
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        ...sharedStyles.jobsList,
                        gap: `${2 * spacing}px`,
                        padding: `0 ${4 * spacing}px`,
                      }}
                    >
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
        {!isSidebarCollapsed && windowWidth >= 768 && (
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
        )}

        {/* Main Content */}
        <div style={styles.main}>
          {/* Header */}
          <div
            style={{
              ...styles.header,
              ...themeStyles.header,
              padding: `0 var(--spacing-md, ${12 * spacing}px)`,
              minHeight: `${48 * spacing}px`,
              height: `${48 * spacing}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              boxSizing: 'border-box' as const,
              borderBottom: themeStyles.sidebar.borderColor
                ? `1px solid ${themeStyles.sidebar.borderColor}`
                : themeStyles.header.borderBottom || '1px solid',
            }}
          >
            <div style={{ ...styles.userInfo, gap: `${8 * spacing}px` }}>
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                style={{
                  ...styles.iconButton,
                  ...themeStyles.iconButton,
                  fontSize: `${iconSize}px`,
                }}
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isSidebarCollapsed ? '→' : '←'}
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                style={{
                  ...styles.iconButton,
                  ...themeStyles.iconButton,
                  fontSize: `${iconSize}px`,
                }}
                aria-label="Open settings"
              >
                <AiOutlineSetting />
              </button>
              <button
                onClick={toggleTheme}
                style={{
                  ...styles.iconButton,
                  ...themeStyles.iconButton,
                  fontSize: `${iconSize}px`,
                }}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <AiOutlineMoon /> : <AiOutlineSun />}
              </button>
              <span style={{ color: themeStyles.text, fontSize: `${fontSize}px` }}>
                {user?.name || 'Clerk'}
              </span>
              <button
                onClick={logout}
                style={{
                  ...styles.logoutButton,
                  ...themeStyles.dangerButton,
                  fontSize: `${fontSize}px`,
                  padding: `${6 * spacing}px ${12 * spacing}px`,
                }}
              >
                <HiOutlineLogout
                  style={{ marginRight: `${4 * spacing}px`, fontSize: `${iconSize}px` }}
                />
                Logout
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'jobs' && selectedJob ? (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <JobPreview job={selectedJob} onClose={() => setSelectedJob(null)} />
            </div>
          ) : (
            <div
              style={{ ...styles.content, padding: `${12 * spacing}px`, fontSize: `${fontSize}px` }}
              key={theme}
            >
              {activeTab === 'jobs' && !selectedJob ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: themeStyles.textSecondary,
                    flexDirection: 'column',
                    gap: `${8 * spacing}px`,
                  }}
                >
                  <AiOutlineFileText style={{ fontSize: `${48 * spacing}px`, opacity: 0.3 }} />
                  <p style={{ fontSize: `${fontSize + 2}px`, margin: 0, fontWeight: '500' }}>
                    Select a job to view details
                  </p>
                  <p style={{ fontSize: `${fontSize}px`, margin: 0, opacity: 0.7 }}>
                    Click on any job from the sidebar to see its preview
                  </p>
                </div>
              ) : (
                <Outlet />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Task Bar */}
      <div style={{ ...styles.taskBar, ...themeStyles.taskBar }}>
        <div style={styles.taskBarLeft}>
          <div style={styles.taskBarItem}>
            <AiOutlineCheckCircle
              style={{
                color: themeStyles.success,
                fontSize: '14px',
                marginRight: '6px',
              }}
            />
            <span style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
              {onlinePrintersCount}/{totalPrintersCount} Printers Online
            </span>
          </div>
          {pendingCount > 0 && (
            <div style={styles.taskBarItem}>
              <AiOutlineClockCircle
                style={{
                  color: themeStyles.warning,
                  fontSize: '14px',
                  marginRight: '6px',
                }}
              />
              <span style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
                {pendingCount} Pending Job{pendingCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        <div style={styles.taskBarRight}>
          <span style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    overflow: 'hidden',
    overflowX: 'hidden' as const,
    width: '100vw',
  },
  mainContainer: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  },
  sidebar: {
    width: '200px',
    minWidth: '60px',
    display: 'flex',
    flexDirection: 'column' as const,
    borderRight: '1px solid',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    flexShrink: 0,
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    minHeight: '40px',
    padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '10px',
    gap: '5px',
  },
  navItem: {
    padding: '6px 8px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: '13px',
    background: 'transparent',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    fontWeight: '500',
    textDecoration: 'none',
    position: 'relative' as const,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    overflowX: 'hidden' as const,
    minWidth: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: '48px',
    height: '48px',
  },
  userInfo: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  iconButton: {
    padding: '6px',
    borderRadius: '4px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    minWidth: '32px',
    minHeight: '32px',
  },
  logoutButton: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  content: {
    flex: 1,
    padding: '12px',
    overflow: 'auto',
    overflowX: 'hidden' as const,
    minWidth: 0,
  },
  taskBar: {
    height: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 12px',
    borderTop: '1px solid',
    fontSize: '12px',
    flexShrink: 0,
  },
  taskBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  taskBarRight: {
    display: 'flex',
    alignItems: 'center',
  },
  taskBarItem: {
    display: 'flex',
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

const badgeStyles: React.CSSProperties = {
  background: '#ef4444',
  color: '#ffffff',
  borderRadius: '100px',
  minWidth: '20px',
  height: '20px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 'bold',
  marginLeft: '8px',
};



