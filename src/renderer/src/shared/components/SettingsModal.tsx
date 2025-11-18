import React, { useState } from 'react';
import { useSettings, FontSize, UIScale } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { AiOutlineClose, AiOutlineSetting } from 'react-icons/ai';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, setFontSize, setUIScale, setLineHeight, resetSettings, getFontSize } = useSettings();
  const { theme } = useTheme();
  const [localLineHeight, setLocalLineHeight] = useState(settings.lineHeight);

  if (!isOpen) return null;

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const fontSize = getFontSize();

  const handleLineHeightChange = (value: number) => {
    setLocalLineHeight(value);
    setLineHeight(value);
  };

  const handleReset = () => {
    resetSettings();
    setLocalLineHeight(1.5);
  };

  return (
    <div style={{ ...styles.overlay, ...themeStyles.overlay }} onClick={onClose}>
      <div
        style={{ ...styles.modal, ...themeStyles.modal }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ ...styles.header, ...themeStyles.header }}>
          <div style={styles.headerLeft}>
            <AiOutlineSetting style={{ marginRight: '8px', fontSize: `${fontSize + 2}px` }} />
            <h2 style={{ ...styles.title, ...themeStyles.title }}>Settings</h2>
          </div>
          <button
            onClick={onClose}
            style={{ ...styles.closeButton, ...themeStyles.closeButton }}
            aria-label="Close settings"
          >
            <AiOutlineClose />
          </button>
        </div>

        <div style={{ ...styles.content, ...themeStyles.content }}>
          {/* Font Size */}
          <div style={styles.section}>
            <label style={{ ...styles.label, ...themeStyles.label }}>Font Size</label>
            <div style={styles.radioGroup}>
              {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  style={{
                    ...styles.radioButton,
                    ...themeStyles.radioButton,
                    ...(settings.fontSize === size ? themeStyles.radioButtonActive : {}),
                    fontSize: `${fontSize}px`,
                  }}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ ...styles.preview, ...themeStyles.preview, fontSize: `${fontSize}px` }}>
              Preview: The quick brown fox jumps over the lazy dog
            </div>
          </div>

          {/* UI Scale */}
          <div style={styles.section}>
            <label style={{ ...styles.label, ...themeStyles.label }}>UI Scale</label>
            <div style={styles.radioGroup}>
              {(['compact', 'comfortable', 'spacious'] as UIScale[]).map((scale) => (
                <button
                  key={scale}
                  onClick={() => setUIScale(scale)}
                  style={{
                    ...styles.radioButton,
                    ...themeStyles.radioButton,
                    ...(settings.uiScale === scale ? themeStyles.radioButtonActive : {}),
                    fontSize: `${fontSize}px`,
                  }}
                >
                  {scale.charAt(0).toUpperCase() + scale.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ ...styles.hint, ...themeStyles.hint, fontSize: `${fontSize - 2}px` }}>
              Adjusts spacing and padding throughout the app
            </div>
          </div>

          {/* Line Height */}
          <div style={styles.section}>
            <label style={{ ...styles.label, ...themeStyles.label }}>
              Line Height: {localLineHeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="1.2"
              max="2.0"
              step="0.1"
              value={localLineHeight}
              onChange={(e) => handleLineHeightChange(parseFloat(e.target.value))}
              style={styles.slider}
            />
            <div style={{ ...styles.hint, ...themeStyles.hint, fontSize: `${fontSize - 2}px` }}>
              Adjusts the spacing between lines of text
            </div>
          </div>

          {/* Reset Button */}
          <div style={styles.section}>
            <button
              onClick={handleReset}
              style={{ ...styles.resetButton, ...themeStyles.resetButton, fontSize: `${fontSize}px` }}
            >
              Reset to Defaults
            </button>
          </div>
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
    padding: '12px 16px',
    borderBottom: '1px solid',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '16px',
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
    fontSize: '18px',
    borderRadius: '4px',
    transition: 'background 0.2s ease',
  },
  content: {
    padding: '16px',
    overflowY: 'auto' as const,
    flex: 1,
  },
  section: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
  },
  radioGroup: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  radioButton: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    flex: 1,
  },
  preview: {
    padding: '8px',
    borderRadius: '4px',
    marginTop: '8px',
  },
  hint: {
    marginTop: '4px',
    opacity: 0.7,
  },
  slider: {
    width: '100%',
    marginTop: '8px',
    marginBottom: '4px',
  },
  resetButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid',
    background: 'transparent',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    width: '100%',
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
  label: {
    color: '#000000',
  },
  radioButton: {
    borderColor: '#e1e1e1',
    color: '#000000',
  },
  radioButtonActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
    color: '#000000',
  },
  preview: {
    backgroundColor: '#f8f9fa',
    color: '#000000',
    border: '1px solid #e1e1e1',
  },
  hint: {
    color: '#666666',
  },
  resetButton: {
    borderColor: '#e1e1e1',
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
  label: {
    color: '#f5f5f5',
  },
  radioButton: {
    borderColor: '#404040',
    color: '#f5f5f5',
  },
  radioButtonActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
    color: '#000000',
  },
  preview: {
    backgroundColor: '#1a1a1a',
    color: '#f5f5f5',
    border: '1px solid #404040',
  },
  hint: {
    color: '#a0a0a0',
  },
  resetButton: {
    borderColor: '#404040',
    color: '#f5f5f5',
  },
};

