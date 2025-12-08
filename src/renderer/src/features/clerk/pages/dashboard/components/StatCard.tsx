import { useTheme } from '../../../../../context/ThemeContext';
import { sharedStyles } from '../../../shared/clerkStyles';
import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface StatCardProps {
  icon: React.ReactNode | string;
  title: string;
  value: number | string;
  color: string;
  themeStyles: ThemeStyles;
  description?: string;
}

export function StatCard({ icon, title, value, color, themeStyles, description }: StatCardProps) {
  const { theme } = useTheme();
  return (
    <div
      style={{
        ...sharedStyles.card,
        ...themeStyles.card,
        padding: 'var(--spacing-md, 12px)',
        boxShadow: 'none',
        transition: 'background 0.15s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e: any) => {
        e.currentTarget.style.background =
          theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.background = themeStyles.card.background;
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--spacing-sm, 8px)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--border-radius-sm, 4px)',
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--icon-size-lg, 20px)',
            color: color,
          }}
        >
          {icon}
        </div>
        <div
          style={{
            padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
            borderRadius: 'var(--border-radius-sm, 4px)',
            background: `${color}20`,
            color: color,
            fontSize: 'var(--font-size-small, 12px)',
            fontWeight: '600',
          }}
        >
          {value}
        </div>
      </div>
      <h4
        style={{
          color: themeStyles.text,
          fontSize: 'var(--font-size, 14px)',
          fontWeight: '600',
          marginBottom: 'var(--spacing-xs, 4px)',
          margin: 0,
        }}
      >
        {title}
      </h4>
      {description && (
        <p
          style={{
            color: themeStyles.textSecondary,
            fontSize: 'var(--font-size-small, 12px)',
            margin: 0,
            lineHeight: 'var(--line-height, 1.5)',
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

