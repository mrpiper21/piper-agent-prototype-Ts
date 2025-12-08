import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { electronAPI } from '../../lib';
import { AiOutlineClose, AiOutlineMessage, AiOutlineCheckCircle, AiOutlineWarning } from 'react-icons/ai';
import type { WhatsAppStatus } from '@shared/types/ipc.types';

interface WhatsAppConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  onSkip: () => void;
}

export function WhatsAppConnectionModal({ isOpen, onClose, onConnect, onSkip }: WhatsAppConnectionModalProps) {
  const { theme } = useTheme();
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkWhatsAppStatus();
    }
  }, [isOpen]);

  const checkWhatsAppStatus = async () => {
    try {
      if (!electronAPI.whatsapp) {
        console.error('WhatsApp API not available');
        return;
      }
      const currentStatus = await electronAPI.whatsapp.getStatus();
      setStatus(currentStatus);
      
      if (currentStatus.isAuthenticated) {
        // Already connected, close modal
        onClose();
      } else if (currentStatus.qrCode) {
        setQrCode(currentStatus.qrCode);
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
    }
  };

  const handleConnect = async () => {
    setIsInitializing(true);
    try {
      if (!electronAPI.whatsapp) {
        console.error('WhatsApp API not available');
        setIsInitializing(false);
        return;
      }
      const newStatus = await electronAPI.whatsapp.initialize();
      setStatus(newStatus);
      
      if (newStatus.qrCode) {
        setQrCode(newStatus.qrCode);
      }
      
      // Poll for connection status
      const pollInterval = setInterval(async () => {
        if (!electronAPI.whatsapp) {
          clearInterval(pollInterval);
          setIsInitializing(false);
          return;
        }
        try {
          const currentStatus = await electronAPI.whatsapp.getStatus();
          setStatus(currentStatus);
          
          if (currentStatus.isAuthenticated) {
            clearInterval(pollInterval);
            setIsInitializing(false);
            onConnect();
          } else if (currentStatus.qrCode && !qrCode) {
            setQrCode(currentStatus.qrCode);
          }
        } catch (error) {
          console.error('Error polling WhatsApp status:', error);
        }
      }, 2000);
      
      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsInitializing(false);
      }, 300000);
    } catch (error) {
      console.error('Error initializing WhatsApp:', error);
      setIsInitializing(false);
    }
  };

  if (!isOpen) return null;

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const isConnected = status?.isAuthenticated || false;
  const hasQrCode = !!qrCode || !!status?.qrCode;

  return (
    <div style={{ ...styles.overlay, ...themeStyles.overlay }} onClick={onClose}>
      <div
        style={{ ...styles.modal, ...themeStyles.modal }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ ...styles.header, ...themeStyles.header }}>
          <div style={styles.headerLeft}>
            <AiOutlineMessage style={{ marginRight: '8px', fontSize: '20px' }} />
            <h2 style={{ ...styles.title, ...themeStyles.title }}>Connect WhatsApp</h2>
          </div>
          <button
            onClick={onClose}
            style={{ ...styles.closeButton, ...themeStyles.closeButton }}
            aria-label="Close"
          >
            <AiOutlineClose />
          </button>
        </div>

        <div style={{ ...styles.content, ...themeStyles.content }}>
          {isConnected ? (
            <div style={styles.successContainer}>
              <AiOutlineCheckCircle style={{ fontSize: '48px', color: '#10b981', marginBottom: '16px' }} />
              <h3 style={{ ...styles.successTitle, ...themeStyles.text }}>WhatsApp Connected!</h3>
              <p style={{ ...styles.successText, ...themeStyles.textSecondary }}>
                Your WhatsApp account is successfully connected. You can now receive print jobs via WhatsApp.
              </p>
            </div>
          ) : (
            <>
              <div style={styles.infoSection}>
                <p style={{ ...styles.description, ...themeStyles.text }}>
                  Connect your WhatsApp account to receive print jobs directly from clients via WhatsApp messages.
                </p>
                <ul style={{ ...styles.benefitsList, ...themeStyles.textSecondary }}>
                  <li>Receive files and print requests via WhatsApp</li>
                  <li>Automatic job creation from WhatsApp messages</li>
                  <li>Real-time notifications for new orders</li>
                </ul>
              </div>

              {hasQrCode && (
                <div style={styles.qrSection}>
                  <p style={{ ...styles.qrTitle, ...themeStyles.text }}>
                    Scan this QR code with WhatsApp:
                  </p>
                  <div style={styles.qrContainer}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode || status?.qrCode || '')}`}
                      alt="WhatsApp QR Code"
                      style={styles.qrImage}
                    />
                  </div>
                  <p style={{ ...styles.qrHint, ...themeStyles.textSecondary }}>
                    1. Open WhatsApp on your phone<br />
                    2. Go to Settings → Linked Devices<br />
                    3. Tap "Link a Device"<br />
                    4. Scan this QR code
                  </p>
                </div>
              )}

              {status?.error && (
                <div style={styles.errorSection}>
                  <AiOutlineWarning style={{ color: '#ef4444', marginRight: '8px' }} />
                  <span style={{ color: '#ef4444' }}>{status.error}</span>
                </div>
              )}

              <div style={styles.buttonGroup}>
                {!hasQrCode && !isInitializing && (
                  <button
                    onClick={handleConnect}
                    style={{ ...styles.connectButton, ...themeStyles.connectButton }}
                  >
                    <AiOutlineMessage style={{ marginRight: '8px' }} />
                    Connect WhatsApp
                  </button>
                )}
                {isInitializing && !hasQrCode && (
                  <div style={styles.loadingText}>
                    Initializing WhatsApp connection...
                  </div>
                )}
                <button
                  onClick={onSkip}
                  style={{ ...styles.skipButton, ...themeStyles.skipButton }}
                >
                  Skip for Now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  modal: {
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    borderRadius: '4px',
    transition: 'background 0.2s ease',
  },
  content: {
    padding: '24px',
    overflowY: 'auto' as const,
    flex: 1,
  },
  infoSection: {
    marginBottom: '24px',
  },
  description: {
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  benefitsList: {
    fontSize: '14px',
    lineHeight: '1.8',
    paddingLeft: '20px',
    margin: 0,
  },
  qrSection: {
    textAlign: 'center' as const,
    marginBottom: '24px',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid',
  },
  qrTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  qrContainer: {
    display: 'inline-block',
    padding: '16px',
    background: '#ffffff',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  qrImage: {
    width: '250px',
    height: '250px',
    display: 'block',
  },
  qrHint: {
    fontSize: '12px',
    lineHeight: '1.6',
    textAlign: 'left' as const,
  },
  errorSection: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '6px',
    background: 'rgba(239, 68, 68, 0.1)',
    marginBottom: '16px',
    fontSize: '14px',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  connectButton: {
    padding: '12px 24px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  skipButton: {
    padding: '10px 24px',
    borderRadius: '6px',
    border: '1px solid',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  loadingText: {
    textAlign: 'center' as const,
    padding: '12px',
    fontSize: '14px',
    color: '#666',
  },
  successContainer: {
    textAlign: 'center' as const,
    padding: '20px',
  },
  successTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  successText: {
    fontSize: '14px',
    lineHeight: '1.6',
  },
};

const lightStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#ffffff',
    border: '1px solid #e1e1e1',
  },
  header: {
    borderBottomColor: '#e1e1e1',
  },
  title: {
    color: '#000000',
  },
  closeButton: {
    color: '#000000',
  },
  content: {
    color: '#000000',
  },
  text: {
    color: '#000000',
  },
  textSecondary: {
    color: '#666666',
  },
  connectButton: {
    backgroundColor: '#25D366',
    color: '#ffffff',
  },
  skipButton: {
    borderColor: '#e1e1e1',
    color: '#666666',
  },
  qrSection: {
    borderColor: '#e1e1e1',
    backgroundColor: '#f8f9fa',
  },
};

const darkStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modal: {
    backgroundColor: '#262626',
    border: '1px solid #404040',
  },
  header: {
    borderBottomColor: '#404040',
  },
  title: {
    color: '#f5f5f5',
  },
  closeButton: {
    color: '#f5f5f5',
  },
  content: {
    color: '#f5f5f5',
  },
  text: {
    color: '#f5f5f5',
  },
  textSecondary: {
    color: '#a0a0a0',
  },
  connectButton: {
    backgroundColor: '#25D366',
    color: '#ffffff',
  },
  skipButton: {
    borderColor: '#404040',
    color: '#a0a0a0',
  },
  qrSection: {
    borderColor: '#404040',
    backgroundColor: '#1a1a1a',
  },
};

