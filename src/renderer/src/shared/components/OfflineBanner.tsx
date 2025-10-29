import { useState, useEffect } from 'react';
import './OfflineBanner.css';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-banner" role="alert" aria-live="assertive">
      <div className="offline-banner-content">
        <span className="offline-banner-icon">⚠️</span>
        <span className="offline-banner-text">You are currently offline. Some features may be unavailable.</span>
      </div>
    </div>
  );
}
