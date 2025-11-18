import React, { useMemo, useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
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
} from 'react-icons/ai';
import { HiOutlineLogout } from 'react-icons/hi';
import { lightStyles, darkStyles } from '../shared/clerkStyles';
import { FaUserTie } from 'react-icons/fa';
import { SettingsModal } from '../../../shared/components/SettingsModal';

export default function ClerkLayout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const { getFontSize, getSpacing, getIconSize } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch jobs globally
  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => electronAPI.jobs.getAll(),
    staleTime: 5000, // 5 seconds for real-time updates
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Count pending jobs
  const pendingCount =
    jobs?.filter((job: any) => job.status === 'pending' || job.status === 'queued').length || 0;

  // Fetch printers for status
  const { data: printers } = useQuery({
    queryKey: ['printers'],
    queryFn: () => electronAPI.agent.getPrinters(),
    staleTime: 5000,
    refetchInterval: 10000,
  });

  const onlinePrintersCount = printers?.filter((p: any) => p.status === 'online').length || 0;
  const totalPrintersCount = printers?.length || 0;

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

  // Calculate dynamic sizes based on settings
  const fontSize = getFontSize();
  const spacing = getSpacing();
  const iconSize = 16 * getIconSize();

  return (
    <div style={styles.wrapper}>
      <div style={styles.mainContainer}>
        {/* Sidebar */}
        <div
          style={{
            ...styles.sidebar,
            ...themeStyles.sidebar,
            width: isSidebarCollapsed ? '60px' : `${Math.max(200, 200 * spacing)}px`,
            transition: 'width 0.2s ease',
            position: windowWidth < 768 ? 'absolute' : 'relative',
            zIndex: windowWidth < 768 ? 1000 : 'auto',
            height: windowWidth < 768 ? '100%' : 'auto',
            boxShadow:
              windowWidth < 768 && !isSidebarCollapsed ? '2px 0 8px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <div 
            style={{ 
              ...styles.sidebarHeader, 
              ...themeStyles.sidebarHeader,
              padding: `var(--spacing-sm, ${8 * spacing}px) var(--spacing-md, ${12 * spacing}px)`,
              minHeight: `${40 * spacing}px`,
              height: `${40 * spacing}px`,
            }}
          >
            {!isSidebarCollapsed && (
              <h2
                style={{
                  color: '#fbbf24',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${8 * spacing}px`,
                  fontWeight: '600',
                  fontSize: `${fontSize + 2}px`,
                  lineHeight: `${(fontSize + 2) * 1.2}px`,
                }}
              >
                <AiOutlinePrinter style={{ fontSize: `${iconSize}px` }} /> Print Station
              </h2>
            )}
            {isSidebarCollapsed && (
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <AiOutlinePrinter style={{ fontSize: `${iconSize}px`, color: '#fbbf24' }} />
              </div>
            )}
          </div>
          <nav style={{ ...styles.nav, padding: `${10 * spacing}px`, gap: `${5 * spacing}px` }}>
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
              to="/clerk/jobs"
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
              {!isSidebarCollapsed && (
                <>
                  Print Jobs
                  {pendingCount > 0 && <span style={badgeStyles}>{pendingCount}</span>}
                </>
              )}
              {isSidebarCollapsed && pendingCount > 0 && (
                <span style={{ ...badgeStyles, position: 'absolute', right: '8px' }}>
                  {pendingCount}
                </span>
              )}
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
              <FaUserTie style={{ marginRight: `${8 * spacing}px`, fontSize: `${iconSize}px` }} />
              {!isSidebarCollapsed && 'Profile'}
            </NavLink>
            {user?.role === 'admin' && (
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
            )}
          </nav>
        </div>

        {/* Main Content */}
        <div style={styles.main}>
          {/* Header */}
          <div
            style={{
              ...styles.header,
              ...themeStyles.header,
              padding: `var(--spacing-sm, ${8 * spacing}px) var(--spacing-md, ${12 * spacing}px)`,
              minHeight: `${40 * spacing}px`,
              height: `${40 * spacing}px`,
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
          <div
            style={{ ...styles.content, padding: `${12 * spacing}px`, fontSize: `${fontSize}px` }}
            key={theme}
          >
            <Outlet />
          </div>
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
    minHeight: '40px',
    height: '40px',
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


