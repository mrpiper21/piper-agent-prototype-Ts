import React from 'react';
import { useTheme } from '../../../../../context/ThemeContext';
import { lightStyles, darkStyles } from '../../../shared/clerkStyles';

export default function AccessDenied() {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div
      style={{
        padding: '24px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2
          style={{
            color: themeStyles.text,
            marginBottom: '12px',
          }}
        >
          Access Denied
        </h2>
        <p
          style={{
            color: themeStyles.textSecondary,
          }}
        >
          You do not have permission to access this page.
        </p>
      </div>
    </div>
  );
}

