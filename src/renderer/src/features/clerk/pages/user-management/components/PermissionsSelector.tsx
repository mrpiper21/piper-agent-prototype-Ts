import React from 'react';
import { Permission } from '../../../shared/types';
import { useTheme } from '../../../../../context/ThemeContext';
import { lightStyles, darkStyles } from '../../../shared/clerkStyles';

interface PermissionsSelectorProps {
  permissions: string[];
  onPermissionToggle: (permission: string) => void;
}

const clerkPermissions = [
  { value: Permission.MANAGE_JOBS, label: 'Manage Jobs' },
  { value: Permission.SUBMIT_PRINTS, label: 'Submit Prints' },
  { value: Permission.VIEW_AGENTS, label: 'View Agents' },
  { value: Permission.VIEW_OWN_JOBS, label: 'View Own Jobs' },
];

export default function PermissionsSelector({
  permissions,
  onPermissionToggle,
}: PermissionsSelectorProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div>
      <label
        style={{
          color: themeStyles.text,
          display: 'block',
          marginBottom: '12px',
          fontWeight: '600',
          fontSize: '14px',
        }}
      >
        Permissions
      </label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          padding: '16px',
          background: themeStyles.input.background,
          borderRadius: '8px',
          border: `1px solid ${themeStyles.card.border}`,
        }}
      >
        {clerkPermissions.map((perm) => {
          const isChecked = permissions.includes(perm.value);
          return (
            <label
              key={perm.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                color: themeStyles.text,
                fontSize: '14px',
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onPermissionToggle(perm.value)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: themeStyles.accent,
                }}
              />
              <span>{perm.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

