import type { lightStyles } from '../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface SidebarResizeHandleProps {
  themeStyles: ThemeStyles;
  isResizing: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

export function SidebarResizeHandle({
  themeStyles,
  isResizing,
  onMouseDown,
}: SidebarResizeHandleProps) {
  return (
    <div
      onMouseDown={onMouseDown}
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
  );
}


