import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AiOutlineWifi, AiOutlineReload, AiOutlineCloudServer } from 'react-icons/ai';

interface ConnectivityIssueProps {
  /** Optional custom message */
  message?: string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Custom styling */
  style?: React.CSSProperties;
}

export function ConnectivityIssue({
  message,
  onRetry,
  showRetry = true,
  compact = false,
  style,
}: ConnectivityIssueProps) {
  const { theme } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    if (onRetry) {
      setIsRetrying(true);
      try {
        await onRetry();
      } finally {
        setIsRetrying(false);
      }
    } else {
      // Default retry: check connection
      setIsRetrying(true);
      try {
        await fetch('/', { method: 'HEAD', cache: 'no-cache' });
        setIsOnline(true);
      } catch {
        // Still offline
      } finally {
        setIsRetrying(false);
      }
    }
  };

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const defaultMessage = isOnline
    ? 'Unable to connect to the server. Please check your connection and try again.'
    : 'No internet connection. Please check your network settings.';

  if (compact) {
    return (
      <div
        style={{
          ...styles.compactContainer,
          ...themeStyles.compactContainer,
          ...style,
        }}
      >
        <div style={styles.compactContent}>
          <AiOutlineWifi
            size={16}
            style={{
              color: themeStyles.iconColor,
              flexShrink: 0,
            }}
          />
          <span style={{ ...styles.compactText, color: themeStyles.textSecondary }}>
            {message || defaultMessage}
          </span>
          {showRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              style={{
                ...styles.compactButton,
                ...themeStyles.compactButton,
                opacity: isRetrying ? 0.6 : 1,
                cursor: isRetrying ? 'not-allowed' : 'pointer',
              }}
              title="Retry connection"
            >
              <AiOutlineReload
                size={14}
                style={{
                  animation: isRetrying ? 'spin 1s linear infinite' : 'none',
                }}
              />
            </button>
          )}
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.container,
        ...themeStyles.container,
        ...style,
      }}
    >
      <div style={styles.content}>
        <div style={styles.iconContainer}>
          <div style={{ ...styles.iconCircle, ...themeStyles.iconCircle }}>
            {isOnline ? (
              <AiOutlineCloudServer size={48} style={{ color: themeStyles.iconColor }} />
            ) : (
              <AiOutlineWifi size={48} style={{ color: themeStyles.iconColor }} />
            )}
          </div>
        </div>

        <h3 style={{ ...styles.title, color: themeStyles.text }}>
          {isOnline ? 'Connection Issue' : 'You\'re Offline'}
        </h3>

        <p style={{ ...styles.message, color: themeStyles.textSecondary }}>
          {message || defaultMessage}
        </p>

        {showRetry && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            style={{
              ...styles.button,
              ...themeStyles.button,
              opacity: isRetrying ? 0.6 : 1,
              cursor: isRetrying ? 'not-allowed' : 'pointer',
            }}
          >
            <AiOutlineReload
              size={18}
              style={{
                animation: isRetrying ? 'spin 1s linear infinite' : 'none',
                marginRight: '8px',
              }}
            />
            {isRetrying ? 'Retrying...' : 'Retry Connection'}
          </button>
        )}

        {isOnline && !isRetrying && (
          <p style={{ ...styles.hint, color: themeStyles.textSecondary }}>
            You may be viewing cached data. New updates will appear when connection is restored.
          </p>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-xl, 24px)',
    minHeight: '200px',
    width: '100%',
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    maxWidth: '500px',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 'var(--spacing-md, 12px)',
  },
  iconCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 var(--spacing-sm, 8px) 0',
  },
  message: {
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 var(--spacing-md, 12px) 0',
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'var(--spacing-sm, 8px)',
  },
  hint: {
    fontSize: '12px',
    marginTop: 'var(--spacing-md, 12px)',
    fontStyle: 'italic',
  },
  // Compact styles
  compactContainer: {
    padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
    borderRadius: '6px',
    width: '100%',
  },
  compactContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm, 8px)',
  },
  compactText: {
    fontSize: '13px',
    flex: 1,
  },
  compactButton: {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    transition: 'all 0.2s ease',
  },
};

const lightStyles = {
  container: {
    backgroundColor: 'transparent',
  },
  text: '#000000',
  textSecondary: '#6b7280',
  iconColor: '#f59e0b',
  iconCircle: {
    backgroundColor: '#fef3c7',
  },
  button: {
    backgroundColor: '#fbbf24',
    color: '#000000',
  },
  compactContainer: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fde68a',
  },
  compactButton: {
    color: '#92400e',
  },
};

const darkStyles = {
  container: {
    backgroundColor: 'transparent',
  },
  text: '#f5f5f5',
  textSecondary: '#9ca3af',
  iconColor: '#fbbf24',
  iconCircle: {
    backgroundColor: '#451a03',
  },
  button: {
    backgroundColor: '#fbbf24',
    color: '#000000',
  },
  compactContainer: {
    backgroundColor: '#451a03',
    border: '1px solid #78350f',
  },
  compactButton: {
    color: '#fbbf24',
  },
};

