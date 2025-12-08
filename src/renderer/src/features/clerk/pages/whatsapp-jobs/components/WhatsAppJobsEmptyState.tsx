import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface WhatsAppJobsEmptyStateProps {
  themeStyles: ThemeStyles;
}

export function WhatsAppJobsEmptyState({ themeStyles }: WhatsAppJobsEmptyStateProps) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: themeStyles.container.background,
        color: themeStyles.textSecondary,
        padding: 'var(--spacing-xl, 24px)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: 'var(--font-size-large, 16px)',
            marginBottom: 'var(--spacing-sm, 8px)',
            fontWeight: '500',
          }}
        >
          Select a WhatsApp job to view details
        </p>
        <p style={{ fontSize: 'var(--font-size-small, 12px)' }}>
          Click on any job from the list to see its preview and details
        </p>
      </div>
    </div>
  );
}

