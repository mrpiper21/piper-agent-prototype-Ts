// import { AiOutlineDollar } from 'react-icons/ai';
import { sharedStyles } from '../../../shared/clerkStyles';
import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface PaymentAnalyticsProps {
  themeStyles: ThemeStyles;
  paymentAnalytics: any;
  isAdmin: boolean;
  getVagueRevenue: (amount: number) => string;
}

export function PaymentAnalytics({
  themeStyles,
  paymentAnalytics,
  isAdmin,
  getVagueRevenue,
}: PaymentAnalyticsProps) {
  if (!paymentAnalytics || !isAdmin) {
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
        {/* <AiOutlineDollar style={{ fontSize: '20px', color: themeStyles.accent }} /> */}
        <h3
          style={{
            color: themeStyles.text,
            margin: 0,
            fontWeight: '600',
            fontSize: 'var(--font-size, 14px)',
          }}
        >
          Payment Overview (Last 30 Days)
        </h3>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--spacing-sm, 8px)',
          marginBottom: 'var(--spacing-md, 12px)',
        }}
      >
        <div
          style={{
            padding: 'var(--spacing-sm, 8px)',
            borderRadius: 'var(--border-radius-sm, 4px)',
            background: `${themeStyles.success}15`,
            border: `1px solid ${themeStyles.success}`,
          }}
        >
          <div style={{ fontSize: '12px', color: themeStyles.textSecondary }}>Paid</div>
            <div style={{ fontWeight: '600', color: themeStyles.text }}>
              {paymentAnalytics.paymentStats.paid.count} jobs
            </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: '700',
              color: themeStyles.success,
              marginTop: '4px',
            }}
          >
            {isAdmin ? (
              `GHC ${paymentAnalytics.paymentStats.paid.revenue.toFixed(2)}`
            ) : (
              getVagueRevenue(paymentAnalytics.paymentStats.paid.revenue)
            )}
          </div>
        </div>
        <div
          style={{
            padding: 'var(--spacing-sm, 8px)',
            borderRadius: 'var(--border-radius-sm, 4px)',
            background: `${themeStyles.warning}15`,
            border: `1px solid ${themeStyles.warning}`,
          }}
        >
          <div style={{ fontSize: '12px', color: themeStyles.textSecondary }}>Pending</div>
          <div style={{ fontWeight: '600', color: themeStyles.text }}>
            {paymentAnalytics.paymentStats.pending.count} jobs
          </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: '700',
              color: themeStyles.warning,
              marginTop: '4px',
            }}
          >
            {isAdmin ? (
              `GHC ${paymentAnalytics.paymentStats.pending.revenue.toFixed(2)}`
            ) : (
              getVagueRevenue(paymentAnalytics.paymentStats.pending.revenue)
            )}
          </div>
        </div>
        <div
          style={{
            padding: 'var(--spacing-sm, 8px)',
            borderRadius: 'var(--border-radius-sm, 4px)',
            background: `${themeStyles.error}15`,
            border: `1px solid ${themeStyles.error}`,
          }}
        >
          <div style={{ fontSize: '12px', color: themeStyles.textSecondary }}>Failed</div>
          <div style={{ fontWeight: '600', color: themeStyles.text }}>
            {paymentAnalytics.paymentStats.failed.count} jobs
          </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: '700',
              color: themeStyles.error,
              marginTop: '4px',
            }}
          >
            {isAdmin ? (
              `GHC ${paymentAnalytics.paymentStats.failed.revenue.toFixed(2)}`
            ) : (
              getVagueRevenue(paymentAnalytics.paymentStats.failed.revenue)
            )}
          </div>
        </div>
      </div>
      {isAdmin && (
        <div
          style={{
            padding: 'var(--spacing-sm, 8px)',
            borderRadius: 'var(--border-radius-sm, 4px)',
            background: themeStyles.input.background,
            border: `1px solid ${themeStyles.card.border}`,
          }}
        >
          <div
            style={{ fontSize: '12px', color: themeStyles.textSecondary, marginBottom: '4px' }}
          >
            Total Revenue (Last 7 Days)
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm, 8px)', flexWrap: 'wrap' }}>
            {paymentAnalytics.dailyRevenue.map((day: any) => (
              <div
                key={day.date}
                style={{
                  flex: 1,
                  minWidth: '80px',
                  padding: 'var(--spacing-xs, 4px)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '10px', color: themeStyles.textSecondary }}>
                  {new Date(day.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: themeStyles.text }}>
                  GHC {day.revenue.toFixed(2)}
                </div>
                <div style={{ fontSize: '10px', color: themeStyles.textSecondary }}>
                  {day.count} jobs
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

