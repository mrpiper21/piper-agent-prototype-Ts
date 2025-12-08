import { AiOutlineReload } from 'react-icons/ai';
import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface WhatsAppJobsHeaderProps {
  themeStyles: ThemeStyles;
  isRefetching: boolean;
  onRefresh: () => void;
}

export function WhatsAppJobsHeader({
  themeStyles,
  isRefetching,
  onRefresh,
}: WhatsAppJobsHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--spacing-sm, 8px)',
      }}
    >
      <h2
        style={{
          color: themeStyles.text,
          fontSize: 'var(--font-size-large, 18px)',
          fontWeight: '600',
          margin: 0,
        }}
      >
        WhatsApp Jobs
      </h2>
      <button
        onClick={onRefresh}
        disabled={isRefetching}
        style={{
          padding: '6px 12px',
          borderRadius: '4px',
          border: 'none',
          background: themeStyles.accent,
          color: '#000',
          cursor: isRefetching ? 'not-allowed' : 'pointer',
          fontSize: 'var(--font-size-small, 12px)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: isRefetching ? 0.6 : 1,
        }}
      >
        <AiOutlineReload
          style={{
            fontSize: '14px',
            animation: isRefetching ? 'spin 1s linear infinite' : 'none',
          }}
        />
        {isRefetching ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
}

