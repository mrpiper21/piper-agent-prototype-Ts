import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../../../shared/clerkStyles';
import {
  AiOutlineMail,
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlineSave,
  AiOutlineClose,
  AiOutlineCalendar,
  AiOutlineMore,
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleChange = (field: keyof UserFormData, value: string | 'admin' | 'clerk') => {
    onFormDataChange({ [field]: value });
  };

  const handleEditClick = () => {
    setIsDropdownOpen(false);
    onStartEdit();
  };

  const handleDeleteClick = () => {
    setIsDropdownOpen(false);
    onDelete();
  };

  return (
    <div
      style={{
        ...sharedStyles.card,
        ...themeStyles.card,
        padding: 'var(--spacing-md, 12px)',
        border: themeStyles.card.border,
        transition: 'background 0.15s ease',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm, 8px)',
        boxShadow: 'none',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = theme === 'dark' 
          ? 'rgba(255, 255, 255, 0.03)' 
          : 'rgba(0, 0, 0, 0.02)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = themeStyles.card.background;
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
          {/* Header with 3-dot menu */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 'var(--spacing-sm, 8px)',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                flex: 1,
              }}
            >
              <h3
                style={{
                  color: themeStyles.text,
                  fontSize: 'var(--font-size-large, 16px)',
                  fontWeight: '600',
                  margin: 0,
                }}
              >
                {user.name || 'Unknown User'}
              </h3>
              <span
                style={{
                  padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
                  borderRadius: 'var(--border-radius-sm, 4px)',
                  fontSize: 'var(--font-size-small, 12px)',
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
            {/* 3-dot action button */}
            <button
              ref={buttonRef}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                padding: 'var(--spacing-xs, 4px)',
                border: 'none',
                borderRadius: 'var(--border-radius-sm, 4px)',
                background: 'transparent',
                color: themeStyles.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = themeStyles.button.background;
                e.currentTarget.style.color = themeStyles.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = themeStyles.textSecondary;
              }}
              aria-label="More options"
            >
              <AiOutlineMore style={{ fontSize: 'var(--icon-size, 16px)' }} />
            </button>
            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div
                ref={dropdownRef}
                style={{
                  position: 'absolute',
                  top: '32px',
                  right: 0,
                  background: themeStyles.card.background,
                  border: themeStyles.card.border,
                  borderRadius: 'var(--border-radius-md, 6px)',
                  boxShadow: theme === 'dark'
                    ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 4px 12px rgba(0, 0, 0, 0.15)',
                  minWidth: '140px',
                  zIndex: 1000,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={handleEditClick}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
                    border: 'none',
                    background: 'transparent',
                    color: themeStyles.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm, 8px)',
                    fontSize: 'var(--font-size, 14px)',
                    transition: 'background 0.15s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme === 'dark'
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <AiOutlineEdit style={{ fontSize: 'var(--icon-size, 16px)' }} />
                  Edit
                </button>
                {user.id !== currentUserId && (
                  <button
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
                      border: 'none',
                      background: 'transparent',
                      color: themeStyles.error || '#ef4444',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm, 8px)',
                      fontSize: 'var(--font-size, 14px)',
                      transition: 'background 0.15s ease',
                      textAlign: 'left',
                      opacity: isDeleting ? 0.6 : 1,
                      borderTop: themeStyles.card.border,
                    }}
                    onMouseEnter={(e) => {
                      if (!isDeleting) {
                        e.currentTarget.style.background = theme === 'dark'
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'rgba(239, 68, 68, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <AiOutlineDelete style={{ fontSize: 'var(--icon-size, 16px)' }} />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
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
        </>
      )}
    </div>
  );
}

