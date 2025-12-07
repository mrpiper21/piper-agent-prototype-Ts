import { AiOutlineMoon, AiOutlineSun } from 'react-icons/ai';
import { HiOutlineLogout } from 'react-icons/hi';
import type { lightStyles } from '../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface MainHeaderProps {
  themeStyles: ThemeStyles;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  userName?: string;
  onLogout: () => void;
  spacing: number;
  fontSize: number;
  iconSize: number;
}

export function MainHeader({
  themeStyles,
  theme,
  toggleTheme,
  isSidebarCollapsed,
  onToggleSidebar,
  userName,
  onLogout,
  spacing,
  fontSize,
  iconSize,
}: MainHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: `0 var(--spacing-md, ${12 * spacing}px)`,
        minHeight: `${48 * spacing}px`,
        height: `${48 * spacing}px`,
        boxSizing: 'border-box' as const,
        borderBottom: themeStyles.sidebar.borderColor
          ? `1px solid ${themeStyles.sidebar.borderColor}`
          : themeStyles.header.borderBottom || '1px solid',
      }}
    >
      <div style={{ display: 'flex', gap: `${8 * spacing}px`, alignItems: 'center' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            padding: '6px',
            borderRadius: '4px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: '32px',
            minHeight: '32px',
            ...themeStyles.iconButton,
            fontSize: `${iconSize}px`,
          }}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? '→' : '←'}
        </button>
        <button
          onClick={toggleTheme}
          style={{
            padding: '6px',
            borderRadius: '4px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: '32px',
            minHeight: '32px',
            ...themeStyles.iconButton,
            fontSize: `${iconSize}px`,
          }}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <AiOutlineMoon /> : <AiOutlineSun />}
        </button>
        <span style={{ color: themeStyles.text, fontSize: `${fontSize}px` }}>
          {userName || 'Clerk'}
        </span>
        <button
          onClick={onLogout}
          style={{
            padding: `${6 * spacing}px ${12 * spacing}px`,
            borderRadius: '4px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            ...themeStyles.dangerButton,
            fontSize: `${fontSize}px`,
          }}
        >
          <HiOutlineLogout style={{ marginRight: `${4 * spacing}px`, fontSize: `${iconSize}px` }} />
          Logout
        </button>
      </div>
    </div>
  );
}


