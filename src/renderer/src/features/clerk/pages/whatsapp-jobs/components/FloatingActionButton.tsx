import { AiOutlineFileText } from 'react-icons/ai';
import type { ThemeStyles } from './types';

interface FloatingActionButtonProps {
  themeStyles: ThemeStyles;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

export function FloatingActionButton({
  themeStyles,
  onClick,
  disabled = false,
  label = 'Create Quote',
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '40px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: 'none',
        background: themeStyles.primaryButton.background,
        color: themeStyles.primaryButton.color,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        transition: 'transform 0.2s, box-shadow 0.2s',
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)';
      }}
      title={label}
    >
      <AiOutlineFileText style={{ fontSize: '24px' }} />
    </button>
  );
}

