import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AiOutlineWifi, AiOutlineReload } from 'react-icons/ai';
// import { useNavigate } from 'react-router-dom';

export function OfflinePage() {
  const { theme } = useTheme();
//   const navigate = useNavigate();
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

  const handleRetry = () => {
    setIsRetrying(true);
    // Check connection by attempting to fetch
    fetch('/', { method: 'HEAD', cache: 'no-cache' })
      .then(() => {
        setIsOnline(true);
        setIsRetrying(false);
        // Small delay to ensure state updates
        setTimeout(() => {
          window.location.reload();
        }, 500);
      })
      .catch(() => {
        setIsRetrying(false);
      });
  };

//   const handleGoHome = () => {
//     navigate('/');
//   };

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div style={{ ...styles.container, ...themeStyles.container }}>
      <div style={{ ...styles.card, ...themeStyles.card }}>
        <div style={styles.iconContainer}>
          <div style={{ ...styles.iconCircle, ...themeStyles.iconCircle }}>
            <AiOutlineWifi size={64} style={{ color: themeStyles.accent }} />
          </div>
        </div>

        <h1 style={{ ...styles.title, color: themeStyles.text }}>
          You're Offline
        </h1>

        <p style={{ ...styles.subtitle, color: themeStyles.textSecondary }}>
          It looks like you've lost your internet connection. Please check your network settings and try again.
        </p>

        <div style={styles.featuresList}>
          <div style={styles.featureItem}>
            <span style={styles.featureIcon}>❌</span>
            <span style={{ color: themeStyles.textSecondary }}>
              Cannot sync data with server
            </span>
          </div>
          <div style={styles.featureItem}>
            <span style={styles.featureIcon}>❌</span>
            <span style={{ color: themeStyles.textSecondary }}>
              Cannot submit new print jobs
            </span>
          </div>
          <div style={styles.featureItem}>
            <span style={styles.featureIcon}>❌</span>
            <span style={{ color: themeStyles.textSecondary }}>
              Cannot view real-time updates
            </span>
          </div>
          <div style={styles.featureItem}>
            <span style={styles.featureIcon}>✅</span>
            <span style={{ color: themeStyles.textSecondary }}>
              Can view cached data
            </span>
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            style={{
              ...styles.button,
              ...styles.primaryButton,
              ...themeStyles.primaryButton,
              opacity: isRetrying ? 0.6 : 1,
              cursor: isRetrying ? 'not-allowed' : 'pointer',
            }}
          >
            <AiOutlineReload 
              size={20} 
              style={{ 
                animation: isRetrying ? 'spin 1s linear infinite' : 'none',
                marginRight: '8px'
              }} 
            />
            {isRetrying ? 'Checking Connection...' : 'Retry Connection'}
          </button>
        </div>

        {isOnline && (
          <div style={styles.reconnectingMessage}>
            <span style={{ color: themeStyles.success }}>
              ✓ Connection restored! Refreshing...
            </span>
          </div>
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
    justifyContent: 'center',
    alignItems: 'center',
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: '20px',
    overflow: 'hidden',
    boxSizing: 'border-box' as const,
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    padding: '48px',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '600px',
    textAlign: 'center' as const,
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  iconCircle: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 16px 0',
  },
  subtitle: {
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 32px 0',
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '32px',
    textAlign: 'left' as const,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
  },
  featureIcon: {
    fontSize: '18px',
    width: '24px',
    textAlign: 'center' as const,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    width: '100%',
  },
  button: {
    padding: '14px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    marginBottom: '0',
  },
  reconnectingMessage: {
    marginTop: '20px',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
  },
};

const lightStyles = {
  container: {
    backgroundColor: '#ffffff',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  },
  text: '#000000',
  textSecondary: '#6b7280',
  accent: '#fbbf24',
  success: '#10b981',
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e1e1e1',
  },
  iconCircle: {
    backgroundColor: '#fef3c7',
  },
  button: {
    backgroundColor: '#ffffff',
  },
  primaryButton: {
    backgroundColor: '#fbbf24',
    color: '#000000',
  },
};

const darkStyles = {
  container: {
    backgroundColor: '#1a1a1a',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #262626 100%)',
  },
  text: '#f5f5f5',
  textSecondary: '#9ca3af',
  accent: '#fbbf24',
  success: '#34d399',
  card: {
    backgroundColor: '#262626',
    border: '1px solid #404040',
  },
  iconCircle: {
    backgroundColor: '#451a03',
  },
  button: {
    backgroundColor: '#333333',
    color: '#f5f5f5',
    border: '1px solid #404040',
  },
  primaryButton: {
    backgroundColor: '#fbbf24',
    color: '#000000',
  },
};

