import { AiOutlineSearch, AiOutlineClose } from 'react-icons/ai';
import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface WhatsAppJobsSearchBarProps {
  themeStyles: ThemeStyles;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export function WhatsAppJobsSearchBar({
  themeStyles,
  searchQuery,
  onSearchChange,
  placeholder = 'Search WhatsApp jobs...',
}: WhatsAppJobsSearchBarProps) {
  return (
    <div
      style={{
        position: 'relative',
        marginBottom: 'var(--spacing-sm, 8px)',
      }}
    >
      <AiOutlineSearch
        style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: themeStyles.textSecondary,
          fontSize: '16px',
        }}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px 8px 36px',
          borderRadius: '4px',
          border: themeStyles.card.border,
          background: themeStyles.container.background,
          color: themeStyles.text,
          fontSize: 'var(--font-size, 14px)',
          outline: 'none',
        }}
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange('')}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: themeStyles.textSecondary,
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <AiOutlineClose style={{ fontSize: '14px' }} />
        </button>
      )}
    </div>
  );
}

