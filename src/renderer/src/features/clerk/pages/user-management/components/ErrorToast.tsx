import React, { useEffect } from 'react';
import { useTheme } from '../../../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from '../../../shared/clerkStyles';
import { AiOutlineCloseCircle, AiOutlineClose } from 'react-icons/ai';

interface ErrorToastProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  duration?: number; // Auto-close duration in milliseconds
}

export default function ErrorToast({
  isOpen,
  onClose,
  message,
  duration = 5000,
}: ErrorToastProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  // Auto-close after duration
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '90%',
        maxWidth: '400px',
        background: themeStyles.card.background,
        borderRadius: '12px',
        boxShadow: theme === 'dark' 
          ? '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.2)' 
          : '0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(239, 68, 68, 0.2)',
        zIndex: 3000,
        animation: 'slideInRight 0.3s ease',
        overflow: 'hidden',
        border: `1px solid ${themeStyles.error || '#ef4444'}`,
      }}
    >
      {/* Content */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          background: theme === 'dark' 
            ? 'rgba(239, 68, 68, 0.1)' 
            : 'rgba(239, 68, 68, 0.05)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          <AiOutlineCloseCircle style={{ fontSize: '16px', color: '#ffffff' }} />
        </div>

        {/* Message */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: themeStyles.error || '#ef4444',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '4px',
            }}
          >
            Error Creating User
          </div>
          <div
            style={{
              color: themeStyles.text,
              fontSize: '13px',
              lineHeight: '1.5',
              wordBreak: 'break-word',
            }}
          >
            {message}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            ...sharedStyles.actionButton,
            ...themeStyles.button,
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '24px',
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            flexShrink: 0,
            marginTop: '2px',
          }}
          title="Close"
        >
          <AiOutlineClose style={{ fontSize: '14px' }} />
        </button>
      </div>

      {/* Progress Bar */}
      {duration > 0 && (
        <div
          style={{
            height: '3px',
            background: themeStyles.error || '#ef4444',
            animation: `shrink ${duration}ms linear forwards`,
            transformOrigin: 'left',
          }}
        />
      )}

      <style>
        {`
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes shrink {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}
      </style>
    </div>
  );
}

