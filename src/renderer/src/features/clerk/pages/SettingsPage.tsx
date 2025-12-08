import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useSettings, FontSize, UIScale } from '../../../context/SettingsContext';
import { electronAPI } from '../../../lib';
import { lightStyles, darkStyles } from '../shared/clerkStyles';
import { WhatsAppConnectionModal } from '../../../shared/components/WhatsAppConnectionModal';
import { ResetUIPreferencesModal } from '../../../shared/components/ResetUIPreferencesModal';
import {
  AiOutlineMessage,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineReload,
  AiOutlineAppstore,
  AiOutlinePrinter,
} from 'react-icons/ai';
import type { WhatsAppStatus } from '@shared/types/ipc.types';
import StatusPage from './StatusPage';

type SettingsTab = 'whatsapp' | 'ui' | 'printers';

export default function SettingsPage() {
  const { theme } = useTheme();
  const themeStyles = useMemo(() => (theme === 'dark' ? darkStyles : lightStyles), [theme]);
  const { settings, setFontSize, setUIScale, setLineHeight, getFontSize } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('whatsapp');
  const [localLineHeight, setLocalLineHeight] = useState(settings.lineHeight);
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const fontSize = getFontSize();

  useEffect(() => {
    checkWhatsAppStatus();
    const interval = setInterval(checkWhatsAppStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkWhatsAppStatus = async () => {
    try {
      setIsLoadingStatus(true);
      if (!electronAPI.whatsapp) {
        console.warn('WhatsApp API not available');
        return;
      }
      const status = await electronAPI.whatsapp.getStatus();
      setWhatsappStatus(status);
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleLineHeightChange = (value: number) => {
    setLocalLineHeight(value);
    setLineHeight(value);
  };

  const handleWhatsAppConnect = async () => {
    try {
      if (!electronAPI.whatsapp) {
        console.error('WhatsApp API not available');
        return;
      }
      await electronAPI.whatsapp.initialize();
      await checkWhatsAppStatus();
      setShowWhatsAppModal(false);
    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
    }
  };

  const handleWhatsAppDisconnect = async () => {
    try {
      if (!electronAPI.whatsapp) {
        console.error('WhatsApp API not available');
        return;
      }
      await electronAPI.whatsapp.disconnect();
      await checkWhatsAppStatus();
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
    }
  };

  const settingsTabs = [
    {
      id: 'whatsapp' as SettingsTab,
      label: 'WhatsApp',
      icon: AiOutlineMessage,
    },
    {
      id: 'printers' as SettingsTab,
      label: 'Printer Status',
      icon: AiOutlinePrinter,
    },
    {
      id: 'ui' as SettingsTab,
      label: 'UI Preferences',
      icon: AiOutlineAppstore,
    },
  ];

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        background: themeStyles.container.background,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '200px',
          minWidth: '200px',
          borderRight: themeStyles.card.border,
          background: themeStyles.sidebar.background,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '16px 12px',
            borderBottom: themeStyles.card.border,
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: themeStyles.text,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Settings
          </h2>
        </div>
        <div style={{ padding: '8px', flex: 1 }}>
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  marginBottom: '4px',
                  borderRadius: '4px',
                  border: 'none',
                  background: isActive
                    ? theme === 'dark'
                      ? 'rgba(251, 191, 36, 0.15)'
                      : 'rgba(251, 191, 36, 0.1)'
                    : 'transparent',
                  color: isActive ? '#fbbf24' : themeStyles.text,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isActive ? '500' : '400',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left' as const,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background =
                      theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon style={{ fontSize: '16px', flexShrink: 0 }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        {activeTab === 'whatsapp' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: themeStyles.text,
                  margin: '0 0 8px 0',
                }}
              >
                WhatsApp Integration
              </h1>
              <p
                style={{
                  fontSize: '13px',
                  color: themeStyles.textSecondary,
                  margin: 0,
                }}
              >
                Connect your WhatsApp account to receive print jobs via WhatsApp
              </p>
            </div>

            <div
              style={{
                ...themeStyles.card,
                padding: '16px',
                borderRadius: '6px',
                border: themeStyles.card.border,
              }}
            >
              {isLoadingStatus && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <AiOutlineReload
                    style={{
                      fontSize: '14px',
                      animation: 'spin 1s linear infinite',
                      color: themeStyles.textSecondary,
                    }}
                  />
                  <span style={{ fontSize: '12px', color: themeStyles.textSecondary }}>Checking status...</span>
                </div>
              )}

              {whatsappStatus?.isAuthenticated ? (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    <AiOutlineCheckCircle style={{ color: '#10b981', fontSize: '18px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: themeStyles.text,
                          margin: '0 0 4px 0',
                        }}
                      >
                        WhatsApp Connected
                      </p>
                      {whatsappStatus.phoneNumber && (
                        <p
                          style={{
                            fontSize: '12px',
                            color: themeStyles.textSecondary,
                            margin: 0,
                          }}
                        >
                          Phone: {whatsappStatus.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleWhatsAppDisconnect}
                    style={{
                      ...styles.button,
                      ...themeStyles.dangerButton,
                      fontSize: '13px',
                      padding: '8px 16px',
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    <AiOutlineCloseCircle style={{ color: '#ef4444', fontSize: '18px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: themeStyles.text,
                          margin: '0 0 4px 0',
                        }}
                      >
                        WhatsApp Not Connected
                      </p>
                      <p
                        style={{
                          fontSize: '12px',
                          color: themeStyles.textSecondary,
                          margin: 0,
                        }}
                      >
                        Click the button below to connect your WhatsApp account
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWhatsAppModal(true)}
                    style={{
                      ...styles.button,
                      ...themeStyles.accentButton,
                      fontSize: '13px',
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <AiOutlineMessage style={{ fontSize: '14px' }} />
                    Connect WhatsApp
                  </button>
                </div>
              )}

              {whatsappStatus?.error && (
                <div
                  style={{
                    ...themeStyles.errorBackground,
                    padding: '10px 12px',
                    borderRadius: '4px',
                    marginTop: '12px',
                  }}
                >
                  <p
                    style={{
                      ...themeStyles.errorText,
                      fontSize: '12px',
                      margin: 0,
                    }}
                  >
                    {whatsappStatus.error}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'printers' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: themeStyles.text,
                  margin: '0 0 8px 0',
                }}
              >
                Printer Status
              </h1>
              <p
                style={{
                  fontSize: '13px',
                  color: themeStyles.textSecondary,
                  margin: 0,
                }}
              >
                View and manage available printers
              </p>
            </div>
            <StatusPage />
          </div>
        )}

        {activeTab === 'ui' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: themeStyles.text,
                  margin: '0 0 8px 0',
                }}
              >
                UI Preferences
              </h1>
              <p
                style={{
                  fontSize: '13px',
                  color: themeStyles.textSecondary,
                  margin: 0,
                }}
              >
                Customize the appearance and layout of the application
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div
                style={{
                  ...themeStyles.card,
                  padding: '16px',
                  borderRadius: '6px',
                  border: themeStyles.card.border,
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: themeStyles.text,
                    marginBottom: '12px',
                  }}
                >
                  Font Size
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: themeStyles.card.border,
                        background:
                          settings.fontSize === size
                            ? themeStyles.accentButton.background
                            : themeStyles.button.background,
                        color:
                          settings.fontSize === size
                            ? themeStyles.accentButton.color
                            : themeStyles.text,
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    ...themeStyles.card,
                    padding: '10px 12px',
                    borderRadius: '4px',
                    border: themeStyles.card.border,
                    fontSize: `${fontSize}px`,
                    color: themeStyles.textSecondary,
                  }}
                >
                  Preview: The quick brown fox jumps over the lazy dog
                </div>
              </div>

              <div
                style={{
                  ...themeStyles.card,
                  padding: '16px',
                  borderRadius: '6px',
                  border: themeStyles.card.border,
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: themeStyles.text,
                    marginBottom: '12px',
                  }}
                >
                  UI Scale
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  {(['compact', 'comfortable', 'spacious'] as UIScale[]).map((scale) => (
                    <button
                      key={scale}
                      onClick={() => setUIScale(scale)}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: themeStyles.card.border,
                        background:
                          settings.uiScale === scale
                            ? themeStyles.accentButton.background
                            : themeStyles.button.background,
                        color:
                          settings.uiScale === scale
                            ? themeStyles.accentButton.color
                            : themeStyles.text,
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {scale.charAt(0).toUpperCase() + scale.slice(1)}
                    </button>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: '11px',
                    color: themeStyles.textSecondary,
                    margin: 0,
                    opacity: 0.7,
                  }}
                >
                  Adjusts spacing and padding throughout the app
                </p>
              </div>

              <div
                style={{
                  ...themeStyles.card,
                  padding: '16px',
                  borderRadius: '6px',
                  border: themeStyles.card.border,
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: themeStyles.text,
                    marginBottom: '12px',
                  }}
                >
                  Line Height: {localLineHeight.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="1.2"
                  max="2.0"
                  step="0.1"
                  value={localLineHeight}
                  onChange={(e) => handleLineHeightChange(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    marginBottom: '8px',
                  }}
                />
                <p
                  style={{
                    fontSize: '11px',
                    color: themeStyles.textSecondary,
                    margin: 0,
                    opacity: 0.7,
                  }}
                >
                  Adjusts the spacing between lines of text
                </p>
              </div>
                  
              <div
                style={{
                  ...themeStyles.card,
                  padding: '16px',
                  borderRadius: '6px',
                  border: themeStyles.card.border,
                }}
              >
                <button
                  onClick={() => setShowResetModal(true)}
                  style={{
                    ...styles.button,
                    ...themeStyles.button,
                    fontSize: '13px',
                    padding: '8px 16px',
                    width: '100%',
                  }}
                >
                  Reset UI Preferences
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <WhatsAppConnectionModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        onConnect={handleWhatsAppConnect}
        onSkip={() => setShowWhatsAppModal(false)}
      />

      <ResetUIPreferencesModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={() => {
          setLocalLineHeight(1.5);
        }}
      />
    </div>
  );
}

const styles = {
  button: {
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.15s ease',
  },
};

