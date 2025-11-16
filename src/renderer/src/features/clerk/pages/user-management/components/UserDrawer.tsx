import React, { useEffect } from 'react';
import { useTheme } from '../../../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../../../shared/clerkStyles';
import PermissionsSelector from './PermissionsSelector';
import { AiOutlineClose, AiOutlineSave, AiOutlineLock } from 'react-icons/ai';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'clerk';
  permissions: string[];
}

interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  formData: UserFormData;
  onFormDataChange: (data: Partial<UserFormData>) => void;
  onGeneratePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export default function UserDrawer({
  isOpen,
  onClose,
  formData,
  onFormDataChange,
  onGeneratePassword,
  onSubmit,
  isSubmitting,
}: UserDrawerProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease',
        }}
      />
      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '500px',
          background: themeStyles.card.background,
          borderLeft: `1px solid ${themeStyles.card.border}`,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: theme === 'dark' ? '-4px 0 20px rgba(0, 0, 0, 0.5)' : '-4px 0 20px rgba(0, 0, 0, 0.1)',
          animation: 'slideInRight 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${themeStyles.card.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              color: themeStyles.text,
              fontSize: '20px',
              fontWeight: '700',
              margin: 0,
            }}
          >
            Create New User
          </h2>
          <button
            onClick={onClose}
            style={{
              ...sharedStyles.actionButton,
              ...themeStyles.button,
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '36px',
              width: '36px',
              height: '36px',
              borderRadius: '6px',
            }}
          >
            <AiOutlineClose style={{ fontSize: '18px' }} />
          </button>
        </div>

        {/* Drawer Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          <form
            onSubmit={(e) => {
              onSubmit(e);
            }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
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
                    onChange={(e) => onFormDataChange({ name: e.target.value })}
                    style={{
                      ...sharedStyles.input,
                      ...themeStyles.input,
                      width: '90%',
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
                    onChange={(e) => onFormDataChange({ email: e.target.value })}
                    style={{
                      ...sharedStyles.input,
                      ...themeStyles.input,
                      width: '90%',
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
                    Temporary Password
                  </label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => onFormDataChange({ password: e.target.value })}
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
                    onChange={(e) => onFormDataChange({ role: e.target.value as 'admin' | 'clerk' })}
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
            </div>

            {/* Permissions Section */}
            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
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
            </div>

            {/* Note Section */}
            <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
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

              {/* Action Buttons */}
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
                  onClick={onClose}
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
            </div>
          </form>
        </div>
      </div>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
        `}
      </style>
    </>
  );
}

