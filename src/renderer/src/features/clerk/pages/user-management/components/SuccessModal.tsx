import React, { useState } from 'react';
import { useTheme } from '../../../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../../../shared/clerkStyles';
import { AiOutlineCheckCircle, AiOutlineClose, AiOutlineCopy, AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  temporaryPassword: string;
}

export default function SuccessModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  temporaryPassword,
}: SuccessModalProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy password:', error);
    }
  };

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
          zIndex: 2000,
          animation: 'fadeIn 0.2s ease',
        }}
      />
      
      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '500px',
          background: themeStyles.card.background,
          borderRadius: '12px',
          boxShadow: theme === 'dark' ? '0 20px 60px rgba(0, 0, 0, 0.5)' : '0 20px 60px rgba(0, 0, 0, 0.15)',
          zIndex: 2001,
          animation: 'slideUp 0.3s ease',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: `1px solid ${themeStyles.card.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AiOutlineCheckCircle style={{ fontSize: '24px', color: '#ffffff' }} />
            </div>
            <div>
              <h2
                style={{
                  color: themeStyles.text,
                  fontSize: '20px',
                  fontWeight: '700',
                  margin: 0,
                  marginBottom: '4px',
                }}
              >
                User Created Successfully!
              </h2>
              <p
                style={{
                  color: themeStyles.textSecondary,
                  fontSize: '13px',
                  margin: 0,
                }}
              >
                The user account has been created
              </p>
            </div>
          </div>
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

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* User Info */}
          <div
            style={{
              marginBottom: '24px',
              padding: '16px',
              background: themeStyles.input.background,
              borderRadius: '8px',
              border: `1px solid ${themeStyles.card.border}`,
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  color: themeStyles.textSecondary,
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px',
                  display: 'block',
                }}
              >
                Full Name
              </label>
              <p
                style={{
                  color: themeStyles.text,
                  fontSize: '15px',
                  fontWeight: '500',
                  margin: 0,
                }}
              >
                {userName}
              </p>
            </div>
            <div>
              <label
                style={{
                  color: themeStyles.textSecondary,
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px',
                  display: 'block',
                }}
              >
                Email Address
              </label>
              <p
                style={{
                  color: themeStyles.text,
                  fontSize: '15px',
                  fontWeight: '500',
                  margin: 0,
                }}
              >
                {userEmail}
              </p>
            </div>
          </div>

          {/* Temporary Password Section */}
          <div
            style={{
              marginBottom: '24px',
              padding: '16px',
              background: `${themeStyles.accent}15`,
              borderRadius: '8px',
              border: `1px solid ${themeStyles.card.border}`,
            }}
          >
            <label
              style={{
                color: themeStyles.textSecondary,
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
                display: 'block',
              }}
            >
              Temporary Password
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: themeStyles.card.background,
                borderRadius: '6px',
                padding: '12px',
                border: `1px solid ${themeStyles.card.border}`,
              }}
            >
              <input
                type={isPasswordVisible ? 'text' : 'password'}
                value={temporaryPassword}
                readOnly
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: themeStyles.text,
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                style={{
                  ...sharedStyles.actionButton,
                  ...themeStyles.button,
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '32px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                }}
                title={isPasswordVisible ? 'Hide password' : 'Show password'}
              >
                {isPasswordVisible ? (
                  <AiOutlineEyeInvisible style={{ fontSize: '16px' }} />
                ) : (
                  <AiOutlineEye style={{ fontSize: '16px' }} />
                )}
              </button>
              <button
                type="button"
                onClick={handleCopyPassword}
                style={{
                  ...sharedStyles.actionButton,
                  ...themeStyles.button,
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  background: copied ? '#22c55e' : undefined,
                  color: copied ? '#ffffff' : undefined,
                }}
                title="Copy password"
              >
                <AiOutlineCopy style={{ fontSize: '16px' }} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p
              style={{
                color: themeStyles.textSecondary,
                fontSize: '12px',
                margin: '8px 0 0 0',
                fontStyle: 'italic',
              }}
            >
              ⚠️ Please save this password securely. It will not be shown again.
            </p>
          </div>

          {/* Info Note */}
          <div
            style={{
              padding: '12px 16px',
              background: themeStyles.input.background,
              borderRadius: '8px',
              border: `1px solid ${themeStyles.card.border}`,
              fontSize: '13px',
              color: themeStyles.textSecondary,
              lineHeight: '1.5',
            }}
          >
            <p style={{ margin: 0 }}>
              A welcome email with login instructions will be sent to <strong>{userEmail}</strong> by the backend.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px 24px',
            borderTop: `1px solid ${themeStyles.card.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            background: themeStyles.card.background,
          }}
        >
          <button
            onClick={onClose}
            style={{
              ...sharedStyles.actionButton,
              ...themeStyles.primaryButton,
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Done
          </button>
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
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translate(-50%, -40%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        `}
      </style>
    </>
  );
}

