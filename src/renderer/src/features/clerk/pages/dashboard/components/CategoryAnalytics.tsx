import { AiOutlinePieChart } from 'react-icons/ai';
import { sharedStyles } from '../../../shared/clerkStyles';
import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface CategoryAnalyticsProps {
  themeStyles: ThemeStyles;
  categoryAnalytics: any[] | undefined;
  isAdmin: boolean;
  getVagueRevenue: (amount: number) => string;
}

export function CategoryAnalytics({
  themeStyles,
  categoryAnalytics,
  isAdmin,
  getVagueRevenue,
}: CategoryAnalyticsProps) {
  if (!categoryAnalytics || categoryAnalytics.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        ...sharedStyles.card,
        ...themeStyles.card,
        padding: 'var(--spacing-md, 12px)',
        boxShadow: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs, 4px)',
          marginBottom: 'var(--spacing-md, 12px)',
        }}
      >
        <AiOutlinePieChart style={{ fontSize: '20px', color: themeStyles.accent }} />
        <h3
          style={{
            color: themeStyles.text,
            margin: 0,
            fontWeight: '600',
            fontSize: 'var(--font-size, 14px)',
          }}
        >
          Category Performance (Last 30 Days)
        </h3>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 'var(--spacing-sm, 8px)',
        }}
      >
        {categoryAnalytics.map((cat: any) => (
          <div
            key={cat.categoryId}
            style={{
              padding: 'var(--spacing-sm, 8px)',
              borderRadius: 'var(--border-radius-sm, 4px)',
              background: themeStyles.input.background,
              border: `1px solid ${themeStyles.card.border}`,
            }}
          >
            <div style={{ fontWeight: '600', color: themeStyles.text, marginBottom: '4px' }}>
              {cat.categoryName}
            </div>
            <div style={{ fontSize: '12px', color: themeStyles.textSecondary }}>
              <div>Jobs: {cat.totalJobs}</div>
              <div>Completed: {cat.completedJobs}</div>
              <div
                style={{ marginTop: '4px', fontWeight: '600', color: themeStyles.success }}
              >
                {isAdmin ? (
                  `Revenue: GHC ${cat.paidRevenue.toFixed(2)}`
                ) : (
                  `Performance: ${getVagueRevenue(cat.paidRevenue)}`
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

