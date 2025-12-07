import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { AiOutlineClose, AiOutlineWarning } from 'react-icons/ai';

interface ResetUIPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetUIPreferencesModal({ isOpen, onClose, onConfirm }: ResetUIPreferencesModalProps) {
  const { theme } = useTheme();
  const { resetSettings } = useSettings();

  if (!isOpen) return null;

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  const handleConfirm = () => {
    resetSettings();
    onConfirm();
    onClose();
  };

  return (
    <div style={{ ...styles.overlay, ...themeStyles.overlay }} onClick={onClose}>
      <div
        style={{ ...styles.modal, ...themeStyles.modal }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ ...styles.header, ...themeStyles.header }}>
          <div style={styles.headerLeft}>
            <AiOutlineWarning style={{ marginRight: '8px', fontSize: '20px', color: '#fbbf24' }} />
            <h2 style={{ ...styles.title, ...themeStyles.title }}>Reset UI Preferences</h2>
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
          <p style={{ ...styles.message, ...themeStyles.text }}>
            Are you sure you want to reset all UI preferences to their default values?
          </p>
          <p style={{ ...styles.warning, ...themeStyles.textSecondary }}>
            This will reset:
          </p>
          <ul style={{ ...styles.list, ...themeStyles.textSecondary }}>
            <li>Font size to Medium</li>
            <li>UI scale to Comfortable</li>
            <li>Line height to 1.5</li>
          </ul>
          <p style={{ ...styles.note, ...themeStyles.textSecondary }}>
            This action cannot be undone.
          </p>
        </div>

        <div style={{ ...styles.footer, ...themeStyles.footer }}>
          <button
            onClick={onClose}
            style={{ ...styles.cancelButton, ...themeStyles.cancelButton }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{ ...styles.confirmButton, ...themeStyles.confirmButton }}
          >
            Reset Preferences
          </button>
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
    zIndex: 10001,
  },
  modal: {
    width: '90%',
    maxWidth: '450px',
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
  },
  message: {
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  warning: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
  },
  list: {
    fontSize: '14px',
    lineHeight: '1.8',
    paddingLeft: '20px',
    marginBottom: '16px',
  },
  note: {
    fontSize: '12px',
    fontStyle: 'italic',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid',
  },
  cancelButton: {
    padding: '10px 20px',
    borderRadius: '6px',
    border: '1px solid',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  confirmButton: {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    background: '#fbbf24',
    color: '#000000',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
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
  footer: {
    borderTopColor: '#e1e1e1',
  },
  cancelButton: {
    borderColor: '#e1e1e1',
    color: '#666666',
  },
  confirmButton: {
    backgroundColor: '#fbbf24',
    color: '#000000',
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
  footer: {
    borderTopColor: '#404040',
  },
  cancelButton: {
    borderColor: '#404040',
    color: '#a0a0a0',
  },
  confirmButton: {
    backgroundColor: '#fbbf24',
    color: '#000000',
  },
};

