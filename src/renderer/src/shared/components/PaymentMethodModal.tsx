import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { lightStyles, darkStyles } from '../../features/clerk/shared/clerkStyles';
import { AiOutlineClose, AiOutlineMail, AiOutlinePhone } from 'react-icons/ai';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentMethodModal({ isOpen, onClose }: PaymentMethodModalProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: themeStyles.card.background,
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: themeStyles.card.border,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: themeStyles.warning + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <span style={{ fontSize: '24px' }}>💳</span>
            </div>
            <h2
              style={{
                color: themeStyles.text,
                fontSize: '20px',
                fontWeight: '700',
                margin: 0,
                marginBottom: '8px',
              }}
            >
              Payment Method Required
            </h2>
            <p
              style={{
                color: themeStyles.textSecondary,
                fontSize: '14px',
                margin: 0,
                lineHeight: '1.5',
              }}
            >
              To create categories and start accepting payments, you need to set up your payment method first.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: themeStyles.textSecondary,
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = themeStyles.card.background;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <AiOutlineClose size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            background: themeStyles.container.background,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              color: themeStyles.text,
              fontSize: '14px',
              margin: 0,
              marginBottom: '12px',
              lineHeight: '1.6',
            }}
          >
            Our support team will help you configure your payment settings so you can:
          </p>
          <ul
            style={{
              color: themeStyles.text,
              fontSize: '14px',
              margin: 0,
              paddingLeft: '20px',
              lineHeight: '1.8',
            }}
          >
            <li>Create and manage service categories</li>
            <li>Receive payments from customers</li>
            <li>Track your earnings</li>
          </ul>
        </div>

        {/* Contact Information */}
        <div
          style={{
            borderTop: themeStyles.card.border,
            paddingTop: '20px',
            marginTop: '20px',
          }}
        >
          <p
            style={{
              color: themeStyles.textSecondary,
              fontSize: '13px',
              margin: 0,
              marginBottom: '12px',
              fontWeight: '500',
            }}
          >
            Contact our support team:
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px',
                background: themeStyles.container.background,
                borderRadius: '6px',
              }}
            >
              <AiOutlineMail
                style={{
                  color: themeStyles.accent,
                  fontSize: '18px',
                  flexShrink: 0,
                }}
              />
              <div>
                <p
                  style={{
                    color: themeStyles.textSecondary,
                    fontSize: '12px',
                    margin: 0,
                    marginBottom: '2px',
                  }}
                >
                  Email
                </p>
                <p
                  style={{
                    color: themeStyles.text,
                    fontSize: '14px',
                    margin: 0,
                    fontWeight: '500',
                  }}
                >
                  benbaah@gmail.com
                </p>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px',
                background: themeStyles.container.background,
                borderRadius: '6px',
              }}
            >
              <AiOutlinePhone
                style={{
                  color: themeStyles.accent,
                  fontSize: '18px',
                  flexShrink: 0,
                }}
              />
              <div>
                <p
                  style={{
                    color: themeStyles.textSecondary,
                    fontSize: '12px',
                    margin: 0,
                    marginBottom: '2px',
                  }}
                >
                  Phone
                </p>
                <p
                  style={{
                    color: themeStyles.text,
                    fontSize: '14px',
                    margin: 0,
                    fontWeight: '500',
                  }}
                >
                  +233 24 545 2066
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '20px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: themeStyles.button.border,
              background: themeStyles.button.background,
              color: themeStyles.button.color,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            I'll Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}

