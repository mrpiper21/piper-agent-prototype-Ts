import {
  AiOutlineFile,
  AiOutlineCheckCircle,
  AiOutlineClockCircle,
  AiOutlineCloseCircle,
} from 'react-icons/ai';
import { StatCard } from './StatCard';
import { sharedStyles } from '../../../shared/clerkStyles';
import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface DashboardStats {
  todaysJobs: number;
  completedJobs: number;
  pendingJobs: number;
  failedJobs: number;
  totalJobs: number;
  totalRevenue?: number;
  pendingRevenue?: number;
  paidJobs?: number;
}

interface StatsGridProps {
  themeStyles: ThemeStyles;
  stats: DashboardStats;
  isLoading: boolean;
  isAdmin: boolean;
  selectedRevenueMonth: string;
  onRevenueMonthChange: (month: string) => void;
  getVagueRevenue: (amount: number) => string;
}

export function StatsGrid({
  themeStyles,
  stats,
  isLoading,
  isAdmin,
  selectedRevenueMonth,
  onRevenueMonthChange,
  getVagueRevenue,
}: StatsGridProps) {
  if (isLoading && !stats) {
    return (
      <div
        style={{
          ...sharedStyles.card,
          ...themeStyles.card,
          textAlign: 'center',
          padding: 'var(--spacing-md, 12px)',
          boxShadow: 'none',
        }}
      >
        <p style={{ color: themeStyles.textSecondary, fontSize: 'var(--font-size, 14px)' }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 'var(--spacing-sm, 8px)',
      }}
    >
      <StatCard
        icon={<AiOutlineFile />}
        title="Today's Jobs"
        value={stats.todaysJobs}
        color={themeStyles.accent}
        themeStyles={themeStyles}
        description="Active jobs today"
      />
      <StatCard
        icon={<AiOutlineCheckCircle />}
        title="Completed"
        value={stats.completedJobs}
        color={themeStyles.success}
        themeStyles={themeStyles}
        description="Successfully printed"
      />
      <StatCard
        icon={<AiOutlineClockCircle />}
        title="Pending"
        value={stats.pendingJobs}
        color={themeStyles.warning}
        themeStyles={themeStyles}
        description="Awaiting processing"
      />
      <StatCard
        icon={<AiOutlineCloseCircle />}
        title="Failed"
        value={stats.failedJobs}
        color={themeStyles.error}
        themeStyles={themeStyles}
        description="Unsuccessful jobs"
      />
      {stats.totalRevenue !== undefined && isAdmin && (
        <div
          style={{
            ...sharedStyles.card,
            ...themeStyles.card,
            padding: 'var(--spacing-sm, 8px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-xs, 4px)',
            minWidth: '180px',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              marginBottom: 'var(--spacing-xs, 4px)',
            }}
          >
            <input
              type="month"
              value={selectedRevenueMonth}
              onChange={(e) => onRevenueMonthChange(e.target.value)}
              style={{
                padding: '2px 6px',
                borderRadius: 'var(--border-radius-sm, 4px)',
                border: themeStyles.card.border,
                background: themeStyles.input.background,
                color: themeStyles.input.color,
                fontSize: '10px',
                cursor: 'pointer',
                height: '24px',
                maxWidth: '120px',
                marginBottom: '4px',
              }}
              title="Select month to view revenue"
            />
            <div>
              <span
                style={{
                  color: themeStyles.text,
                  fontSize: 'var(--font-size-small, 12px)',
                  fontWeight: '600',
                }}
              >
                Total Revenue
              </span>
            </div>
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-large, 16px)',
              fontWeight: '700',
              color: themeStyles.success,
            }}
          >
            {isAdmin ? `GHC ${(stats.totalRevenue || 0).toFixed(2)}` : getVagueRevenue(stats.totalRevenue || 0)}
          </div>
          {isAdmin && (
            <div
              style={{
                fontSize: 'var(--font-size-small, 12px)',
                color: themeStyles.textSecondary,
              }}
            >
              {new Date(selectedRevenueMonth + '-01').toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

