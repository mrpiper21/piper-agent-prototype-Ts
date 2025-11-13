import React from 'react';
import { useTheme } from '../../../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../../../shared/clerkStyles';
import {
  AiOutlineMail,
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlineSave,
  AiOutlineClose,
  AiOutlineCalendar,
} from 'react-icons/ai';
import { FaMapMarkerAlt } from 'react-icons/fa';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'clerk';
  permissions?: string[];
  location?: {
    address: string;
  };
  createdAt?: number;
}

interface UserFormData {
  name: string;
  email: string;
  role: 'admin' | 'clerk';
}

interface UserCardProps {
  user: User;
  currentUserId?: string;
  isEditing: boolean;
  formData: UserFormData;
  onFormDataChange: (data: Partial<UserFormData>) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
  formatDate: (timestamp: number) => string;
}

export default function UserCard({
  user,
  currentUserId,
  isEditing,
  formData,
  onFormDataChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  formatDate,
}: UserCardProps) {
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
        padding: '20px',
        border: `1px solid ${themeStyles.card.border}`,
        transition: 'all 0.2s ease',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow =
          theme === 'dark'
            ? '0 6px 24px rgba(0, 0, 0, 0.5)'
            : '0 4px 16px rgba(0, 0, 0, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {isEditing ? (
        <form onSubmit={onSave}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div>
              <label
                style={{
                  color: themeStyles.text,
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                style={{
                  ...sharedStyles.input,
                  ...themeStyles.input,
                  width: '100%',
                  padding: '12px',
                }}
                required
              />
            </div>
            <div>
              <label
                style={{
                  color: themeStyles.text,
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                style={{
                  ...sharedStyles.input,
                  ...themeStyles.input,
                  width: '100%',
                  padding: '12px',
                }}
                required
              />
            </div>
            <div>
              <label
                style={{
                  color: themeStyles.text,
                  display: 'block',
                  marginBottom: '8px',
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
                  padding: '12px',
                }}
              >
                <option value="clerk">Clerk</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                ...sharedStyles.actionButton,
                ...themeStyles.primaryButton,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                padding: '10px 16px',
                flex: 1,
                justifyContent: 'center',
              }}
            >
              <AiOutlineSave />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              style={{
                ...sharedStyles.actionButton,
                ...themeStyles.button,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                padding: '10px 16px',
                flex: 1,
                justifyContent: 'center',
              }}
            >
              <AiOutlineClose />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                flexWrap: 'wrap',
              }}
            >
              <h3
                style={{
                  color: themeStyles.text,
                  fontSize: '18px',
                  fontWeight: '700',
                  margin: 0,
                }}
              >
                {user.name || 'Unknown User'}
              </h3>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background:
                    user.role === 'admin'
                      ? `${themeStyles.accent}20`
                      : `${themeStyles.textSecondary}20`,
                  color:
                    user.role === 'admin' ? themeStyles.accent : themeStyles.textSecondary,
                }}
              >
                {user.role === 'admin' ? 'Admin' : 'Clerk'}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                color: themeStyles.textSecondary,
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AiOutlineMail style={{ fontSize: '14px' }} />
                {user.email || 'N/A'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AiOutlineCalendar style={{ fontSize: '14px' }} />
                Joined {formatDate(user.createdAt || 0)}
              </span>
              {user.location?.address && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaMapMarkerAlt style={{ fontSize: '14px' }} />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.location.address.length > 40
                      ? user.location.address.substring(0, 40) + '...'
                      : user.location.address}
                  </span>
                </span>
              )}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              paddingTop: '16px',
              borderTop: `1px solid ${themeStyles.card.border}`,
            }}
          >
            <button
              onClick={onStartEdit}
              style={{
                ...sharedStyles.actionButton,
                ...themeStyles.button,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                padding: '10px 16px',
                flex: 1,
                justifyContent: 'center',
              }}
            >
              <AiOutlineEdit />
              Edit
            </button>
            {user.id !== currentUserId && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                style={{
                  ...sharedStyles.actionButton,
                  ...themeStyles.dangerButton,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  padding: '10px 16px',
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                <AiOutlineDelete />
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

