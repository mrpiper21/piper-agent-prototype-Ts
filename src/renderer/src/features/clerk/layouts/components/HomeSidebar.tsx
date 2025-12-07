import { NavLink } from 'react-router-dom';
import {
  AiOutlineDashboard,
  AiOutlineFileAdd,
  AiOutlineSetting,
  AiOutlineUser,
  AiOutlineAppstore,
} from 'react-icons/ai';
import { FaUserTie } from 'react-icons/fa';
import type { lightStyles } from '../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface HomeSidebarProps {
  themeStyles: ThemeStyles;
  isSidebarCollapsed: boolean;
  spacing: number;
  iconSize: number;
  userRole?: string;
}

export function HomeSidebar({
  themeStyles,
  isSidebarCollapsed,
  spacing,
  iconSize,
  userRole,
}: HomeSidebarProps) {
  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column' as const,
        padding: `${10 * spacing}px`,
        gap: `${5 * spacing}px`,
        flex: 1,
        overflowY: 'auto',
      }}
    >
      <NavLink
        to="/clerk/dashboard"
        style={({ isActive }) => ({
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
          textDecoration: 'none',
          position: 'relative' as const,
          ...(isActive ? themeStyles.activeNav : {}),
          color: isActive ? '#000000' : themeStyles.text,
          fontWeight: isActive ? '700' : '500',
        })}
      >
        <AiOutlineDashboard style={{ marginRight: `${8 * spacing}px`, fontSize: `${iconSize}px` }} />
        {!isSidebarCollapsed && 'Dashboard'}
      </NavLink>
      <NavLink
        to="/clerk/submit"
        style={({ isActive }) => ({
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
          textDecoration: 'none',
          position: 'relative' as const,
          ...(isActive ? themeStyles.activeNav : {}),
          color: isActive ? '#000000' : themeStyles.text,
          fontWeight: isActive ? '700' : '500',
        })}
      >
        <AiOutlineFileAdd style={{ marginRight: `${8 * spacing}px`, fontSize: `${iconSize}px` }} />
        {!isSidebarCollapsed && 'Submit Print'}
      </NavLink>
      <NavLink
        to="/clerk/profile"
        style={({ isActive }) => ({
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
          textDecoration: 'none',
          position: 'relative' as const,
          ...(isActive ? themeStyles.activeNav : {}),
          color: isActive ? '#000000' : themeStyles.text,
          fontWeight: isActive ? '700' : '500',
        })}
      >
        <FaUserTie style={{ marginRight: `${8 * spacing}px`, fontSize: `${iconSize}px` }} />
        {!isSidebarCollapsed && 'Profile'}
      </NavLink>
      <NavLink
        to="/clerk/settings"
        style={({ isActive }) => ({
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
          textDecoration: 'none',
          position: 'relative' as const,
          ...(isActive ? themeStyles.activeNav : {}),
          color: isActive ? '#000000' : themeStyles.text,
          fontWeight: isActive ? '700' : '500',
        })}
      >
        <AiOutlineSetting style={{ marginRight: `${8 * spacing}px`, fontSize: `${iconSize}px` }} />
        {!isSidebarCollapsed && 'Settings'}
      </NavLink>
      {userRole === 'admin' && (
        <>
          <NavLink
            to="/clerk/user-management"
            style={({ isActive }) => ({
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
              textDecoration: 'none',
              position: 'relative' as const,
              ...(isActive ? themeStyles.activeNav : {}),
              color: isActive ? '#000000' : themeStyles.text,
              fontWeight: isActive ? '700' : '500',
            })}
          >
            <AiOutlineUser style={{ marginRight: `${8 * spacing}px`, fontSize: `${iconSize}px` }} />
            {!isSidebarCollapsed && 'User Management'}
          </NavLink>
          <NavLink
            to="/clerk/services"
            style={({ isActive }) => ({
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
              textDecoration: 'none',
              position: 'relative' as const,
              ...(isActive ? themeStyles.activeNav : {}),
              color: isActive ? '#000000' : themeStyles.text,
              fontWeight: isActive ? '700' : '500',
            })}
          >
            <AiOutlineAppstore style={{ marginRight: `${8 * spacing}px`, fontSize: `${iconSize}px` }} />
            {!isSidebarCollapsed && 'Services'}
          </NavLink>
        </>
      )}
    </nav>
  );
}


