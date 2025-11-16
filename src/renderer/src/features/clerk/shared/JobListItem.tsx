import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles, sharedStyles } from './clerkStyles';
import { getStatusColor } from './utils';
import {
  AiOutlineCheckCircle,
  AiOutlineClockCircle,
  AiOutlineCloseCircle,
  AiOutlinePrinter,
  AiOutlineFile,
} from 'react-icons/ai';

interface JobListItemProps {
  job: any;
  isSelected: boolean;
  onSelect: () => void;
}

export function JobListItem({ job, isSelected, onSelect }: JobListItemProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  const getStatusIcon = () => {
    const status = job.status?.toLowerCase();
    if (status === 'completed') {
      return <AiOutlineCheckCircle style={{ fontSize: 'var(--icon-size-sm, 14px)' }} />;
    }
    if (status === 'pending' || status === 'queued') {
      return <AiOutlineClockCircle style={{ fontSize: 'var(--icon-size-sm, 14px)' }} />;
    }
    if (status === 'processing' || status === 'printing') {
      return <AiOutlinePrinter style={{ fontSize: 'var(--icon-size-sm, 14px)' }} />;
    }
    if (status === 'failed') {
      return <AiOutlineCloseCircle style={{ fontSize: 'var(--icon-size-sm, 14px)' }} />;
    }
    return <AiOutlineFile style={{ fontSize: 'var(--icon-size-sm, 14px)' }} />;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const statusColor = getStatusColor(job.status, themeStyles);
  const status = job.status?.toLowerCase() || 'unknown';

  return (
    <div
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = theme === 'dark' 
            ? 'rgba(255, 255, 255, 0.03)' 
            : 'rgba(0, 0, 0, 0.02)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = themeStyles.card.background;
        }
      }}
      style={{
        ...sharedStyles.jobItem,
        ...themeStyles.card,
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        position: 'relative',
        borderLeft: isSelected ? `3px solid ${themeStyles.accent}` : '3px solid transparent',
        background: isSelected
          ? theme === 'dark'
            ? 'rgba(251, 191, 36, 0.08)'
            : 'rgba(251, 191, 36, 0.04)'
          : themeStyles.card.background,
        padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
        border: 'none',
        borderBottom: themeStyles.card.border,
        borderRadius: 0,
        boxShadow: 'none',
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm, 8px)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: 'var(--border-radius-sm, 4px)',
            background:
              status === 'completed'
                ? 'rgba(34, 197, 94, 0.1)'
                : status === 'failed'
                ? 'rgba(239, 68, 68, 0.1)'
                : status === 'processing' || status === 'printing'
                ? 'rgba(251, 158, 11, 0.1)'
                : 'rgba(148, 163, 184, 0.1)',
            color: statusColor,
            flexShrink: 0,
          }}
        >
          {getStatusIcon()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              color: themeStyles.text,
              fontWeight: '500',
              fontSize: 'var(--font-size, 14px)',
              margin: 0,
              marginBottom: 'var(--spacing-xs, 4px)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={job.artwork || job.fileName}
          >
            {job.artwork || job.fileName || 'Untitled Job'}
          </p>
          <p
            style={{
              color: themeStyles.textSecondary,
              fontSize: 'var(--font-size-small, 12px)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs, 4px)',
              flexWrap: 'wrap',
            }}
          >
              {job.printerName && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <AiOutlinePrinter style={{ fontSize: 'var(--icon-size-sm, 14px)' }} />
                  {job.printerName}
                </span>
              )}
              {job.printerName && (job.copies || job.createdAt) && <span>•</span>}
              {job.copies && (
                <span>
                  {job.copies} {job.copies === 1 ? 'copy' : 'copies'}
                </span>
              )}
              {(job.copies || job.printerName) && job.createdAt && <span>•</span>}
              {job.createdAt && (
                <span>
                  {formatDate(job.createdAt || job.submittedAt)}
                </span>
              )}
            </p>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm, 8px)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: statusColor,
              fontWeight: '500',
              textTransform: 'uppercase',
              fontSize: 'var(--font-size-small, 12px)',
              letterSpacing: '0.3px',
              padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
              borderRadius: 'var(--border-radius-sm, 4px)',
              background:
                status === 'completed'
                  ? 'rgba(34, 197, 94, 0.1)'
                  : status === 'failed'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : status === 'processing' || status === 'printing'
                  ? 'rgba(251, 158, 11, 0.1)'
                  : 'rgba(148, 163, 184, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs, 4px)',
            }}
          >
            {getStatusIcon()}
            {job.status || 'unknown'}
          </span>
        </div>
    </div>
  );
}
