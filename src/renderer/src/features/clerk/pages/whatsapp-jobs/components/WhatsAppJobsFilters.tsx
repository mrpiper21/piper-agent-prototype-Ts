import { AiOutlineFilter } from 'react-icons/ai';
import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

export type SortOption = 'newest' | 'oldest' | 'status' | 'filename';
export type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'failed';

interface WhatsAppJobsFiltersProps {
  themeStyles: ThemeStyles;
  statusFilter: StatusFilter;
  sortBy: SortOption;
  showFilters: boolean;
  onStatusFilterChange: (filter: StatusFilter) => void;
  onSortByChange: (sort: SortOption) => void;
  onToggleFilters: () => void;
}

export function WhatsAppJobsFilters({
  themeStyles,
  statusFilter,
  sortBy,
  showFilters,
  onStatusFilterChange,
  onSortByChange,
  onToggleFilters,
}: WhatsAppJobsFiltersProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--spacing-xs, 4px)',
        alignItems: 'center',
      }}
    >
      <button
        onClick={onToggleFilters}
        style={{
          padding: '6px 12px',
          borderRadius: '4px',
          border: themeStyles.card.border,
          background: showFilters ? themeStyles.accent : themeStyles.container.background,
          color: showFilters ? '#000' : themeStyles.text,
          cursor: 'pointer',
          fontSize: 'var(--font-size-small, 12px)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <AiOutlineFilter style={{ fontSize: '14px' }} />
        Filters
      </button>
      {showFilters && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-xs, 4px)',
            flex: 1,
          }}
        >
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '4px',
              border: themeStyles.card.border,
              background: themeStyles.container.background,
              color: themeStyles.text,
              fontSize: 'var(--font-size-small, 12px)',
              outline: 'none',
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortOption)}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '4px',
              border: themeStyles.card.border,
              background: themeStyles.container.background,
              color: themeStyles.text,
              fontSize: 'var(--font-size-small, 12px)',
              outline: 'none',
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="status">By Status</option>
            <option value="filename">By Filename</option>
          </select>
        </div>
      )}
    </div>
  );
}

