import { AiOutlineThunderbolt } from 'react-icons/ai';
import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface DashboardHeaderProps {
  themeStyles: ThemeStyles;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onTodayClick: () => void;
}

export function DashboardHeader({
  themeStyles,
  selectedDate,
  onDateChange,
  onTodayClick,
}: DashboardHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--spacing-sm, 8px)',
      }}
    >
      <div>
        <h1
          style={{
            color: themeStyles.text,
            fontWeight: '600',
            fontSize: 'var(--font-size-large, 16px)',
            margin: 0,
            marginBottom: 'var(--spacing-xs, 4px)',
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            color: themeStyles.textSecondary,
            fontSize: 'var(--font-size-small, 12px)',
            margin: 0,
          }}
        >
          Print job overview
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs, 4px)',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={onTodayClick}
          style={{
            padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
            borderRadius: 'var(--border-radius-sm, 4px)',
            border: 'none',
            background: themeStyles.primaryButton.background,
            color: themeStyles.primaryButton.color,
            fontSize: 'var(--font-size-small, 12px)',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs, 4px)',
          }}
        >
          <AiOutlineThunderbolt style={{ fontSize: 'var(--icon-size-sm, 14px)' }} />
          Today
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          style={{
            padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
            borderRadius: 'var(--border-radius-sm, 4px)',
            border: themeStyles.card.border,
            background: themeStyles.input.background,
            color: themeStyles.input.color,
            fontSize: 'var(--font-size-small, 12px)',
            cursor: 'pointer',
            height: '32px',
          }}
        />
      </div>
    </div>
  );
}

