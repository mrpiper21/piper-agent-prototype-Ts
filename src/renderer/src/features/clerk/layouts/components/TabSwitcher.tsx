import { AiOutlineHome, AiOutlineFileText, AiOutlineMessage } from 'react-icons/ai';
import type { lightStyles } from '../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

export type TabType = 'home' | 'jobs' | 'whatsapp';

interface TabSwitcherProps {
  themeStyles: ThemeStyles;
  theme: 'light' | 'dark';
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingCount: number;
  whatsappJobsCount: number;
  spacing: number;
  iconSize: number;
}

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

export function TabSwitcher({
  themeStyles,
  theme,
  activeTab,
  onTabChange,
  pendingCount,
  whatsappJobsCount,
  spacing,
  iconSize,
}: TabSwitcherProps) {
  const tabButtonBaseStyle = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
    padding: `${8 * spacing}px`,
    minHeight: `${48 * spacing}px`,
  };

  const getTabStyle = (tab: TabType) => ({
    ...tabButtonBaseStyle,
    background:
      activeTab === tab
        ? theme === 'dark'
          ? 'rgba(251, 191, 36, 0.15)'
          : 'rgba(251, 191, 36, 0.1)'
        : 'transparent',
    color: activeTab === tab ? '#fbbf24' : themeStyles.textSecondary,
    borderBottom: activeTab === tab ? `2px solid #fbbf24` : '2px solid transparent',
    fontWeight: activeTab === tab ? '600' : '400',
  });

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, tab: TabType) => {
    if (activeTab !== tab) {
      e.currentTarget.style.background =
        theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>, tab: TabType) => {
    if (activeTab !== tab) {
      e.currentTarget.style.background = 'transparent';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column' as const,
        borderBottom: themeStyles.sidebar.borderColor
          ? `1px solid ${themeStyles.sidebar.borderColor}`
          : '1px solid',
        minHeight: `${48 * spacing}px`,
        height: `${48 * spacing}px`,
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
        }}
      >
        <button
          onClick={() => onTabChange('home')}
          onMouseEnter={(e) => handleMouseEnter(e, 'home')}
          onMouseLeave={(e) => handleMouseLeave(e, 'home')}
          style={getTabStyle('home')}
          title="Home"
        >
          <AiOutlineHome style={{ fontSize: `${iconSize}px` }} />
        </button>
        <button
          onClick={() => onTabChange('jobs')}
          onMouseEnter={(e) => handleMouseEnter(e, 'jobs')}
          onMouseLeave={(e) => handleMouseLeave(e, 'jobs')}
          style={getTabStyle('jobs')}
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
        <button
          onClick={() => onTabChange('whatsapp')}
          onMouseEnter={(e) => handleMouseEnter(e, 'whatsapp')}
          onMouseLeave={(e) => handleMouseLeave(e, 'whatsapp')}
          style={getTabStyle('whatsapp')}
          title="WhatsApp Jobs"
        >
          <AiOutlineMessage style={{ fontSize: `${iconSize}px` }} />
          {whatsappJobsCount > 0 && (
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
              {whatsappJobsCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}


