import React, { useState } from 'react';
import { electronAPI } from '../../../lib';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../shared/clerkStyles';

export default function StatusPage() {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const [printers, setPrinters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  React.useEffect(() => {
    loadPrinters();
    const interval = setInterval(loadPrinters, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadPrinters = async () => {
    try {
      setIsLoading(true);
      const printersData = await electronAPI.agent.getPrinters();
      setPrinters(printersData);
    } catch (error) {
      console.error('Failed to load printers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'online') return themeStyles.success;
    if (status === 'busy') return themeStyles.warning;
    return themeStyles.error;
  };

  return (
    <div style={{ ...sharedStyles.card, ...themeStyles.card }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#fbbf24', fontWeight: '700' }}>Available Printers</h2>
        <button
          onClick={loadPrinters}
          disabled={isLoading}
          style={{ ...sharedStyles.actionButton, ...themeStyles.primaryButton }}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      <div style={sharedStyles.printersList}>
        {printers.length === 0 ? (
          <p style={{ color: themeStyles.textSecondary }}>No printers available</p>
        ) : (
          printers.map((p, i) => (
            <div key={i} style={{ ...sharedStyles.printerCard, ...themeStyles.card }}>
              <div>
                <p style={{ color: themeStyles.text, fontWeight: 'bold' }}>
                  {p.displayName || p.printerName}
                </p>
                <p style={{ color: themeStyles.textSecondary, fontSize: '12px' }}>
                  {p.location || 'No location'} • {p.status}
                </p>
              </div>
              <span
                style={{
                  color: getStatusColor(p.status),
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '12px',
                }}
              >
                {p.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

