import React, { useMemo, useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../auth/store/authStore';
import { useTheme } from '../../../context/ThemeContext';
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
} from 'react-icons/ai';
import { HiOutlineLogout } from 'react-icons/hi';
import { lightStyles, darkStyles } from '../shared/clerkStyles';
import { FaUserTie } from 'react-icons/fa';

export default function ClerkLayout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

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

  return (
    <div style={styles.wrapper}>
      <div style={styles.mainContainer}>
        {/* Sidebar */}
        <div style={{ ...styles.sidebar, ...themeStyles.sidebar }}>
        <div style={{ ...styles.sidebarHeader, ...themeStyles.sidebarHeader }}>
          <h2
            style={{
              color: '#fbbf24',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '700',
              fontSize: '18px',
              lineHeight: '24px',
            }}
          >
            <AiOutlinePrinter /> Print Station
          </h2>
        </div>
        <nav style={styles.nav}>
          <NavLink
            to="/clerk/dashboard"
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? themeStyles.activeNav : {}),
              color: isActive ? '#000000' : themeStyles.text,
              fontWeight: isActive ? '700' : '500',
            })}
          >
            <AiOutlineDashboard style={{ marginRight: '8px' }} />
            Dashboard
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
            <AiOutlineFileAdd style={{ marginRight: '8px' }} />
            Print Jobs
            {pendingCount > 0 && <span style={badgeStyles}>{pendingCount}</span>}
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
            <AiOutlineFileAdd style={{ marginRight: '8px' }} />
            Submit Print
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
            <AiOutlinePrinter style={{ marginRight: '8px' }} />
            Printer Status
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
            <FaUserTie style={{ marginRight: '8px' }} />
            Profile
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
              <AiOutlineUser style={{ marginRight: '8px' }} />
              User Management
            </NavLink>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Header */}
        <div style={{ ...styles.header, ...themeStyles.header }}>
          <div style={styles.userInfo}>
            <button
              onClick={toggleTheme}
              style={{ ...styles.iconButton, ...themeStyles.iconButton }}
            >
              {theme === 'light' ? <AiOutlineMoon /> : <AiOutlineSun />}
            </button>
            <span style={{ color: themeStyles.text }}>{user?.name || 'Clerk'}</span>
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
        <div style={styles.content} key={theme}>
          <Outlet />
        </div>
      </div>
      </div>

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
    width: '250px',
    minWidth: '200px',
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
    minHeight: '48px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '10px',
    gap: '5px',
  },
  navItem: {
    padding: '8px 10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: '14px',
    background: 'transparent',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    fontWeight: '500',
    textDecoration: 'none',
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
  },
  userInfo: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  iconButton: {
    padding: '8px',
    borderRadius: '6px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '20px',
    transition: 'all 0.2s ease',
  },
  logoutButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  content: {
    flex: 1,
    padding: '16px',
    overflow: 'auto',
    overflowX: 'hidden' as const,
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


