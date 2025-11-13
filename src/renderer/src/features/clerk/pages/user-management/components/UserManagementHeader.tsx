import React from 'react';
import { useTheme } from '../../../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../../../shared/clerkStyles';
import { AiOutlinePlus } from 'react-icons/ai';

interface UserManagementHeaderProps {
  onCreateClick: () => void;
  isCreating: boolean;
}

export default function UserManagementHeader({
  onCreateClick,
  isCreating,
}: UserManagementHeaderProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div
      style={{
        marginBottom: '32px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
      }}
    >
      <div>
        <h1
          style={{
            color: themeStyles.text,
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: '700',
            marginBottom: '8px',
          }}
        >
          User Management
        </h1>
        <p
          style={{
            color: themeStyles.textSecondary,
            fontSize: '14px',
          }}
        >
          Manage system users and their permissions
        </p>
      </div>
      {!isCreating && (
        <button
          onClick={onCreateClick}
          style={{
            ...sharedStyles.actionButton,
            ...themeStyles.primaryButton,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <AiOutlinePlus />
          Add New User
        </button>
      )}
    </div>
  );
}

