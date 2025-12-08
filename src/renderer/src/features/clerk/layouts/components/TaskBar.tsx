import { AiOutlineCheckCircle, AiOutlineClockCircle } from 'react-icons/ai';
import type { lightStyles } from '../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface TaskBarProps {
  themeStyles: ThemeStyles;
  onlinePrintersCount: number;
  totalPrintersCount: number;
  pendingCount: number;
  currentTime: Date;
}

export function TaskBar({
  themeStyles,
  onlinePrintersCount,
  totalPrintersCount,
  pendingCount,
  currentTime,
}: TaskBarProps) {
  return (
    <div
      style={{
        height: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 12px',
        borderTop: '1px solid',
        fontSize: '12px',
        flexShrink: 0,
        ...themeStyles.taskBar,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
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
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}


