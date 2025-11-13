import React from 'react';
import { useTheme } from '../../../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../../../shared/clerkStyles';
import PermissionsSelector from './PermissionsSelector';
import {
  AiOutlinePlus,
  AiOutlineSave,
  AiOutlineClose,
  AiOutlineLock,
} from 'react-icons/ai';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'clerk';
  permissions: string[];
}

interface CreateUserFormProps {
  formData: UserFormData;
  onFormDataChange: (data: Partial<UserFormData>) => void;
  onGeneratePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function CreateUserForm({
  formData,
  onFormDataChange,
  onGeneratePassword,
  onSubmit,
  onCancel,
  isSubmitting,
}: CreateUserFormProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  const handleChange = (field: keyof UserFormData, value: string | 'admin' | 'clerk') => {
    onFormDataChange({ [field]: value });
  };

  return (
    <div
      style={{
        ...sharedStyles.card,
        ...themeStyles.card,
        marginBottom: '24px',
        width: '100%',
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '24px',
      }}
    >
      <h2
        style={{
          color: themeStyles.text,
          fontSize: 'clamp(18px, 2.5vw, 22px)',
          fontWeight: '700',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <AiOutlinePlus style={{ color: themeStyles.accent, fontSize: '20px' }} />
        Create New User
      </h2>
      <form onSubmit={onSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div>
            <label
              style={{
                color: themeStyles.text,
                display: 'block',
                marginBottom: '6px',
                fontWeight: '600',
                fontSize: '13px',
              }}
            >
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              style={{
                ...sharedStyles.input,
                ...themeStyles.input,
                width: '100%',
                padding: '10px 12px',
              }}
              required
            />
          </div>
          <div>
            <label
              style={{
                color: themeStyles.text,
                display: 'block',
                marginBottom: '6px',
                fontWeight: '600',
                fontSize: '13px',
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              style={{
                ...sharedStyles.input,
                ...themeStyles.input,
                width: '100%',
                padding: '10px 12px',
              }}
              required
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              style={{
                color: themeStyles.text,
                display: 'block',
                marginBottom: '6px',
                fontWeight: '600',
                fontSize: '13px',
              }}
            >
              Temporary Password
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Click Generate to create a temporary password"
                style={{
                  ...sharedStyles.input,
                  ...themeStyles.input,
                  flex: '1 1 200px',
                  minWidth: '200px',
                  padding: '10px 12px',
                }}
                required
              />
              <button
                type="button"
                onClick={onGeneratePassword}
                style={{
                  ...sharedStyles.actionButton,
                  ...themeStyles.button,
                  padding: '10px 20px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Generate
              </button>
            </div>
          </div>
          <div>
            <label
              style={{
                color: themeStyles.text,
                display: 'block',
                marginBottom: '6px',
                fontWeight: '600',
                fontSize: '13px',
              }}
            >
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value as 'admin' | 'clerk')}
              style={{
                ...sharedStyles.input,
                ...themeStyles.input,
                width: '100%',
                padding: '10px 12px',
              }}
            >
              <option value="clerk">Clerk</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <PermissionsSelector
          permissions={formData.permissions}
          onPermissionToggle={(permission) => {
            const currentPermissions = formData.permissions || [];
            const isSelected = currentPermissions.includes(permission);
            onFormDataChange({
              permissions: isSelected
                ? currentPermissions.filter((p) => p !== permission)
                : [...currentPermissions, permission],
            });
          }}
        />
        <div
          style={{
            padding: '14px 16px',
            background: `${themeStyles.accent}15`,
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px',
            color: themeStyles.textSecondary,
            lineHeight: '1.5',
          }}
        >
          <AiOutlineLock style={{ marginRight: '8px', verticalAlign: 'middle', fontSize: '14px' }} />
          Note: The temporary password will be returned after creation. Make sure to save it
          securely.
        </div>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...sharedStyles.actionButton,
              ...themeStyles.primaryButton,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              flex: '1 1 auto',
              minWidth: '120px',
              justifyContent: 'center',
            }}
          >
            <AiOutlineSave />
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              ...sharedStyles.actionButton,
              ...themeStyles.button,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              flex: '1 1 auto',
              minWidth: '120px',
              justifyContent: 'center',
            }}
          >
            <AiOutlineClose />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

