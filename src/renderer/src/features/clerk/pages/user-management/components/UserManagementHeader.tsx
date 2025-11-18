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
        marginBottom: 'var(--spacing-md, 12px)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'var(--spacing-sm, 8px)',
      }}
    >
      <div>
        <h1
          style={{
            color: themeStyles.text,
            fontSize: 'var(--font-size-xl, 18px)',
            fontWeight: '600',
            marginBottom: 'var(--spacing-xs, 4px)',
          }}
        >
          User Management
        </h1>
        <p
          style={{
            color: themeStyles.textSecondary,
            fontSize: 'var(--font-size-small, 12px)',
          }}
        >
          Manage system users and their permissions
        </p>
      </div>
      {!isCreating && (
        <button
          onClick={onCreateClick}
          style={{
            padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
            borderRadius: 'var(--border-radius-sm, 4px)',
            border: 'none',
            background: themeStyles.primaryButton.background,
            color: themeStyles.primaryButton.color,
            fontSize: 'var(--font-size-small, 12px)',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs, 4px)',
            whiteSpace: 'nowrap',
          }}
        >
          <AiOutlinePlus style={{ fontSize: 'var(--icon-size-sm, 14px)' }} />
          Add New User
        </button>
      )}
    </div>
  );
}

