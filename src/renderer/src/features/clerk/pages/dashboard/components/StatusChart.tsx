import { sharedStyles } from '../../../shared/clerkStyles';
import { Bar } from './Bar';
import { LegendItem } from './LegendItem';
import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface StatusChartProps {
  themeStyles: ThemeStyles;
  chartData: {
    completed: number;
    pending: number;
    failed: number;
    max: number;
  };
}

export function StatusChart({ themeStyles, chartData }: StatusChartProps) {
  return (
    <div
      style={{
        ...sharedStyles.card,
        ...themeStyles.card,
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--spacing-md, 12px)',
        boxShadow: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs, 4px)',
          marginBottom: 'var(--spacing-sm, 8px)',
        }}
      >
        <h3
          style={{
            color: themeStyles.text,
            margin: 0,
            fontWeight: '600',
            fontSize: 'var(--font-size, 14px)',
          }}
        >
          Job Status
        </h3>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-sm, 8px)',
        }}
      >
        <Bar
          label="Completed"
          value={chartData.completed}
          max={chartData.max}
          color={themeStyles.success}
          themeStyles={themeStyles}
        />
        <Bar
          label="Pending"
          value={chartData.pending}
          max={chartData.max}
          color={themeStyles.warning}
          themeStyles={themeStyles}
        />
        <Bar
          label="Failed"
          value={chartData.failed}
          max={chartData.max}
          color={themeStyles.error}
          themeStyles={themeStyles}
        />
      </div>
      <div
        style={{
          marginTop: 'var(--spacing-sm, 8px)',
          display: 'flex',
          gap: 'var(--spacing-sm, 8px)',
          justifyContent: 'flex-start',
          flexWrap: 'wrap' as const,
          padding: 'var(--spacing-sm, 8px)',
          background: themeStyles.input.background,
          borderRadius: 'var(--border-radius-sm, 4px)',
        }}
      >
        <LegendItem color={themeStyles.success} label="Completed" themeStyles={themeStyles} />
        <LegendItem color={themeStyles.warning} label="Pending" themeStyles={themeStyles} />
        <LegendItem color={themeStyles.error} label="Failed" themeStyles={themeStyles} />
      </div>
    </div>
  );
}

